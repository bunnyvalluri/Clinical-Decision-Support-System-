"""
Core app URLs — liveness, readiness, task tracking, and system-level endpoints.
"""
from django.urls import path

from apps.core.admin_views import (
    admin_assign_user_role_view,
    admin_audit_logs_view,
    admin_celery_status_view,
    admin_health_overview_view,
    admin_toggle_user_active_view,
    admin_users_list_view,
)
from apps.core.observability_views import (
    ObservabilityAlertsView,
    ObservabilityHealthView,
    ObservabilityIncidentsView,
    ObservabilityIncidentTransitionView,
    ObservabilityMetricsView,
    ObservabilityOverviewView,
)
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
    # Observability & Reliability Platform Endpoints
    path("observability/overview/", ObservabilityOverviewView.as_view(), name="observability_overview"),
    path("observability/health/", ObservabilityHealthView.as_view(), name="observability_health"),
    path("observability/metrics/", ObservabilityMetricsView.as_view(), name="observability_metrics"),
    path("observability/alerts/", ObservabilityAlertsView.as_view(), name="observability_alerts"),
    path("observability/incidents/", ObservabilityIncidentsView.as_view(), name="observability_incidents"),
    path("observability/incidents/<str:incident_id>/", ObservabilityIncidentTransitionView.as_view(), name="observability_incident_transition"),
    # IT System Administrator endpoints
    path("admin/health/", admin_health_overview_view, name="admin_health_overview"),
    path("admin/users/", admin_users_list_view, name="admin_users_list"),
    path("admin/users/<uuid:pk>/toggle-active/", admin_toggle_user_active_view, name="admin_toggle_active"),
    path("admin/users/<uuid:pk>/assign-role/", admin_assign_user_role_view, name="admin_assign_role"),
    path("admin/celery/", admin_celery_status_view, name="admin_celery_status"),
    path("admin/audit-logs/", admin_audit_logs_view, name="admin_audit_logs"),
]
