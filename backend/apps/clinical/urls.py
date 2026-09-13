"""Clinical app URLs."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.clinical.views import ClinicalRecordViewSet

app_name = "clinical"

router = DefaultRouter()
router.register(r"", ClinicalRecordViewSet, basename="clinical_record")

urlpatterns = [
    path("", include(router.urls)),
]
