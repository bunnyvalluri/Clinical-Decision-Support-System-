"""
Core app URLs — liveness, readiness, task tracking, and system-level endpoints.
"""
from django.urls import path

from apps.core.task_views import TaskStatusView
from apps.core.views import (
    CeleryHealthView,
    DatabaseHealthView,
    HealthCheckView,
    HealthReadinessView,
    MetricsView,
    RedisHealthView,
)

app_name = "core"

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health_liveness"),
    path("health/ready/", HealthReadinessView.as_view(), name="health_readiness"),
    path("health/metrics/", MetricsView.as_view(), name="health_metrics"),
    path("health/db/", DatabaseHealthView.as_view(), name="health_database"),
    path("health/redis/", RedisHealthView.as_view(), name="health_redis"),
    path("health/celery/", CeleryHealthView.as_view(), name="health_celery"),
    path("tasks/<str:task_id>/", TaskStatusView.as_view(), name="task_status"),
]
