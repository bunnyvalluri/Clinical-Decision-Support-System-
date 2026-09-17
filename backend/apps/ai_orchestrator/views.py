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


class AIInteractionListView(APIView):
    """
    GET /api/v1/ai/interactions/
    Returns audited AI evaluations, safety statuses, and clinician reviews.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        from .models import AIInteraction
        from .serializers import AIInteractionSerializer

        queryset = AIInteraction.objects.all().order_by("-created_at")
        patient_id = request.query_params.get("patient_id")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        items = queryset[:50]
        serializer = AIInteractionSerializer(items, many=True)
        return Response(
            {"count": queryset.count(), "results": serializer.data},
            status=status.HTTP_200_OK,
        )


class RufloSwarmEvaluateView(APIView):
    """
    POST /api/v1/ai/swarm/evaluate/
    Executes a policy-governed Ruflo multi-agent swarm evaluation workflow.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        role = getattr(request.user, "role", "USER")
        if role == UserRole.PATIENT or role == "PATIENT":
            return Response(
                {
                    "error": "Patient accounts are not authorized to trigger clinical swarm evaluations directly.",
                    "code": "PERMISSION_DENIED",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        from .serializers import SwarmWorkflowRequestSerializer
        from .ruflo_engine import get_ruflo_engine

        serializer = SwarmWorkflowRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        patient_id = serializer.validated_data["patient_id"]
        query = serializer.validated_data.get("query")
        correlation_id = serializer.validated_data.get("correlation_id")

        try:
            Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {"error": "Patient not found.", "code": "PATIENT_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        engine = get_ruflo_engine()
        receipt = engine.execute_clinical_workflow(
            patient_id=patient_id,
            clinician=request.user,
            query=query,
            correlation_id=correlation_id,
        )

        resp_status = (
            status.HTTP_400_BAD_REQUEST
            if receipt.status == "SAFETY_BLOCKED"
            else status.HTTP_200_OK
        )

        return Response(
            {
                "workflow_id": receipt.workflow_id,
                "status": receipt.status,
                "requires_human_review": receipt.requires_human_review,
                "safety_verdict": receipt.safety_verdict,
                "participating_agents": receipt.participating_agents,
                "total_steps": receipt.total_steps,
                "total_tool_calls": receipt.total_tool_calls,
                "total_latency_ms": round(receipt.total_latency_ms, 2),
                "output_summary": receipt.output_summary,
                "structured_data": receipt.structured_data,
                "approval_gate_id": receipt.approval_gate_id,
                "error_detail": receipt.error_detail,
            },
            status=resp_status,
        )


class AgentTaskListView(APIView):
    """
    GET /api/v1/ai/tasks/
    Returns paginated list of Ruflo agent tasks in PostgreSQL.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        from .models import AgentTask
        from .serializers import AgentTaskSerializer

        queryset = AgentTask.objects.all()
        status_filter = request.query_params.get("status")
        agent_filter = request.query_params.get("agent_type")
        priority_filter = request.query_params.get("priority")

        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        if agent_filter:
            queryset = queryset.filter(agent_type=agent_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter.upper())

        tasks = queryset[:50]
        serializer = AgentTaskSerializer(tasks, many=True)
        return Response(
            {"count": queryset.count(), "results": serializer.data},
            status=status.HTTP_200_OK,
        )


class AgentTaskDetailView(APIView):
    """
    GET /api/v1/ai/tasks/<id>/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, task_id: uuid.UUID) -> Response:
        from .models import AgentTask
        from .serializers import AgentTaskSerializer

        try:
            task = AgentTask.objects.get(id=task_id)
        except AgentTask.DoesNotExist:
            return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AgentTaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AIAgentTraceListView(APIView):
    """
    GET /api/v1/ai/traces/
    Returns auditable agent execution traces.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        from .models import AIAgentTrace
        from .serializers import AIAgentTraceSerializer

        queryset = AIAgentTrace.objects.all()
        workflow_id = request.query_params.get("workflow_id")
        agent_name = request.query_params.get("agent_name")

        if workflow_id:
            queryset = queryset.filter(workflow_id=workflow_id)
        if agent_name:
            queryset = queryset.filter(agent_name=agent_name)

        traces = queryset[:50]
        serializer = AIAgentTraceSerializer(traces, many=True)
        return Response(
            {"count": queryset.count(), "results": serializer.data},
            status=status.HTTP_200_OK,
        )


class AIApprovalGateListView(APIView):
    """
    GET /api/v1/ai/approvals/
    Lists pending or decided human-in-the-loop approval gates.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        from .models import AIApprovalGate
        from .serializers import AIApprovalGateSerializer

        queryset = AIApprovalGate.objects.all()
        decision_filter = request.query_params.get("decision")
        action_filter = request.query_params.get("action_type")

        if decision_filter:
            queryset = queryset.filter(decision=decision_filter.upper())
        if action_filter:
            queryset = queryset.filter(action_type=action_filter.upper())

        gates = queryset[:50]
        serializer = AIApprovalGateSerializer(gates, many=True)
        return Response(
            {"count": queryset.count(), "results": serializer.data},
            status=status.HTTP_200_OK,
        )


class AIApprovalGateDecideView(APIView):
    """
    POST /api/v1/ai/approvals/decide/
    Records human clinician or administrator decision on an approval gate.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        from .models import AIApprovalGate
        from .serializers import AIApprovalDecisionSerializer

        serializer = AIApprovalDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        gate_id = serializer.validated_data["gate_id"]
        decision = serializer.validated_data["decision"]
        rationale = serializer.validated_data.get("rationale", "")

        try:
            gate = AIApprovalGate.objects.get(id=gate_id)
        except AIApprovalGate.DoesNotExist:
            return Response({"error": "Approval gate not found."}, status=status.HTTP_404_NOT_FOUND)

        gate.decision = decision
        gate.approved_by = request.user
        gate.approved_at = timezone.now()
        gate.rejection_reason = rationale if decision == "REJECTED" else ""
        gate.save(update_fields=["decision", "approved_by", "approved_at", "rejection_reason"])

        if gate.agent_task:
            gate.agent_task.approval_status = (
                "APPROVED" if decision == "APPROVED" else "REJECTED"
            )
            gate.agent_task.status = (
                "COMPLETED" if decision == "APPROVED" else "REJECTED"
            )
            gate.agent_task.save(update_fields=["approval_status", "status"])

        return Response(
            {
                "message": f"Approval gate {decision.lower()} successfully.",
                "gate_id": str(gate.id),
                "decision": gate.decision,
                "decided_by": request.user.username,
                "decided_at": gate.approved_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )


class AgentRegistryView(APIView):
    """
    GET /api/v1/ai/agents/
    Returns the active Ruflo agent inventory and capabilities.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        from .ruflo_engine import get_ruflo_engine

        engine = get_ruflo_engine()
        return Response(
            {
                "version": "3.42.0",
                "topology": "hierarchical",
                "count": len(engine.agent_manifests),
                "agents": list(engine.agent_manifests.values()),
            },
            status=status.HTTP_200_OK,
        )


class ToolRegistryView(APIView):
    """
    GET /api/v1/ai/tools/
    Returns the active tool permission registry.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        from .ruflo_engine import get_ruflo_engine

        engine = get_ruflo_engine()
        return Response(
            {
                "count": len(engine.tool_manifests),
                "tools": list(engine.tool_manifests.values()),
            },
            status=status.HTTP_200_OK,
        )


class AIObservabilityMetricsView(APIView):
    """
    GET /api/v1/ai/metrics/
    Returns real observability and operational metrics across tasks, traces, and drift.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        from .models import AgentTask, AIAgentTrace, AIApprovalGate, AIInteraction, ModelDriftRecord
        from django.db.models import Avg, Count

        total_tasks = AgentTask.objects.count()
        active_tasks = AgentTask.objects.filter(status__in=["RUNNING", "QUEUED"]).count()
        pending_approvals = AIApprovalGate.objects.filter(decision="PENDING").count()
        completed_tasks = AgentTask.objects.filter(status="COMPLETED").count()
        failed_tasks = AgentTask.objects.filter(status="FAILED").count()

        avg_latency = (
            AIAgentTrace.objects.aggregate(avg=Avg("latency_ms"))["avg"] or 0.0
        )
        total_traces = AIAgentTrace.objects.count()
        drift_alerts = ModelDriftRecord.objects.filter(is_drift_detected=True).count()

        return Response(
            {
                "system_status": "OPERATIONAL",
                "ruflo_version": "3.42.0",
                "tasks": {
                    "total": total_tasks,
                    "active": active_tasks,
                    "completed": completed_tasks,
                    "failed": failed_tasks,
                    "pending_approvals": pending_approvals,
                },
                "performance": {
                    "average_agent_latency_ms": round(float(avg_latency), 2),
                    "total_traces_recorded": total_traces,
                },
                "governance": {
                    "total_interactions_audited": AIInteraction.objects.count(),
                    "active_drift_alerts": drift_alerts,
                    "circuit_breaker_status": "CLOSED",
                },
            },
            status=status.HTTP_200_OK,
        )


class AgentMemoryListView(APIView):
    """
    GET /api/v1/ai/memory/
    POST /api/v1/ai/memory/
    Manages segregated, non-PHI agent memory.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        from .models import AgentMemoryRecord
        from .serializers import AgentMemoryRecordSerializer

        namespace = request.query_params.get("namespace")
        queryset = AgentMemoryRecord.objects.all()
        if namespace:
            queryset = queryset.filter(namespace=namespace)

        records = queryset[:50]
        serializer = AgentMemoryRecordSerializer(records, many=True)
        return Response(
            {"count": queryset.count(), "results": serializer.data},
            status=status.HTTP_200_OK,
        )

    def post(self, request: Request) -> Response:
        from .ruflo_engine import get_ruflo_engine

        namespace = request.data.get("namespace", "engineering")
        key = request.data.get("key")
        value = request.data.get("value", {})
        provenance = request.data.get("provenance", request.user.username)

        if not key:
            return Response(
                {"error": "Memory key is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        engine = get_ruflo_engine()
        success, msg = engine.store_memory(
            namespace=namespace,
            key=key,
            value=value,
            provenance=provenance,
        )
        if not success:
            return Response(
                {"error": msg, "code": "PHI_VIOLATION_OR_INVALID"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"message": msg, "key": key, "namespace": namespace}, status=status.HTTP_201_CREATED)


# ===========================================================================
# Extended Production API Views (Prompt 31 — Awesome-LLM-Apps Integration)
# ===========================================================================

from ai.domain.entities import AIRequestEnvelope
from ai.gateway.ai_gateway import get_ai_gateway
from ai.evaluation.harness import AIEvaluationHarness
from ai.tools.tool_registry import AIToolRegistry
from .models import (
    AIModelConfig,
    AIConversation,
    AIMessage,
    AIEvaluation,
    MCPServer,
)
from .serializers import (
    AIChatRequestSerializer,
    AIConversationSerializer,
    AIMessageSerializer,
    AIModelConfigSerializer,
    AIEvaluationSerializer,
    AIEvaluationRunRequestSerializer,
    MCPServerSerializer,
)


class AIChatView(APIView):
    """
    POST /api/v1/ai/chat/
    Authoritative chat endpoint processing multi-role clinical AI requests
    through the AIGateway, SafetyEngine, and ModelRouter.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = AIChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        query = serializer.validated_data["query"]
        conv_id = serializer.validated_data.get("conversation_id")
        patient_id = serializer.validated_data.get("patient_id")
        model_name = serializer.validated_data.get("model_name")
        temperature = serializer.validated_data.get("temperature", 0.1)
        max_tokens = serializer.validated_data.get("max_tokens", 2048)

        user_role = getattr(request.user, "role", "DOCTOR")

        # Tenancy & Object-level authorization for patients
        if user_role in ["PATIENT", "USER"]:
            patient = Patient.objects.filter(user=request.user).first()
            if patient:
                patient_id = patient.id

        # 1. Retrieve or create conversation
        if conv_id:
            try:
                conversation = AIConversation.objects.get(id=conv_id, user=request.user)
            except AIConversation.DoesNotExist:
                return Response(
                    {"error": "Conversation not found or access denied.", "code": "CONVERSATION_NOT_FOUND"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            patient_obj = Patient.objects.filter(id=patient_id).first() if patient_id else None
            conversation = AIConversation.objects.create(
                user=request.user,
                patient=patient_obj,
                role=user_role,
                title=query[:48] + ("..." if len(query) > 48 else ""),
            )

        # 2. Record incoming user message
        AIMessage.objects.create(
            conversation=conversation,
            role=AIMessage.MessageRole.USER,
            content=query,
            model_name=model_name or "",
        )

        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())

        # 3. Process via AI Gateway
        gateway = get_ai_gateway()
        req_envelope = AIRequestEnvelope(
            user_id=str(request.user.id),
            user_role=user_role,
            query=query,
            correlation_id=correlation_id,
            conversation_id=str(conversation.id),
            patient_id=str(patient_id) if patient_id else None,
            model_override=model_name or None,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        ai_res = gateway.process_request(req_envelope)

        # 4. Record assistant message
        assistant_msg = AIMessage.objects.create(
            conversation=conversation,
            role=AIMessage.MessageRole.ASSISTANT,
            content=ai_res.content,
            model_name=ai_res.model_name,
            citations=[
                {
                    "guideline_id": c.guideline_id,
                    "title": c.title,
                    "section": c.section,
                    "recommendation": c.recommendation,
                    "evidence_level": c.evidence_level,
                    "doi_or_url": c.doi_or_url,
                }
                for c in ai_res.citations
            ],
            grounding_status=ai_res.grounding_status.value,
            grounding_confidence=ai_res.grounding_confidence,
            tool_calls=[
                {"tool_name": t.tool_name, "success": t.success, "latency_ms": t.latency_ms}
                for t in ai_res.tool_executions
            ],
            token_count=ai_res.input_tokens + ai_res.output_tokens,
            latency_ms=ai_res.latency_ms,
            is_error=ai_res.is_error,
        )

        # 5. Broadcast Channels WebSocket event
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "ai_orchestration",
                {
                    "type": "ai_event",
                    "data": {
                        "event": "AI_RESPONSE_COMPLETED",
                        "conversation_id": str(conversation.id),
                        "message_id": str(assistant_msg.id),
                        "content": ai_res.content,
                        "grounding_status": ai_res.grounding_status.value,
                        "grounding_confidence": ai_res.grounding_confidence,
                        "citations_count": len(ai_res.citations),
                        "requires_approval": ai_res.requires_human_approval,
                        "timestamp": timezone.now().isoformat(),
                    },
                },
            )

        return Response(
            {
                "conversation_id": str(conversation.id),
                "message": AIMessageSerializer(assistant_msg).data,
                "citations": [
                    {
                        "guideline_id": c.guideline_id,
                        "title": c.title,
                        "section": c.section,
                        "recommendation": c.recommendation,
                        "evidence_level": c.evidence_level,
                        "doi_or_url": c.doi_or_url,
                    }
                    for c in ai_res.citations
                ],
                "grounding_status": ai_res.grounding_status.value,
                "grounding_confidence": ai_res.grounding_confidence,
                "requires_human_approval": ai_res.requires_human_approval,
                "approval_details": ai_res.approval_details,
                "safety_flags": ai_res.safety_flags,
                "latency_ms": ai_res.latency_ms,
                "estimated_cost_usd": ai_res.estimated_cost_usd,
            },
            status=status.HTTP_200_OK,
        )


class AIStreamView(APIView):
    """
    POST /api/v1/ai/stream/
    Initiates real-time token streaming over Django Channels WebSockets.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = AIChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        workflow_id = str(uuid.uuid4())
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"ai_workflow_{workflow_id}",
                {
                    "type": "ai_event",
                    "data": {
                        "event": "AI_RESPONSE_STARTED",
                        "workflow_id": workflow_id,
                        "timestamp": timezone.now().isoformat(),
                    },
                },
            )

        return Response(
            {
                "workflow_id": workflow_id,
                "stream_channel": f"ws/ai/{workflow_id}/",
                "status": "STREAM_INITIALIZED",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class AIConversationListView(APIView):
    """
    GET /api/v1/ai/conversations/
    Returns the authenticated user's active AI conversations.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        conversations = AIConversation.objects.filter(user=request.user).order_by("-updated_at")[:50]
        serializer = AIConversationSerializer(conversations, many=True)
        return Response({"count": conversations.count(), "results": serializer.data}, status=status.HTTP_200_OK)


class AIConversationDetailView(APIView):
    """
    GET /api/v1/ai/conversations/<id>/
    Returns conversation message history.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, conversation_id: uuid.UUID) -> Response:
        try:
            conv = AIConversation.objects.get(id=conversation_id, user=request.user)
        except AIConversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AIConversationSerializer(conv)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AIConversationArchiveView(APIView):
    """
    POST /api/v1/ai/conversations/<id>/archive/
    Archives an active conversation session.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request, conversation_id: uuid.UUID) -> Response:
        try:
            conv = AIConversation.objects.get(id=conversation_id, user=request.user)
        except AIConversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        conv.status = AIConversation.Status.ARCHIVED
        conv.save(update_fields=["status"])
        return Response({"message": "Conversation archived successfully.", "status": "ARCHIVED"}, status=status.HTTP_200_OK)


class AIModelConfigListView(APIView):
    """
    GET /api/v1/ai/models/
    Returns active approved models in the registry.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        # Seed standard configs if table is empty
        if AIModelConfig.objects.count() == 0:
            AIModelConfig.objects.create(
                provider=AIModelConfig.Provider.ANTHROPIC,
                model_name="claude-3-5-sonnet-20241022",
                version="3.5",
                capabilities=["chat", "tools", "vision", "structured_output"],
                is_default=True,
                is_active=True,
            )
            AIModelConfig.objects.create(
                provider=AIModelConfig.Provider.OPENAI,
                model_name="gpt-4o",
                version="4o",
                capabilities=["chat", "tools", "vision", "structured_output"],
                is_default=False,
                is_active=True,
            )
            AIModelConfig.objects.create(
                provider=AIModelConfig.Provider.GEMINI,
                model_name="gemini-2.0-flash",
                version="2.0",
                capabilities=["chat", "tools", "vision"],
                is_default=False,
                is_active=True,
            )
            AIModelConfig.objects.create(
                provider=AIModelConfig.Provider.LOCAL,
                model_name="llama3.3:70b",
                version="3.3",
                capabilities=["chat", "tools"],
                is_default=False,
                is_active=True,
            )

        configs = AIModelConfig.objects.filter(is_active=True)
        serializer = AIModelConfigSerializer(configs, many=True)
        return Response({"count": configs.count(), "results": serializer.data}, status=status.HTTP_200_OK)


class AIEvaluationListView(APIView):
    """
    GET /api/v1/ai/evaluations/
    Returns historical AI evaluation benchmark runs.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        evals = AIEvaluation.objects.all().order_by("-evaluated_at")[:50]
        serializer = AIEvaluationSerializer(evals, many=True)
        return Response({"count": evals.count(), "results": serializer.data}, status=status.HTTP_200_OK)


class AIEvaluationRunView(APIView):
    """
    POST /api/v1/ai/evaluations/run/
    Executes automated red-teaming and safety regression benchmark suite.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        user_role = getattr(request.user, "role", "")
        if user_role not in ["INFORMATICIST", "ADMIN", "SUPERADMIN"] and not request.user.is_staff:
            return Response(
                {"error": "Only Medical Informaticists and Administrators can run AI benchmarks."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AIEvaluationRunRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        benchmark_name = serializer.validated_data.get("benchmark_name", "ClinicalSafetyRegression")
        model_name = serializer.validated_data.get("model_name", "claude-3-5-sonnet-20241022")

        metrics = AIEvaluationHarness.run_benchmark(
            benchmark_name=benchmark_name,
            model_name=model_name,
            user_id=str(request.user.id),
        )

        return Response(metrics, status=status.HTTP_200_OK)


class MCPServerListView(APIView):
    """
    GET /api/v1/ai/mcp/servers/
    Returns approved Model Context Protocol servers.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        # Seed standard MCP servers if empty
        if MCPServer.objects.count() == 0:
            MCPServer.objects.create(
                name="clinical-terminology-mcp",
                endpoint_url="http://localhost:8010/mcp",
                trust_level=MCPServer.TrustLevel.SANDBOXED,
                allowed_roles=["DOCTOR", "NURSE", "INFORMATICIST", "ADMIN"],
                allowed_agents=["ClinicalAssistantAgent", "ClinicalResearchAgent"],
                approved_tools=["lookup_snomed_concept", "lookup_rxnorm_drug"],
                is_active=True,
            )
            MCPServer.objects.create(
                name="clinical-calculator-mcp",
                endpoint_url="http://localhost:8011/mcp",
                trust_level=MCPServer.TrustLevel.SANDBOXED,
                allowed_roles=["DOCTOR", "NURSE", "ADMIN"],
                allowed_agents=["ClinicalAssistantAgent"],
                approved_tools=["calculate_gfr", "calculate_chads2"],
                is_active=True,
            )

        servers = MCPServer.objects.filter(is_active=True)
        serializer = MCPServerSerializer(servers, many=True)
        return Response({"count": servers.count(), "results": serializer.data}, status=status.HTTP_200_OK)


# ===========================================================================
# Cline Controlled Agent Execution Layer Views (Prompt 37)
# ===========================================================================

from .models import (
    ClineAgentSession,
    ClineAgentTask,
    ClineAgentEvent,
    ClineAgentApproval,
    ClineMCPServerRegistry,
    ClineToolDefinition,
)
from .serializers import (
    ClineAgentSessionSerializer,
    ClineAgentTaskSerializer,
    ClineAgentEventSerializer,
    ClineAgentApprovalSerializer,
    ClineTaskCreateSerializer,
    ClineApprovalDecisionSerializer,
)
from integrations.cline.session_service import ClineSessionService
from integrations.cline.adapter import ClineAgentAdapter
from integrations.cline.event_adapter import ClineEventAdapter
from integrations.cline.tool_registry import ClineToolRegistry


class ClineSessionListView(APIView):
    """
    GET /api/v1/ai/cline/sessions/
    POST /api/v1/ai/cline/sessions/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        role = getattr(request.user, "role", "PATIENT")
        qs = ClineAgentSession.objects.all()
        if role not in ["ADMIN", "SUPERADMIN"] and not request.user.is_staff:
            qs = qs.filter(user=request.user)

        serializer = ClineAgentSessionSerializer(qs[:50], many=True)
        return Response({"count": qs.count(), "results": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request: Request) -> Response:
        role = getattr(request.user, "role", "PATIENT")
        agent_type = request.data.get("agent_type", "CLINICAL_KNOWLEDGE_ASSISTANT")
        purpose = request.data.get("purpose", "General Clinical Guidance")
        env = request.data.get("environment", "DEVELOPMENT")

        try:
            session = ClineSessionService.create_session(
                user=request.user,
                role=role,
                agent_type=agent_type,
                purpose=purpose,
                environment=env,
            )
            serializer = ClineAgentSessionSerializer(session)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except PermissionError as pe:
            return Response({"error": str(pe), "code": "ROLE_RESTRICTION"}, status=status.HTTP_403_FORBIDDEN)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class ClineSessionDetailView(APIView):
    """
    GET /api/v1/ai/cline/sessions/<uuid:session_id>/
    DELETE /api/v1/ai/cline/sessions/<uuid:session_id>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, session_id: uuid.UUID) -> Response:
        session = get_object_or_404(ClineAgentSession, id=session_id)
        if session.user != request.user and not request.user.is_staff:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClineAgentSessionSerializer(session)
        events = ClineAgentEvent.objects.filter(session=session).order_by("-timestamp")[:30]
        tasks = ClineAgentTask.objects.filter(session=session).order_by("-created_at")[:10]

        return Response(
            {
                "session": serializer.data,
                "recent_tasks": ClineAgentTaskSerializer(tasks, many=True).data,
                "recent_events": ClineAgentEventSerializer(events, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request: Request, session_id: uuid.UUID) -> Response:
        session = get_object_or_404(ClineAgentSession, id=session_id)
        if session.user != request.user and not request.user.is_staff:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        session.status = ClineAgentSession.SessionStatus.TERMINATED
        session.save(update_fields=["status", "updated_at"])
        return Response({"message": "Agent session terminated safely."}, status=status.HTTP_200_OK)


class ClineTaskCreateView(APIView):
    """
    POST /api/v1/ai/cline/tasks/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ClineTaskCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data["session_id"]
        prompt = serializer.validated_data["prompt"]
        task_type = serializer.validated_data.get("task_type", "QUERY_ANALYSIS")

        session = get_object_or_404(ClineAgentSession, id=session_id)
        if session.user != request.user and not request.user.is_staff:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        try:
            task = ClineSessionService.create_task(
                session_id=str(session.id),
                prompt=prompt,
                task_type=task_type,
                user=request.user,
            )

            # Attempt async dispatch via Celery if available, or synchronous adapter fallback
            try:
                from celery_tasks.cline_tasks import execute_cline_task_async
                execute_cline_task_async.delay(
                    session_id=str(session.id),
                    task_id=str(task.id),
                    prompt=prompt,
                )
                async_dispatched = True
            except Exception:
                # Fallback to direct synchronous execution in dev environment
                adapter = ClineAgentAdapter(session_id=str(session.id))
                adapter.execute_task(task_id=str(task.id), prompt=prompt)
                async_dispatched = False

            task.refresh_from_db()
            task_data = ClineAgentTaskSerializer(task).data
            task_data["async_dispatched"] = async_dispatched
            return Response(task_data, status=status.HTTP_201_CREATED)
        except PermissionError as pe:
            return Response({"error": str(pe), "code": "KILL_SWITCH_ACTIVE"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class ClineTaskDetailView(APIView):
    """
    GET /api/v1/ai/cline/tasks/<uuid:task_id>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, task_id: uuid.UUID) -> Response:
        task = get_object_or_404(ClineAgentTask, id=task_id)
        if task.session.user != request.user and not request.user.is_staff:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        events = ClineAgentEvent.objects.filter(task=task).order_by("timestamp")
        approvals = ClineAgentApproval.objects.filter(task=task)

        return Response(
            {
                "task": ClineAgentTaskSerializer(task).data,
                "events": ClineAgentEventSerializer(events, many=True).data,
                "approvals": ClineAgentApprovalSerializer(approvals, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class ClineApprovalListView(APIView):
    """
    GET /api/v1/ai/cline/approvals/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        approvals = ClineAgentApproval.objects.filter(status=ClineAgentApproval.ApprovalStatus.PENDING)
        serializer = ClineAgentApprovalSerializer(approvals, many=True)
        return Response({"count": approvals.count(), "results": serializer.data}, status=status.HTTP_200_OK)


class ClineApprovalDecisionView(APIView):
    """
    POST /api/v1/ai/cline/approvals/decide/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        role = getattr(request.user, "role", "PATIENT")
        if role not in ["DOCTOR", "INFORMATICIST", "ADMIN", "SUPERADMIN"] and not request.user.is_staff:
            return Response({"error": "Unauthorized to approve agent operations."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClineApprovalDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        approval = get_object_or_404(ClineAgentApproval, id=serializer.validated_data["approval_id"])
        decision = serializer.validated_data["decision"]
        reason = serializer.validated_data.get("reason", "")

        approval.status = (
            ClineAgentApproval.ApprovalStatus.APPROVED
            if decision == "APPROVE"
            else ClineAgentApproval.ApprovalStatus.DENIED
        )
        approval.approved_by = request.user
        approval.reason = reason
        approval.decided_at = timezone.now()
        approval.save(update_fields=["status", "approved_by", "reason", "decided_at"])

        # Update associated task
        task = approval.task
        if decision == "APPROVE":
            task.status = ClineAgentTask.TaskStatus.COMPLETED
            task.result_summary = f"Operation '{approval.requested_action}' authorized and executed by human sign-off."
            task.completed_at = timezone.now()
            task.save(update_fields=["status", "result_summary", "completed_at"])

            ClineEventAdapter.emit_event(
                session_id=str(task.session_id),
                task_id=str(task.id),
                event_type="tool_approved",
                tool_name=approval.requested_action,
                summary=f"Tool operation authorized by {request.user.username}.",
                approval_state="APPROVED",
                correlation_id=task.session.correlation_id,
            )
        else:
            task.status = ClineAgentTask.TaskStatus.FAILED
            task.error_code = "HUMAN_REJECTED"
            task.result_summary = f"Operation rejected: {reason}"
            task.completed_at = timezone.now()
            task.save(update_fields=["status", "error_code", "result_summary", "completed_at"])

            ClineEventAdapter.emit_event(
                session_id=str(task.session_id),
                task_id=str(task.id),
                event_type="tool_denied",
                tool_name=approval.requested_action,
                summary=f"Tool operation denied: {reason}",
                approval_state="DENIED",
                correlation_id=task.session.correlation_id,
            )

        return Response({"message": f"Approval gate {approval.id} updated to {approval.status}."}, status=status.HTTP_200_OK)


class ClineKillSwitchView(APIView):
    """
    GET /api/v1/ai/cline/kill-switch/
    POST /api/v1/ai/cline/kill-switch/
    Emergency AI stop toggle restricted to Administrators.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        is_active = os.environ.get("AI_KILL_SWITCH_ACTIVE") == "true"
        return Response({"kill_switch_active": is_active}, status=status.HTTP_200_OK)

    def post(self, request: Request) -> Response:
        role = getattr(request.user, "role", "PATIENT")
        if role not in ["ADMIN", "SUPERADMIN"] and not request.user.is_staff:
            return Response({"error": "Admin privileges required to toggle kill switch."}, status=status.HTTP_403_FORBIDDEN)

        active = bool(request.data.get("active", False))
        os.environ["AI_KILL_SWITCH_ACTIVE"] = "true" if active else "false"

        ClineAuditAdapter.record_audit(
            correlation_id="kill-switch-toggle",
            user_id=str(request.user.id),
            role=role,
            event_type="KILL_SWITCH",
            agent_type="ADMIN_OVERRIDE",
            payload_summary=f"Global Kill Switch set to {active} by {request.user.username}",
            safety_verdict="KILL_SWITCH_ENGAGED" if active else "KILL_SWITCH_DISENGAGED",
        )

        return Response(
            {
                "kill_switch_active": active,
                "message": f"Global AI Emergency Kill Switch is now {'ACTIVE' if active else 'DEACTIVATED'}.",
            },
            status=status.HTTP_200_OK,
        )


class ClineToolDefinitionListView(APIView):
    """
    GET /api/v1/ai/cline/tools/
    Returns approved tools and risk tiers.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        role = getattr(request.user, "role", "PATIENT")
        tools = ClineToolRegistry.list_tools_for_role(role)
        results = [
            {
                "name": t.name,
                "description": t.description,
                "risk_level": t.risk_level,
                "allowed_roles": t.allowed_roles,
                "input_schema": t.input_schema,
                "requires_approval": t.requires_approval,
            }
            for t in tools
        ]
        return Response({"count": len(results), "results": results}, status=status.HTTP_200_OK)

