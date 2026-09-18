"""
Serializers for HealthNova AI Blog REST APIs.
"""
from rest_framework import serializers
from .models import (
    BlogCategory,
    BlogAuthor,
    BlogArticle,
    BlogArticleBookmark,
    NewsletterSubscriber,
    ArticleStatus,
)


class BlogCategorySerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = BlogCategory
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon_name",
            "order",
            "article_count",
        ]


class BlogAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogAuthor
        fields = [
            "id",
            "name",
            "role_title",
            "avatar_url",
            "bio",
        ]


class BlogArticleListSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    author = BlogAuthorSerializer(read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = BlogArticle
        fields = [
            "id",
            "slug",
            "title",
            "excerpt",
            "featured_image",
            "category",
            "author",
            "tags",
            "is_featured",
            "is_guide",
            "reading_time_minutes",
            "published_at",
            "views_count",
            "is_bookmarked",
        ]

    def get_is_bookmarked(self, obj) -> bool:
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            # Efficiently evaluate through preloaded set if available
            bookmarked_ids = getattr(request, "_preloaded_bookmarked_ids", None)
            if bookmarked_ids is not None:
                return str(obj.id) in bookmarked_ids
            return BlogArticleBookmark.objects.filter(user=request.user, article=obj).exists()
        return False


class BlogArticleDetailSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    author = BlogAuthorSerializer(read_only=True)
    is_bookmarked = serializers.SerializerMethodField()
    related_articles = serializers.SerializerMethodField()

    class Meta:
        model = BlogArticle
        fields = [
            "id",
            "slug",
            "title",
            "excerpt",
            "content",
            "featured_image",
            "category",
            "author",
            "tags",
            "is_featured",
            "is_guide",
            "reading_time_minutes",
            "medical_review_status",
            "reviewed_at",
            "views_count",
            "seo_title",
            "seo_description",
            "canonical_url",
            "published_at",
            "updated_at",
            "is_bookmarked",
            "related_articles",
        ]

    def get_is_bookmarked(self, obj) -> bool:
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return BlogArticleBookmark.objects.filter(user=request.user, article=obj).exists()
        return False

    def get_related_articles(self, obj):
        related = (
            BlogArticle.objects.filter(status=ArticleStatus.PUBLISHED, category=obj.category)
            .exclude(id=obj.id)
            .select_related("category", "author")[:3]
        )
        return BlogArticleListSerializer(related, many=True, context=self.context).data


class NewsletterSubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if not normalized or "@" not in normalized:
            raise serializers.ValidationError("Please provide a valid institutional or personal email address.")
        return normalized
