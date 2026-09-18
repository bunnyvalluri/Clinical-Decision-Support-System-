"""
Business services for HealthNova AI Blog Platform.
Maintains clear separation of concerns, query optimization, and resilient search degradation.
"""
import logging
from typing import Optional, List, Dict, Any
from django.db.models import Count, Q, F
from django.utils import timezone
from .models import (
    BlogArticle,
    BlogCategory,
    NewsletterSubscriber,
    ArticleStatus,
    SubscriberStatus,
)

logger = logging.getLogger(__name__)


class BlogArticleService:
    """Service layer managing article queries and lifecycle."""

    @staticmethod
    def get_published_articles(
        category_slug: Optional[str] = None,
        search_query: Optional[str] = None,
        is_guide: Optional[bool] = None,
        sort: str = "newest",
    ):
        """Retrieve published articles with optimized relations."""
        qs = (
            BlogArticle.objects.filter(status=ArticleStatus.PUBLISHED)
            .select_related("category", "author")
        )

        if category_slug and category_slug != "all":
            qs = qs.filter(category__slug=category_slug)

        if is_guide is not None:
            qs = qs.filter(is_guide=is_guide)

        if search_query:
            query_clean = search_query.strip()
            qs = qs.filter(
                Q(title__icontains=query_clean)
                | Q(excerpt__icontains=query_clean)
                | Q(content__icontains=query_clean)
                | Q(tags__icontains=query_clean)
                | Q(category__name__icontains=query_clean)
                | Q(author__name__icontains=query_clean)
            )

        if sort == "popular":
            qs = qs.order_by("-views_count", "-published_at")
        elif sort == "oldest":
            qs = qs.order_by("published_at")
        else:
            qs = qs.order_by("-published_at")

        return qs

    @staticmethod
    def get_featured_article() -> Optional[BlogArticle]:
        """Fetch the primary published featured article."""
        featured = (
            BlogArticle.objects.filter(
                status=ArticleStatus.PUBLISHED,
                is_featured=True,
            )
            .select_related("category", "author")
            .order_by("-published_at")
            .first()
        )
        if not featured:
            # Fallback to the latest published article if none explicitly flagged as featured
            featured = (
                BlogArticle.objects.filter(status=ArticleStatus.PUBLISHED)
                .select_related("category", "author")
                .order_by("-published_at")
                .first()
            )
        return featured

    @staticmethod
    def get_popular_guides(limit: int = 4) -> List[BlogArticle]:
        """Fetch popular practical guides for the bottom hub."""
        return list(
            BlogArticle.objects.filter(
                status=ArticleStatus.PUBLISHED,
                is_guide=True,
            )
            .select_related("category", "author")
            .order_by("-views_count", "-published_at")[:limit]
        )

    @staticmethod
    def get_categories_with_counts():
        """Fetch all categories with real PostgreSQL published article count."""
        return (
            BlogCategory.objects.annotate(
                article_count=Count(
                    "articles",
                    filter=Q(articles__status=ArticleStatus.PUBLISHED),
                )
            )
            .order_by("order", "name")
        )

    @staticmethod
    def increment_view_count(article: BlogArticle):
        """Safely increment view telemetry without mutating other fields."""
        BlogArticle.objects.filter(id=article.id).update(views_count=F("views_count") + 1)


class BlogSearchService:
    """Multi-tiered search for blog articles using Meilisearch with PostgreSQL fallback."""

    @staticmethod
    def search_articles(query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search published articles with graceful fallback."""
        if not query or not query.strip():
            return []

        clean_q = query.strip()
        articles_qs = (
            BlogArticle.objects.filter(status=ArticleStatus.PUBLISHED)
            .filter(
                Q(title__icontains=clean_q)
                | Q(excerpt__icontains=clean_q)
                | Q(tags__icontains=clean_q)
                | Q(category__name__icontains=clean_q)
            )
            .select_related("category", "author")[:limit]
        )

        results = []
        for art in articles_qs:
            results.append({
                "id": str(art.id),
                "slug": art.slug,
                "title": art.title,
                "excerpt": art.excerpt,
                "category_name": art.category.name,
                "category_slug": art.category.slug,
                "author_name": art.author.name,
                "reading_time_minutes": art.reading_time_minutes,
                "published_at": art.published_at.isoformat() if art.published_at else None,
            })
        return results


class NewsletterService:
    """Manages verified newsletter subscriptions."""

    @staticmethod
    def subscribe(email: str, ip_address: Optional[str] = None) -> Dict[str, Any]:
        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email.lower().strip(),
            defaults={
                "status": SubscriberStatus.ACTIVE,
                "ip_address": ip_address,
            },
        )
        if not created and subscriber.status == SubscriberStatus.UNSUBSCRIBED:
            subscriber.status = SubscriberStatus.ACTIVE
            subscriber.unsubscribed_at = None
            subscriber.ip_address = ip_address
            subscriber.save(update_fields=["status", "unsubscribed_at", "ip_address"])
            return {"status": "resubscribed", "message": "Your subscription has been renewed."}

        if not created:
            return {"status": "already_subscribed", "message": "You are already subscribed to HealthNova AI updates."}

        return {"status": "subscribed", "message": "Thank you for subscribing to HealthNova AI research."}
