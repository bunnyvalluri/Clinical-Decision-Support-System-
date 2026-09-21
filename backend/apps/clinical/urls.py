"""Clinical app URLs — Prompt 64."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.clinical.knowledge_views import (
    AIReviewViewSet,
    AISafetyViewSet,
    ClinicalAlertViewSet,
    ClinicalKnowledgeDocumentViewSet,
    ClinicalRuleViewSet,
    EvidenceSourceViewSet,
    GuidelineVersionViewSet,
    GuidelineViewSet,
    PatientTimelineViewSet,
)
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
router.register(r"knowledge", ClinicalKnowledgeDocumentViewSet, basename="clinical_knowledge")
router.register(r"guidelines", GuidelineViewSet, basename="guideline")
router.register(r"guideline-versions", GuidelineVersionViewSet, basename="guideline_version")
router.register(r"rules", ClinicalRuleViewSet, basename="clinical_rule")
router.register(r"evidence", EvidenceSourceViewSet, basename="evidence_source")
router.register(r"alerts", ClinicalAlertViewSet, basename="clinical_alert")
router.register(r"timeline", PatientTimelineViewSet, basename="patient_timeline")
router.register(r"safety", AISafetyViewSet, basename="ai_safety")
router.register(r"review", AIReviewViewSet, basename="ai_review")

urlpatterns = [
    path("triage/queue/", triage_queue_view, name="triage_queue"),
    path("triage/queue/<uuid:pk>/state/", update_triage_state_view, name="update_triage_state"),
    path("triage/tasks/", clinical_tasks_view, name="clinical_tasks"),
    path("triage/escalate/", escalate_patient_view, name="escalate_patient"),
    path("vitals/", enter_vital_signs_view, name="enter_vitals"),
    path("", include(router.urls)),
]
