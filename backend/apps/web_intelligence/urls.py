"""
URL routing for Web Intelligence API.
"""
from django.urls import path
from .views import (
    AdminHealthAPIView,
    BatchScrapeWebAPIView,
    CrawlJobCancelAPIView,
    CrawlJobDetailAPIView,
    CrawlJobListAPIView,
    CrawlWebAPIView,
    ExtractWebAPIView,
    MapWebAPIView,
    ResearchSessionCreateAPIView,
    ResearchSessionDetailAPIView,
    ResearchSessionReviewAPIView,
    ScrapeWebAPIView,
    SearchWebAPIView,
    WebDocumentListAPIView,
    WebSourceCreateAPIView,
    WebSourceListAPIView,
)

app_name = "web_intelligence"

urlpatterns = [
    # Core retrieval actions
    path("search/", SearchWebAPIView.as_view(), name="search"),
    path("scrape/", ScrapeWebAPIView.as_view(), name="scrape"),
    path("map/", MapWebAPIView.as_view(), name="map"),
    path("crawl/", CrawlWebAPIView.as_view(), name="crawl"),
    path("batch/", BatchScrapeWebAPIView.as_view(), name="batch"),
    path("extract/", ExtractWebAPIView.as_view(), name="extract"),
    # Evidence Research sessions
    path("research/", ResearchSessionCreateAPIView.as_view(), name="research-create"),
    path("research/<uuid:session_id>/", ResearchSessionDetailAPIView.as_view(), name="research-detail"),
    path("research/<uuid:session_id>/review/", ResearchSessionReviewAPIView.as_view(), name="research-review"),
    # Asynchronous jobs
    path("jobs/", CrawlJobListAPIView.as_view(), name="jobs-list"),
    path("jobs/<uuid:job_id>/", CrawlJobDetailAPIView.as_view(), name="job-detail"),
    path("jobs/<uuid:job_id>/cancel/", CrawlJobCancelAPIView.as_view(), name="job-cancel"),
    # Sources & domain policies
    path("sources/", WebSourceListAPIView.as_view(), name="sources-list"),
    path("sources/manage/", WebSourceCreateAPIView.as_view(), name="sources-manage"),
    path("documents/", WebDocumentListAPIView.as_view(), name="documents-list"),
    # IT Admin health and telemetry
    path("admin/health/", AdminHealthAPIView.as_view(), name="admin-health"),
]
