"""
Clinical Knowledge, Guideline, Deterministic Rule, Evidence, Timeline, and Safety API Views — Prompt 64.
"""
from datetime import datetime, timezone
import logging
from typing import Any, Dict

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.clinical.models import (
    AISafetyEvent,
    ClinicalAlert,
    ClinicalKnowledgeDocument,
    ClinicalKnowledgeVersion,
    ClinicalRule,
    ClinicalRuleVersion,
    EvidenceReference,
    EvidenceSource,
    Guideline,
    GuidelineVersion,
    PatientTimelineEvent,
)
from apps.clinical.serializers import (
    AISafetyEventSerializer,
    ClinicalAlertSerializer,
    ClinicalKnowledgeDocumentSerializer,
    ClinicalKnowledgeVersionSerializer,
    ClinicalRuleSerializer,
    ClinicalRuleVersionSerializer,
    EvidenceReferenceSerializer,
    EvidenceSourceSerializer,
    PatientTimelineEventSerializer,
)
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import (
    CanReviewPrediction,
    IsClinicianOrStaff,
    IsDoctor,
    IsDoctorOrNurse,
    IsMedicalInformaticist,
)
from apps.patients.models import Patient
from services.ai_safety_gate import AISafetyGate
from services.clinical_knowledge_service import ClinicalKnowledgeService
from services.clinical_rules_engine import ClinicalRulesEngine
from services.timeline_service import PatientTimelineService

logger = logging.getLogger("api.clinical_knowledge")


class ClinicalKnowledgeDocumentViewSet(viewsets.ModelViewSet):
    """
    CRUD and governance endpoints for clinical knowledge documents.
    GET /api/clinical-knowledge/
    POST /api/clinical-knowledge/
    GET /api/clinical-knowledge/{id}/
    POST /api/clinical-knowledge/{id}/approve/
    POST /api/clinical-knowledge/{id}/publish/
    POST /api/clinical-knowledge/{id}/deprecate/
    POST /api/clinical-knowledge/{id}/revise/
    GET /api/clinical-knowledge/{id}/versions/
    GET /api/clinical-knowledge/stale/
    """

    serializer_class = ClinicalKnowledgeDocumentSerializer
    pagination_class = StandardResultsPagination
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", UserRole.USER)
        qs = ClinicalKnowledgeDocument.objects.all().select_related("evidence_source", "created_by", "reviewer")

        # Patients and normal users only see approved and published guidelines
        if role in [UserRole.PATIENT, UserRole.USER]:
            return qs.filter(
                status__in=[ClinicalKnowledgeDocument.Status.APPROVED, ClinicalKnowledgeDocument.Status.PUBLISHED],
                is_active=True,
            )

        # Clinicians and Informaticists see all active and draft documents
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        specialty_filter = self.request.query_params.get("specialty")
        if specialty_filter:
            qs = qs.filter(specialty__iexact=specialty_filter)

        doc_type = self.request.query_params.get("document_type")
        if doc_type:
            qs = qs.filter(document_type=doc_type.upper())

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(title__icontains=search)

        return qs.order_by("-effective_date")

    def perform_create(self, serializer):
        service = ClinicalKnowledgeService()
        doc = service.create_document(
            document_id=serializer.validated_data["document_id"],
            title=serializer.validated_data["title"],
            content=serializer.validated_data["content"],
            organization=serializer.validated_data["organization"],
            created_by=self.request.user,
            document_type=serializer.validated_data.get("document_type", ClinicalKnowledgeDocument.DocumentType.GUIDELINE),
            jurisdiction=serializer.validated_data.get("jurisdiction", "GLOBAL"),
            specialty=serializer.validated_data.get("specialty", "GENERAL_MEDICINE"),
            summary=serializer.validated_data.get("summary", ""),
            initial_version=serializer.validated_data.get("current_version", "1.0.0"),
            effective_date=serializer.validated_data.get("effective_date"),
            review_date=serializer.validated_data.get("review_date"),
            evidence_source=serializer.validated_data.get("evidence_source"),
            status=serializer.validated_data.get("status", ClinicalKnowledgeDocument.Status.DRAFT),
        )
        serializer.instance = doc

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsClinicianOrStaff])
    def approve(self, request, pk=None):
        """Approve clinical knowledge document."""
        doc = self.get_object()
        service = ClinicalKnowledgeService()
        approval_event = request.data.get("approval_event", "CLINICAL_BOARD_APPROVAL")
        updated = service.approve_document(doc.document_id, reviewer=request.user, approval_event=approval_event)
        return Response(ClinicalKnowledgeDocumentSerializer(updated).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsClinicianOrStaff])
    def publish(self, request, pk=None):
        """Publish approved clinical knowledge document."""
        doc = self.get_object()
        service = ClinicalKnowledgeService()
        try:
            updated = service.publish_document(doc.document_id, user=request.user)
            return Response(ClinicalKnowledgeDocumentSerializer(updated).data)
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsClinicianOrStaff])
    def deprecate(self, request, pk=None):
        """Deprecate clinical knowledge document."""
        doc = self.get_object()
        service = ClinicalKnowledgeService()
        reason = request.data.get("reason", "")
        updated = service.deprecate_document(doc.document_id, user=request.user, reason=reason)
        return Response(ClinicalKnowledgeDocumentSerializer(updated).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsClinicianOrStaff])
    def revise(self, request, pk=None):
        """Create a controlled revision/new version of an existing document."""
        doc = self.get_object()
        new_content = request.data.get("content")
        new_version = request.data.get("version")
        change_reason = request.data.get("change_reason", "")
        if not new_content or not new_version:
            return Response({"error": "Both 'content' and 'version' are required for revision."}, status=status.HTTP_400_BAD_REQUEST)

        service = ClinicalKnowledgeService()
        ver = service.revise_document(
            document_id=doc.document_id,
            new_content=new_content,
            new_version=new_version,
            change_reason=change_reason,
            author=request.user,
            changed_fields=request.data.get("changed_fields"),
            new_summary=request.data.get("summary"),
            new_review_date=request.data.get("review_date"),
        )
        return Response(ClinicalKnowledgeVersionSerializer(ver).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def versions(self, request, pk=None):
        """Get version history for a specific document."""
        doc = self.get_object()
        versions = doc.versions.all().order_by("-created_at")
        return Response(ClinicalKnowledgeVersionSerializer(versions, many=True).data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated, IsClinicianOrStaff])
    def stale(self, request):
        """List stale clinical knowledge documents requiring review."""
        service = ClinicalKnowledgeService()
        stale_list = service.detect_stale_knowledge()
        return Response({"count": len(stale_list), "stale_documents": stale_list})


class GuidelineViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Dedicated viewset for browsing approved clinical guidelines.
    GET /api/guidelines/
    GET /api/guidelines/{id}/
    """

    serializer_class = ClinicalKnowledgeDocumentSerializer
    pagination_class = StandardResultsPagination
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ClinicalKnowledgeDocument.objects.filter(
            document_type=ClinicalKnowledgeDocument.DocumentType.GUIDELINE,
            status__in=[ClinicalKnowledgeDocument.Status.APPROVED, ClinicalKnowledgeDocument.Status.PUBLISHED],
            is_active=True,
        ).select_related("evidence_source", "created_by", "reviewer").order_by("-effective_date")


class GuidelineVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for inspecting guideline versions and diffs.
    GET /api/guideline-versions/
    GET /api/guideline-versions/{id}/
    """

    serializer_class = ClinicalKnowledgeVersionSerializer
    pagination_class = StandardResultsPagination
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ClinicalKnowledgeVersion.objects.filter(
            document__document_type=ClinicalKnowledgeDocument.DocumentType.GUIDELINE
        ).select_related("document", "reviewer", "approved_by").order_by("-created_at")


class ClinicalRuleViewSet(viewsets.ModelViewSet):
    """
    Deterministic clinical rule management and evaluation.
    GET /api/clinical-rules/
    POST /api/clinical-rules/
    POST /api/clinical-rules/evaluate/
    """

    serializer_class = ClinicalRuleSerializer
    pagination_class = StandardResultsPagination
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ClinicalRule.objects.all().order_by("-severity", "rule_name")

    @action(detail=False, methods=["post"])
    def evaluate(self, request):
        """
        Evaluate deterministic rules against provided clinical features (vitals, labs).
        POST /api/clinical-rules/evaluate/
        """
        engine = ClinicalRulesEngine()
        alerts = engine.evaluate(request.data)
        from dataclasses import asdict
        alert_dicts = [asdict(a) for a in alerts]
        return Response({
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
            "total_alerts": len(alerts),
            "has_critical": any(a.severity == "CRITICAL_EMERGENCY" for a in alerts),
            "alerts": alert_dicts,
        })


