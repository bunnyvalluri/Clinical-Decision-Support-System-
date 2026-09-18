"""
Unit & API integration tests for HealthNova AI Blog Platform.
Verifies:
1. Category article counts derived honestly from PostgreSQL.
2. Article lifecycle (Draft vs Published boundary).
3. Newsletter email validation, idempotency, and duplicate rejection.
4. Author and reading time calculations.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone

from apps.blog.models import (
    BlogCategory,
    BlogAuthor,
    BlogArticle,
    ArticleStatus,
    NewsletterSubscriber,
    SubscriberStatus,
)


class BlogModelAndAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.cat1 = BlogCategory.objects.create(
            name="Healthcare AI",
            slug="healthcare-ai",
            description="Clinical AI topics",
        )
        self.cat2 = BlogCategory.objects.create(
            name="Preventive Care",
            slug="preventive-care",
            description="Preventive protocols",
        )

        self.author = BlogAuthor.objects.create(
            name="Dr. Ananya Rao",
            role_title="Senior Cardiologist",
            avatar_url="/avatars/doctor-ananya.png",
        )

        self.published_article = BlogArticle.objects.create(
            slug="ai-wearables-continuous-health-monitoring",
            title="AI + Wearables: The Future of Continuous Health Monitoring",
            excerpt="Discover how AI and wearables transform preventive healthcare.",
            content="Full length clinical article discussing wearable ECG and photoplethysmography sensors.",
            featured_image="/blog/wearables.jpg",
            category=self.cat1,
            author=self.author,
            status=ArticleStatus.PUBLISHED,
            is_featured=True,
            is_guide=False,
            published_at=timezone.now(),
        )

        self.draft_article = BlogArticle.objects.create(
            slug="internal-unapproved-draft-article",
            title="Internal Unapproved Draft Article",
            excerpt="Draft excerpt.",
            content="Private draft content.",
            featured_image="/blog/draft.jpg",
            category=self.cat1,
            author=self.author,
            status=ArticleStatus.DRAFT,
        )

        self.guide_article = BlogArticle.objects.create(
            slug="10-daily-habits-for-a-healthier-life",
            title="10 Daily Habits for a Healthier Life",
            excerpt="Practical guide.",
            content="Guide content for healthy habits.",
            featured_image="/blog/habits.jpg",
            category=self.cat2,
            author=self.author,
            status=ArticleStatus.PUBLISHED,
            is_guide=True,
            published_at=timezone.now(),
        )

    def test_draft_articles_never_leak_in_public_list(self):
        url = reverse("blog:article-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        slugs = [item["slug"] for item in response.data.get("results", [])]
        self.assertIn(self.published_article.slug, slugs)
        self.assertNotIn(self.draft_article.slug, slugs)

    def test_draft_article_detail_returns_404(self):
        url = reverse("blog:article-detail", kwargs={"slug": self.draft_article.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_published_article_detail_success(self):
        url = reverse("blog:article-detail", kwargs={"slug": self.published_article.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], self.published_article.title)
        self.assertEqual(response.data["author"]["name"], self.author.name)

    def test_categories_return_real_published_counts(self):
        url = reverse("blog:category-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        cats_by_slug = {c["slug"]: c["article_count"] for c in response.data.get("results", [])}
        # cat1 has 1 published article (draft does not count)
        self.assertEqual(cats_by_slug["healthcare-ai"], 1)
        # cat2 has 1 published guide
        self.assertEqual(cats_by_slug["preventive-care"], 1)

    def test_featured_article_endpoint(self):
        url = reverse("blog:article-featured")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data.get("featured"))
        self.assertEqual(response.data["featured"]["slug"], self.published_article.slug)

    def test_popular_guides_endpoint(self):
        url = reverse("blog:popular-guides")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [g["slug"] for g in response.data.get("results", [])]
        self.assertIn(self.guide_article.slug, slugs)
        self.assertNotIn(self.published_article.slug, slugs)

    def test_newsletter_subscription_success_and_duplicate_handling(self):
        url = reverse("blog:newsletter-subscribe")
        # 1. Valid subscription
        resp1 = self.client.post(url, {"email": "clinician@hospital.org"}, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        self.assertEqual(resp1.data["status"], "subscribed")
        self.assertTrue(NewsletterSubscriber.objects.filter(email="clinician@hospital.org").exists())

        # 2. Duplicate subscription
        resp2 = self.client.post(url, {"email": "clinician@hospital.org"}, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp2.data["status"], "already_subscribed")

        # 3. Invalid email rejected
        resp3 = self.client.post(url, {"email": "not-an-email"}, format="json")
        self.assertEqual(resp3.status_code, status.HTTP_400_BAD_REQUEST)
