"""
URL routing for Security Testing & DevSecOps app.
All endpoints are rooted under /api/v1/security/.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.security_testing.views import (
    SecurityTargetViewSet,
    SecurityScanViewSet,
    SecurityFindingViewSet,
    SecurityReportViewSet,
    SecurityAuditEventViewSet,
    SecurityToolInventoryView,
    SecurityMetricsView,
)

app_name = "security_testing"

router = DefaultRouter()
router.register(r"targets", SecurityTargetViewSet, basename="security-targets")
router.register(r"scans", SecurityScanViewSet, basename="security-scans")
router.register(r"findings", SecurityFindingViewSet, basename="security-findings")
router.register(r"reports", SecurityReportViewSet, basename="security-reports")
router.register(r"audit", SecurityAuditEventViewSet, basename="security-audit")

urlpatterns = [
    path("tools/", SecurityToolInventoryView.as_view(), name="security-tools"),
    path("metrics/", SecurityMetricsView.as_view(), name="security-metrics"),
    path("", include(router.urls)),
]
