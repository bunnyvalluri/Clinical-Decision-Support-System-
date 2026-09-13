"""Audit app URLs."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.audit.views import AuditLogViewSet

app_name = "audit"

router = DefaultRouter()
router.register(r"", AuditLogViewSet, basename="audit-log")

urlpatterns = [
    path("", include(router.urls)),
]