class EvidenceSourceViewSet(viewsets.ModelViewSet):
    """
    Evidence and publication source registry.
    GET /api/evidence/
    POST /api/evidence/
    """

    serializer_class = EvidenceSourceSerializer
    pagination_class = StandardResultsPagination
    permission_classes = [permissions.IsAuthenticated]
    queryset = EvidenceSource.objects.all().order_by("name")


class PatientTimelineViewSet(viewsets.ViewSet):
    """
    Unified, chronological, and auditable patient clinical timeline.
    GET /api/patient-timeline/?patient_id=<uuid>
    GET /api/patient-timeline/<uuid:patient_id>/
    """

    permission_classes = [permissions.IsAuthenticated]

    def list(self, request: Request) -> Response:
        patient_id = request.query_params.get("patient_id")
        if not patient_id:
            return Response({"error": "Query parameter 'patient_id' is required."}, status=status.HTTP_400_BAD_REQUEST)
        return self._build_timeline_response(request, patient_id)

    def retrieve(self, request: Request, pk=None) -> Response:
        return self._build_timeline_response(request, pk)

    def _build_timeline_response(self, request: Request, patient_id: str) -> Response:
        try:
            patient = Patient.objects.get(id=patient_id)
        except (Patient.DoesNotExist, ValueError):
            return Response({"error": "Patient not found.", "code": "PATIENT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)

        role = getattr(request.user, "role", UserRole.USER)
        max_events = int(request.query_params.get("max_events", 50))
        event_type = request.query_params.get("event_type")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        source = request.query_params.get("source")
        severity = request.query_params.get("severity")
        offset = int(request.query_params.get("offset", 0))
        limit = int(request.query_params.get("limit", max_events))

        timeline = PatientTimelineService.get_timeline_for_patient(
            patient_id=patient.id,
            max_events=max_events,
            user_role=role,
            event_type=event_type,
            date_from=date_from,
            date_to=date_to,
            source=source,
            severity=severity,
            offset=offset,
            limit=limit,
        )

        return Response({
            "patient_id": str(patient.id),
            "mrn": patient.mrn,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "total_events": len(timeline),
            "offset": offset,
            "limit": limit,
            "events": timeline,
        })


class ClinicalAlertViewSet(viewsets.ModelViewSet):
    """
    Real-time clinical alerts management.
    GET /api/v1/clinical/alerts/
    POST /api/v1/clinical/alerts/{id}/acknowledge/
    POST /api/v1/clinical/alerts/{id}/resolve/
    """

    serializer_class = ClinicalAlertSerializer
    pagination_class = StandardResultsPagination
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrNurse]

    def get_queryset(self):
        qs = ClinicalAlert.objects.all().select_related("patient", "acknowledged_by", "resolved_by")
        patient_id = self.request.query_params.get("patient_id")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        unresolved_only = self.request.query_params.get("unresolved")
        if unresolved_only == "true":
            qs = qs.filter(is_resolved=False)
        return qs.order_by("-created_at")

    @action(detail=True, methods=["post"])
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        alert.is_acknowledged = True
        alert.acknowledged_by = request.user
        alert.acknowledged_at = datetime.now(timezone.utc)
        alert.save(update_fields=["is_acknowledged", "acknowledged_by", "acknowledged_at", "updated_at"])
        return Response(ClinicalAlertSerializer(alert).data)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.is_resolved = True
        alert.resolved_by = request.user
        alert.resolved_at = datetime.now(timezone.utc)
        alert.save(update_fields=["is_resolved", "resolved_by", "resolved_at", "updated_at"])
        return Response(ClinicalAlertSerializer(alert).data)


class AISafetyViewSet(viewsets.ViewSet):
    """
    AI Safety Gate status, evaluation, and kill-switch control.
    GET /api/ai/safety/
    POST /api/ai/safety/evaluate/
    POST /api/ai/safety/kill-switch/
    GET /api/ai/safety/events/
    """

    permission_classes = [permissions.IsAuthenticated]

    def list(self, request: Request) -> Response:
        """Get current safety gate status and metrics."""
        gate = AISafetyGate()
        recent_events = AISafetyEvent.objects.all().order_by("-timestamp")[:10]
        return Response({
            "kill_switch_active": gate.kill_switch_active,
            "status": "SUSPENDED" if gate.kill_switch_active else "OPERATIONAL",
            "recent_events_count": AISafetyEvent.objects.count(),
            "recent_events": AISafetyEventSerializer(recent_events, many=True).data,
        })

    @action(detail=False, methods=["post"])
    def evaluate(self, request: Request) -> Response:
        """Run input through the 10-stage AI Safety Gate."""
        gate = AISafetyGate()
        input_text = request.data.get("input_text", "")
        patient_id = request.data.get("patient_id")
        patient = None
        if patient_id:
            try:
                patient = Patient.objects.get(id=patient_id)
            except (Patient.DoesNotExist, ValueError):
                pass

        role = getattr(request.user, "role", UserRole.USER)
        result = gate.process_request(
            user=request.user,
            user_role=role,
            input_text=input_text,
            patient=patient,
            retrieved_documents=request.data.get("retrieved_documents"),
            is_patient_facing=(role in [UserRole.PATIENT, UserRole.USER]),
        )
        return Response(result.to_dict())

    @action(detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsMedicalInformaticist])
    def kill_switch(self, request: Request) -> Response:
        """Toggle or set emergency kill-switch state."""
        activate = request.data.get("active", True)
        import os
        os.environ["AI_KILL_SWITCH_ACTIVE"] = "true" if activate else "false"
        AISafetyEvent.objects.create(
            correlation_id=f"kill-switch-{datetime.now(timezone.utc).timestamp()}",
            event_type=AISafetyEvent.EventType.KILL_SWITCH_TRIGGERED,
            severity="CRITICAL",
            user=request.user,
            user_role=getattr(request.user, "role", "ADMIN"),
            action_taken=AISafetyEvent.ActionTaken.BLOCK if activate else AISafetyEvent.ActionTaken.ALLOW,
            details={"toggled_by": request.user.username, "new_state": activate},
        )
        return Response({
            "success": True,
            "kill_switch_active": activate,
            "message": f"Global AI Kill Switch {'ACTIVATED' if activate else 'DEACTIVATED'}.",
        })

    @action(detail=False, methods=["get"])
    def events(self, request: Request) -> Response:
        """List audited AI Safety Events."""
        events = AISafetyEvent.objects.all().order_by("-timestamp")[:50]
        return Response(AISafetyEventSerializer(events, many=True).data)


