"""
Reports routing configuration.
"""
from rest_framework.routers import DefaultRouter

from apps.reports.views import ReportViewSet

app_name = "reports"

router = DefaultRouter()
router.register(r"", ReportViewSet, basename="report")

urlpatterns = router.urls
