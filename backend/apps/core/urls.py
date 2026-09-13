"""
Core app URLs — liveness, readiness, and system-level endpoints.
"""
from django.urls import path

from apps.core.views import HealthCheckView, HealthReadinessView

app_name = "core"

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health_liveness"),
    path("health/ready/", HealthReadinessView.as_view(), name="health_readiness"),
]
