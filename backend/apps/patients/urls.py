"""
URLs for patients app.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.patients.views import PatientViewSet

app_name = "patients"

router = DefaultRouter()
router.register(r"", PatientViewSet, basename="patient")

urlpatterns = [
    path("", include(router.urls)),
]
