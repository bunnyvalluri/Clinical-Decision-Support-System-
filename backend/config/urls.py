"""
Root URL configuration for BPY-CSE-2666.

All application endpoints are versioned under /api/v1/.
WebSocket routing is handled by Django Channels (see config/asgi.py).
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Admin interface
    path("admin/", admin.site.urls),

    # API v1 — all application REST endpoints
    path("api/v1/", include("apps.core.urls", namespace="core")),
    path("api/v1/auth/", include("apps.accounts.urls", namespace="accounts")),
    path("api/v1/patients/", include("apps.patients.urls", namespace="patients")),
    path("api/v1/clinical/", include("apps.clinical.urls", namespace="clinical")),
    path("api/v1/predictions/", include("apps.predictions.urls", namespace="predictions")),
    path("api/v1/reports/", include("apps.reports.urls", namespace="reports")),
    path("api/v1/notifications/", include("apps.notifications.urls", namespace="notifications")),
    path("api/v1/ml/", include("apps.ml_engine.urls", namespace="ml_engine")),
    path("api/v1/models/", include("apps.model_registry.urls", namespace="model_registry")),
    path("api/v1/audit/", include("apps.audit.urls", namespace="audit")),
]

# Debug toolbar (development only)
if settings.DEBUG:
    import debug_toolbar  # noqa: PLC0415

    urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns
