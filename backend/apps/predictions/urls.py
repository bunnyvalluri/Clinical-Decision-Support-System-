"""
Predictions routing configuration.
Exposes REST endpoints for clinical risk assessment and history.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.predictions.review_views import (
    ai_clinical_assistant_view,
    doctor_summary_view,
    pending_reviews_list_view,
    record_clinical_review_view,
)
from apps.predictions.views import PredictionViewSet

app_name = "predictions"

router = DefaultRouter()
router.register("records", PredictionViewSet, basename="prediction")

urlpatterns = [
    path("doctor-summary/", doctor_summary_view, name="doctor_summary"),
    path("reviews/pending/", pending_reviews_list_view, name="pending_reviews"),
    path("reviews/<uuid:pk>/decision/", record_clinical_review_view, name="record_review"),
    path("ai-assistant/", ai_clinical_assistant_view, name="ai_assistant"),
    path("", include(router.urls)),
]
