"""
Predictions routing configuration.
Exposes REST endpoints for clinical risk assessment and history.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.predictions.views import PredictionViewSet

app_name = "predictions"

router = DefaultRouter()
router.register("", PredictionViewSet, basename="prediction")

urlpatterns = [
    path("", include(router.urls)),
]
