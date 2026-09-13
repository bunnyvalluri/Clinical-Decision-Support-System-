"""URLs for clinical-records endpoint alias."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.clinical.views import ClinicalRecordViewSet

app_name = "clinical_records"

router = DefaultRouter()
router.register(r"", ClinicalRecordViewSet, basename="clinical_record")

urlpatterns = [
    path("", include(router.urls)),
]
