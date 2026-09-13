"""Model registry URLs."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.model_registry.informatics_views import (
    ai_evaluation_metrics_view,
    data_quality_metrics_view,
    drift_monitoring_view,
    informatics_overview_view,
)
from apps.model_registry.views import ModelVersionViewSet

app_name = "model_registry"

router = DefaultRouter()
router.register(r"versions", ModelVersionViewSet, basename="model_version")

urlpatterns = [
    path("informatics/overview/", informatics_overview_view, name="informatics_overview"),
    path("informatics/data-quality/", data_quality_metrics_view, name="data_quality_metrics"),
    path("informatics/drift/", drift_monitoring_view, name="drift_monitoring"),
    path("informatics/ai-eval/", ai_evaluation_metrics_view, name="ai_eval_metrics"),
    path("", include(router.urls)),
]
