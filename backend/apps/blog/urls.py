"""
URL routing for HealthNova AI Blog REST API.
"""
from django.urls import path
from .views import (
    BlogArticleListView,
    BlogArticleDetailView,
    FeaturedArticleView,
    PopularGuidesListView,
    BlogCategoryListView,
    BlogSearchView,
    NewsletterSubscribeView,
    BookmarkToggleView,
)

app_name = "blog"

urlpatterns = [
    # Articles
    path("articles/", BlogArticleListView.as_view(), name="article-list"),
    path("articles/<slug:slug>/", BlogArticleDetailView.as_view(), name="article-detail"),
    path("articles/<uuid:article_id>/bookmark/", BookmarkToggleView.as_view(), name="article-bookmark"),

    # Highlights & Aggregations
    path("featured/", FeaturedArticleView.as_view(), name="article-featured"),
    path("guides/", PopularGuidesListView.as_view(), name="popular-guides"),
    path("categories/", BlogCategoryListView.as_view(), name="category-list"),

    # Search & Newsletter
    path("search/", BlogSearchView.as_view(), name="blog-search"),
    path("newsletter/subscribe/", NewsletterSubscribeView.as_view(), name="newsletter-subscribe"),
]