class AIReviewViewSet(viewsets.ViewSet):
    """
    Human-in-the-loop sign-off endpoint for AI clinical interactions.
    POST /api/ai/review/
    """

    permission_classes = [permissions.IsAuthenticated, IsClinicianOrStaff]

    def create(self, request: Request) -> Response:
        from apps.ai_orchestrator.models import AIInteraction
        interaction_id = request.data.get("interaction_id")
        decision = request.data.get("decision", "APPROVED")
        rationale = request.data.get("rationale", "").strip()

        if not interaction_id:
            return Response({"error": "Field 'interaction_id' is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            interaction = AIInteraction.objects.get(id=interaction_id)
        except (AIInteraction.DoesNotExist, ValueError):
            return Response({"error": "AI Interaction not found."}, status=status.HTTP_404_NOT_FOUND)

        if decision == "OVERRIDDEN" and not rationale:
            return Response({"error": "Clinical rationale is mandatory when overriding AI recommendation."}, status=status.HTTP_400_BAD_REQUEST)

        interaction.human_reviewed_by = request.user
        interaction.human_decision = decision
        interaction.human_rationale = rationale
        interaction.human_reviewed_at = datetime.now(timezone.utc)
        interaction.save(update_fields=["human_reviewed_by", "human_decision", "human_rationale", "human_reviewed_at"])

        return Response({
            "success": True,
            "interaction_id": str(interaction.id),
            "decision": decision,
            "reviewed_by": request.user.username,
            "reviewed_at": interaction.human_reviewed_at.isoformat(),
        })
