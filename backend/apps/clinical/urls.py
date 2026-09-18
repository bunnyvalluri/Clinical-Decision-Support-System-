"""Clinical app URLs."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.clinical.triage_views import (
    clinical_tasks_view,
    enter_vital_signs_view,
    escalate_patient_view,
    triage_queue_view,
    update_triage_state_view,
)
from apps.clinical.views import ClinicalRecordViewSet, DataQualityIssueViewSet

app_name = "clinical"

router = DefaultRouter()
router.register(r"records", ClinicalRecordViewSet, basename="clinical_record")
router.register(r"data-quality-issues", DataQualityIssueViewSet, basename="data_quality_issue")

urlpatterns = [
    path("triage/queue/", triage_queue_view, name="triage_queue"),
    path("triage/queue/<uuid:pk>/state/", update_triage_state_view, name="update_triage_state"),
    path("triage/tasks/", clinical_tasks_view, name="clinical_tasks"),
    path("triage/escalate/", escalate_patient_view, name="escalate_patient"),
    path("vitals/", enter_vital_signs_view, name="enter_vitals"),
    path("", include(router.urls)),
]
