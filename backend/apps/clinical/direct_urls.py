"""
Direct route mappings for Prompt 64 API endpoints:
- /api/clinical-knowledge/
- /api/guidelines/
- /api/guideline-versions/
- /api/clinical-rules/
- /api/evidence/
- /api/patient-timeline/
- /api/prediction-reviews/
- /api/ai/safety/
- /api/ai/review/
"""
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
from apps.predictions.review_views import pending_reviews_list_view, record_clinical_review_view

# Standalone routers for each direct endpoint
knowledge_router = DefaultRouter()
knowledge_router.register(r"", ClinicalKnowledgeDocumentViewSet, basename="direct_clinical_knowledge")

guideline_router = DefaultRouter()
guideline_router.register(r"", GuidelineViewSet, basename="direct_guideline")

guideline_version_router = DefaultRouter()
guideline_version_router.register(r"", GuidelineVersionViewSet, basename="direct_guideline_version")

rules_router = DefaultRouter()
rules_router.register(r"", ClinicalRuleViewSet, basename="direct_clinical_rule")

evidence_router = DefaultRouter()
evidence_router.register(r"", EvidenceSourceViewSet, basename="direct_evidence_source")

timeline_router = DefaultRouter()
timeline_router.register(r"", PatientTimelineViewSet, basename="direct_patient_timeline")

alerts_router = DefaultRouter()
alerts_router.register(r"", ClinicalAlertViewSet, basename="direct_clinical_alert")

safety_router = DefaultRouter()
safety_router.register(r"", AISafetyViewSet, basename="direct_ai_safety")

review_router = DefaultRouter()
review_router.register(r"", AIReviewViewSet, basename="direct_ai_review")

prediction_reviews_patterns = [
    path("", pending_reviews_list_view, name="direct_pending_reviews"),
    path("<uuid:pk>/decision/", record_clinical_review_view, name="direct_record_review"),
]
