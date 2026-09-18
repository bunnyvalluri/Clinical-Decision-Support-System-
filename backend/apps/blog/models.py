"""
PostgreSQL Models for HealthNova AI Blog & Educational Intelligence Platform.

Architectural Standard:
- Neon PostgreSQL is the sole authoritative store.
- Strict lifecycle states: DRAFT, REVIEW, APPROVED, PUBLISHED, ARCHIVED.
- Zero PHI or patient identifying information in blog content.
"""
import math
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class BlogCategory(models.Model):
    """Educational & clinical category classifications."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    description = models.TextField(blank=True, default="")
    icon_name = models.CharField(max_length=50, blank=True, default="BookOpen")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "blog_categories"
        verbose_name = "Blog Category"
        verbose_name_plural = "Blog Categories"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogAuthor(models.Model):
    """Verified clinical and technical content authors."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_author_profiles",
    )
    name = models.CharField(max_length=150)
    role_title = models.CharField(max_length=150, help_text="Clinical or technical role")
    avatar_url = models.CharField(max_length=500, blank=True, default="/avatars/default-doctor.png")
    bio = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "blog_authors"
        verbose_name = "Blog Author"
        verbose_name_plural = "Blog Authors"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.role_title})"


class ArticleStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    REVIEW = "REVIEW", "Under Review"
    APPROVED = "APPROVED", "Approved"
    PUBLISHED = "PUBLISHED", "Published"
    ARCHIVED = "ARCHIVED", "Archived"


class MedicalReviewStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Review"
    VERIFIED = "VERIFIED", "Clinically Verified"
    NOT_APPLICABLE = "NOT_APPLICABLE", "Not Applicable"


class BlogArticle(models.Model):
    """Authoritative educational and research articles."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    excerpt = models.TextField(help_text="Short teaser description for card preview")
    content = models.TextField(help_text="Full markdown or sanitized article content")
    featured_image = models.CharField(
        max_length=500,
        default="/blog/default-cover.jpg",
        help_text="Local or object storage cover image URL",
    )
    category = models.ForeignKey(
        BlogCategory,
        on_delete=models.PROTECT,
        related_name="articles",
    )
    author = models.ForeignKey(
        BlogAuthor,
        on_delete=models.PROTECT,
        related_name="articles",
    )
    tags = models.JSONField(default=list, blank=True)

    status = models.CharField(
        max_length=20,
        choices=ArticleStatus.choices,
        default=ArticleStatus.DRAFT,
        db_index=True,
    )
    is_featured = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Primary highlight article on the blog index",
    )
    is_guide = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Classified as a concise practical guide for Popular Guides",
    )
    reading_time_minutes = models.PositiveIntegerField(default=5)

    # Clinical safety review fields
    medical_review_status = models.CharField(
        max_length=20,
        choices=MedicalReviewStatus.choices,
        default=MedicalReviewStatus.NOT_APPLICABLE,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_blog_articles",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    # Real engagement telemetry
    views_count = models.PositiveIntegerField(default=0)

    # SEO metadata
    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.TextField(blank=True, default="")
    canonical_url = models.CharField(max_length=500, blank=True, default="")

    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "blog_articles"
        verbose_name = "Blog Article"
        verbose_name_plural = "Blog Articles"
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "-published_at"]),
            models.Index(fields=["category", "status"]),
            models.Index(fields=["is_featured", "status"]),
            models.Index(fields=["is_guide", "status"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if not self.reading_time_minutes and self.content:
            word_count = len(self.content.split())
            self.reading_time_minutes = max(1, math.ceil(word_count / 200))
        if self.status == ArticleStatus.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)


class BlogArticleBookmark(models.Model):
    """User-specific bookmarks for authenticated clinical personnel or patients."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blog_bookmarks",
    )
    article = models.ForeignKey(
        BlogArticle,
        on_delete=models.CASCADE,
        related_name="bookmarks",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "blog_article_bookmarks"
        unique_together = ("user", "article")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user_id} - {self.article.title}"


class SubscriberStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    UNSUBSCRIBED = "UNSUBSCRIBED", "Unsubscribed"


class NewsletterSubscriber(models.Model):
    """Validated email subscriptions for healthcare research digests."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=SubscriberStatus.choices,
        default=SubscriberStatus.ACTIVE,
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "blog_newsletter_subscribers"
        ordering = ["-subscribed_at"]

    def __str__(self):
        return self.email
