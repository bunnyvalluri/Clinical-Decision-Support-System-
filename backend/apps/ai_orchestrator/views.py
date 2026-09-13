"""
REST API Views for Clinical AI Orchestration, Deterministic Rules,
Grounded Knowledge Retrieval, and Human-in-the-Loop Governance.
"""
from dataclasses import asdict
import logging
import uuid

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.patients.models import Patient
from services.clinical_rules_engine import ClinicalRulesEngine

from .guardrails import SafetyGuardrailService
from .knowledge_retrieval import KnowledgeRetrievalService
from .models import AIInteraction, ClinicalRuleEvaluation, ModelDriftRecord
from .orchestrator import ClinicalIntelligenceOrchestrator
from .serializers import (
    AIInteractionSerializer,
    ClinicalRulesEvaluateSerializer,
    HumanReviewDecisionSerializer,
    KnowledgeQuerySerializer,
    ModelDriftRecordSerializer,
    OrchestratorEvaluationRequestSerializer,
)

logger = logging.getLogger("api.ai_orchestrator")


class OrchestratorEvaluationView(APIView):
    """
    POST /api/v1/ai/orchestrator/evaluate/
    Executes controlled clinical orchestration incorporating deterministic rules,
    ML ensemble prediction, uncertainty/OOD analysis, and grounded RAG citations.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = OrchestratorEvaluationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        patient_id = serializer.validated_data["patient_id"]
        query = serializer.validated_data.get("query")
        model_name = serializer.validated_data.get("model_name")
        correlation_id = (
            serializer.validated_data.get("correlation_id")
            or request.headers.get("X-Correlation-ID")
            or str(uuid.uuid4())
        )

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {"error": "Patient not found.", "code": "PATIENT_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        orchestrator = ClinicalIntelligenceOrchestrator()
        result = orchestrator.orchestrate_clinical_evaluation(
            patient_id=str(patient.id),
            clinician=request.user,
            query=query,
            model_name=model_name,
            correlation_id=correlation_id,
        )

        # Record AIInteraction audit entity
        safety_status = (
            AIInteraction.SafetyStatus.SUPPRESSED
            if result.get("status") == "SAFETY_BLOCKED"
            else (
                AIInteraction.SafetyStatus.FLAGGED
                if result.get("requires_human_review")
                else AIInteraction.SafetyStatus.PASSED
            )
        )

        interaction = AIInteraction.objects.create(
            patient=patient,
            clinician=request.user,
            correlation_id=correlation_id,
            operation_type="FULL_ORCHESTRATION",
            input_query=query or "",
            tools_invoked=["clinical_rules", "ml_ensemble", "uncertainty_ood", "knowledge_rag"],
            safety_status=safety_status,
            guardrail_flags=[],
            requires_human_review=result.get("requires_human_review", False),
            latency_ms=result.get("total_latency_ms", 0.0),
        )

        # Persist deterministic rule evaluation findings
        for rule_alert in result.get("deterministic_rules", []):
            ClinicalRuleEvaluation.objects.create(
                patient=patient,
                rule_name=rule_alert.get("rule_name", "Unknown Rule"),
                severity=rule_alert.get("severity", "MONITOR"),
                trigger_criteria=rule_alert.get("trigger_criteria", ""),
                recommended_action=rule_alert.get("recommended_action", ""),
            )

        result["interaction_id"] = str(interaction.id)

        # Broadcast real-time event to WebSocket channels layer
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "dashboard",
                    {
                        "type": "broadcast_event",
                        "event": "AI_ANALYSIS_COMPLETED",
                        "payload": {
                            "interaction_id": str(interaction.id),
                            "patient_mrn": patient.mrn,
                            "requires_human_review": result.get("requires_human_review"),
                            "status": result.get("status"),
                            "timestamp": timezone.now().isoformat(),
                        },
                    },
                )
        except Exception as ws_err:
            logger.debug("WebSocket broadcast skipped: %s", ws_err)

        return Response(result, status=status.HTTP_200_OK)


class ClinicalRulesEvaluateView(APIView):
    """
    POST /api/v1/ai/rules/evaluate/
    Evaluates deterministic clinical safety rules (qSOFA, NEWS2, acute lab red-flags).
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ClinicalRulesEvaluateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        engine = ClinicalRulesEngine()
        alerts = engine.evaluate(serializer.validated_data)

        return Response(
            {
                "evaluated_at": timezone.now().isoformat(),
                "total_alerts": len(alerts),
                "has_critical": any(a.severity == "CRITICAL_EMERGENCY" for a in alerts),
                "alerts": [asdict(a) for a in alerts],
            },
            status=status.HTTP_200_OK,
        )


class KnowledgeQueryView(APIView):
    """
    POST /api/v1/ai/knowledge/query/
    Grounded RAG retrieval of approved clinical guidelines with verifiable citations.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = KnowledgeQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = KnowledgeRetrievalService()
        result = service.retrieve(
            query=serializer.validated_data["query"],
            clinical_context=serializer.validated_data.get("clinical_context"),
            top_k=serializer.validated_data.get("top_k", 3),
        )

        return Response(
            {
                "query": result.query,
                "grounding_confidence": result.grounding_confidence,
                "citations": [asdict(c) for c in result.citations],
                "disclaimer": (
                    "Clinical guidelines retrieved for professional clinician reference only. "
                    "Does not supersede clinical judgment or institutional protocols."
                ),
            },
            status=status.HTTP_200_OK,
        )


class HumanReviewDecisionView(APIView):
    """
    POST /api/v1/ai/human-review/
    Records licensed clinician evaluation, modification, or override of an AI decision.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = HumanReviewDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        interaction_id = serializer.validated_data["interaction_id"]
        decision = serializer.validated_data["decision"]
        rationale = serializer.validated_data["rationale"]

        try:
            interaction = AIInteraction.objects.get(id=interaction_id)
        except AIInteraction.DoesNotExist:
            return Response(
                {"error": "AI Interaction record not found.", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        interaction.human_reviewed_by = request.user
        interaction.human_decision = decision
        interaction.human_rationale = rationale
        interaction.human_reviewed_at = timezone.now()
        interaction.save(
            update_fields=[
                "human_reviewed_by",
                "human_decision",
                "human_rationale",
                "human_reviewed_at",
            ]
        )

        return Response(
            {
                "message": "Clinician review decision recorded successfully.",
                "interaction_id": str(interaction.id),
                "decision": decision,
                "reviewed_by": request.user.username,
                "reviewed_at": interaction.human_reviewed_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )


class ModelDriftListView(APIView):
    """
    GET /api/v1/ai/drift/
    Returns latest MLOps drift records (PSI, KS statistic) and stability metrics.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        records = ModelDriftRecord.objects.all().order_by("-evaluated_at")[:20]
        serializer = ModelDriftRecordSerializer(records, many=True)
        return Response(
            {
                "count": len(records),
                "drift_records": serializer.data,
                "stability_thresholds": {
                    "psi_stable": "< 0.10",
                    "psi_moderate_drift": "0.10 - 0.25",
                    "psi_severe_drift": "> 0.25",
                },
            },
            status=status.HTTP_200_OK,
        )
