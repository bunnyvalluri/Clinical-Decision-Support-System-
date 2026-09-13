"""Model registry URLs."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.model_registry.views import ModelVersionViewSet

app_name = "model_registry"

router = DefaultRouter()
router.register(r"", ModelVersionViewSet, basename="model_version")

urlpatterns = [
    path("", include(router.urls)),
]
