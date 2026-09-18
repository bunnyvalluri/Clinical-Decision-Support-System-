"""
REST Framework Views for HealthNova AI Blog & Educational Platform.
Provides publicly accessible endpoints for published content, rate-limited newsletter,
and authenticated bookmark management.
"""
import logging
from rest_framework import permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from django.shortcuts import get_object_or_404

from .models import (
    BlogArticle,
    BlogCategory,
    BlogArticleBookmark,
    ArticleStatus,
)
from .serializers import (
    BlogArticleListSerializer,
    BlogArticleDetailSerializer,
    BlogCategorySerializer,
    NewsletterSubscribeSerializer,
)
from .services import (
    BlogArticleService,
    BlogSearchService,
    NewsletterService,
)

logger = logging.getLogger(__name__)


class StandardBlogPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = "page_size"
    max_page_size = 30


class BlogArticleListView(ListAPIView):
    """
    Public listing of published articles with category and keyword filtering.
    GET /api/v1/blog/articles/?category=slug&q=query&sort=newest&page=1
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = BlogArticleListSerializer
    pagination_class = StandardBlogPagination

    def get_queryset(self):
        category = self.request.query_params.get("category")
        q = self.request.query_params.get("q")
        sort = self.request.query_params.get("sort", "newest")
        return BlogArticleService.get_published_articles(
            category_slug=category,
            search_query=q,
            is_guide=False,  # Exclude strictly popular guides from standard recent articles grid
            sort=sort,
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.user and self.request.user.is_authenticated:
            # Preload user's bookmarked article IDs to avoid N+1 queries
            bookmarked_ids = set(
                BlogArticleBookmark.objects.filter(user=self.request.user)
                .values_list("article_id", flat=True)
            )
            setattr(self.request, "_preloaded_bookmarked_ids", {str(bid) for bid in bookmarked_ids})
        return context


class BlogArticleDetailView(RetrieveAPIView):
    """
    Public detail of an authoritative article by slug.
    GET /api/v1/blog/articles/{slug}/
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = BlogArticleDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return BlogArticle.objects.filter(
            status=ArticleStatus.PUBLISHED
        ).select_related("category", "author")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Telemetry: increment view count safely
        BlogArticleService.increment_view_count(instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FeaturedArticleView(APIView):
    """
    GET /api/v1/blog/featured/
    Returns the primary featured article or honest empty state.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        featured = BlogArticleService.get_featured_article()
        if not featured:
            return Response(
                {"featured": None, "message": "No featured stories published yet."},
                status=status.HTTP_200_OK,
            )
        serializer = BlogArticleListSerializer(featured, context={"request": request})
        return Response({"featured": serializer.data}, status=status.HTTP_200_OK)


class PopularGuidesListView(APIView):
    """
    GET /api/v1/blog/guides/
    Returns concise practical guides for the bottom hub.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        guides = BlogArticleService.get_popular_guides(limit=4)
        serializer = BlogArticleListSerializer(guides, many=True, context={"request": request})
        return Response({"results": serializer.data, "count": len(guides)}, status=status.HTTP_200_OK)


class BlogCategoryListView(APIView):
    """
    GET /api/v1/blog/categories/
    Returns educational categories with real PostgreSQL published article count.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = BlogArticleService.get_categories_with_counts()
        serializer = BlogCategorySerializer(categories, many=True)
        return Response({"results": serializer.data, "count": len(serializer.data)}, status=status.HTTP_200_OK)


class BlogSearchView(APIView):
    """
    GET /api/v1/blog/search/?q=term
    Fast full-text article search with resilience.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "")
        results = BlogSearchService.search_articles(query=query, limit=15)
        return Response({"results": results, "count": len(results)}, status=status.HTTP_200_OK)


class NewsletterSubscribeView(APIView):
    """
    POST /api/v1/blog/newsletter/subscribe/
    Rate-limited email subscription for clinical and educational newsletters.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = NewsletterSubscribeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]
        # Extract IP address for audit/rate-limiting
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")

        result = NewsletterService.subscribe(email=email, ip_address=ip)
        return Response({"success": True, **result}, status=status.HTTP_200_OK)


class BookmarkToggleView(APIView):
    """
    POST /api/v1/blog/articles/{id}/bookmark/
    Authenticated toggle for user reading lists.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, article_id):
        article = get_object_or_404(BlogArticle, id=article_id, status=ArticleStatus.PUBLISHED)
        bookmark, created = BlogArticleBookmark.objects.get_or_create(
            user=request.user,
            article=article,
        )
        if not created:
            bookmark.delete()
            return Response({"bookmarked": False, "message": "Bookmark removed."})
        return Response({"bookmarked": True, "message": "Article saved to bookmarks."})
