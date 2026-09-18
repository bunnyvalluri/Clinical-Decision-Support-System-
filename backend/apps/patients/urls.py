"""
URLs for patients app.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.patients.views import PatientViewSet
from apps.predictions.risk_views import PatientRiskDetailView

app_name = "patients"

router = DefaultRouter()
router.register(r"", PatientViewSet, basename="patient")

urlpatterns = [
    path("<uuid:patient_id>/risk/", PatientRiskDetailView.as_view(), name="patient_risk"),
    path("", include(router.urls)),
]
