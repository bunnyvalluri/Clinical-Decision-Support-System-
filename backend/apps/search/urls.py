"""
URL Routing for Search Platform API.
Mounted at /api/v1/search/
"""
from django.urls import path
from .views import (
    SearchQueryView,
    SearchSuggestionsView,
    SearchFacetsView,
    SearchHealthView,
    SearchReindexView,
    SearchIndexesView,
    SearchTasksView,
    SearchTenantTokenView,
)

app_name = "search"

urlpatterns = [
    path("", SearchQueryView.as_view(), name="search-query"),
    path("suggestions/", SearchSuggestionsView.as_view(), name="search-suggestions"),
    path("facets/", SearchFacetsView.as_view(), name="search-facets"),
    path("health/", SearchHealthView.as_view(), name="search-health"),
    path("reindex/", SearchReindexView.as_view(), name="search-reindex"),
    path("indexes/", SearchIndexesView.as_view(), name="search-indexes"),
    path("tasks/", SearchTasksView.as_view(), name="search-tasks"),
    path("tenant-token/", SearchTenantTokenView.as_view(), name="search-tenant-token"),
]
