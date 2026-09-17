import logging
import uuid
from typing import Any, Dict
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.ai_agents.models import (
    AgentApproval,
    AgentDefinition,
    AgentEvaluation,
    AgentExecution,
    AgentFeedback,
    AgentMessage,
    AgentSession,
    AgentToolDefinition,
    ApprovalStatus,
)
from apps.ai_agents.permissions import (
    CanAccessAgentSession,
    CanApproveAgentAction,
    IsAgentAuthorizedUser,
)
from apps.ai_agents.schemas.requests import (
    AgentFeedbackRequest,
    AgentRunRequest,
    ApprovalDecisionRequest,
)
from apps.ai_agents.serializers import (
    AgentApprovalSerializer,
    AgentDefinitionSerializer,
    AgentEvaluationSerializer,
    AgentExecutionSerializer,
    AgentFeedbackSerializer,
    AgentMessageSerializer,
    AgentSessionSerializer,
    AgentToolDefinitionSerializer,
)
from apps.ai_agents.services.agent_service import AgentService
from apps.ai_agents.services.approval_service import ApprovalService
from apps.ai_agents.services.safety_service import SafetyService
from apps.ai_agents.services.tool_registry import ToolRegistry

logger = logging.getLogger("ai_agents.views")


class AgentDefinitionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List registered agent configurations.
    """
    queryset = AgentDefinition.objects.filter(enabled=True)
    serializer_class = AgentDefinitionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAgentAuthorizedUser]


class AgentSessionViewSet(viewsets.ModelViewSet):
    """
    Manage conversational AI agent sessions.
    Strictly isolated per user and role.
    """
    serializer_class = AgentSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAgentAuthorizedUser, CanAccessAgentSession]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", "") in ["admin", "compliance_officer"]:
            return AgentSession.objects.all().order_by("-created_at")
        return AgentSession.objects.filter(user=user).order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, "role", "doctor")
        serializer.save(user=user, role=role)

    @action(detail=True, methods=["get"], url_path="messages")
    def messages(self, request: Request, pk=None) -> Response:
        session = self.get_object()
        msgs = AgentMessage.objects.filter(session=session).order_by("created_at")
        return Response(AgentMessageSerializer(msgs, many=True).data)


class AgentExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Inspect or cancel agent executions.
    """
    serializer_class = AgentExecutionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAgentAuthorizedUser]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", "") in ["admin", "compliance_officer"]:
            return AgentExecution.objects.all().order_by("-started_at")
        return AgentExecution.objects.filter(session__user=user).order_by("-started_at")

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request: Request, pk=None) -> Response:
        """Enforces server-side cancellation of an active execution."""
        service = AgentService()
        success = service.cancel_execution(execution_id=pk, user=request.user)
        if success:
            return Response({"status": "CANCELLED", "execution_id": pk})
        return Response(
            {"detail": "Unable to cancel execution or unauthorized."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class AgentRunView(APIView):
    """
    POST /api/v1/ai/agents/run/
    Main synchronous / turn endpoint executing the policy-governed agent loop.
    """
    permission_classes = [permissions.IsAuthenticated, IsAgentAuthorizedUser]

    def post(self, request: Request) -> Response:
        serializer_input = AgentRunRequest(**request.data)
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())

        service = AgentService()
        try:
            response_dto = service.execute_turn(
                user=request.user,
                request_dto=serializer_input,
                correlation_id=correlation_id,
            )
            return Response(response_dto.model_dump())
        except Exception as exc:
            logger.exception(f"Agent execution error: {exc}")
            return Response(
                {
                    "code": "AGENT_EXECUTION_ERROR",
                    "message": "Clinical AI assistance is temporarily degraded. Please continue standard workflow.",
                    "details": str(exc),
                    "retryable": False,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AgentApprovalViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and process pending clinician approval gates.
    """
    serializer_class = AgentApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, IsAgentAuthorizedUser, CanApproveAgentAction]

    def get_queryset(self):
        user = self.request.user
        user_role = getattr(user, "role", "doctor")
        if user_role in ["admin", "compliance_officer"]:
            return AgentApproval.objects.all().order_by("-created_at")
        return AgentApproval.objects.filter(approving_role__iexact=user_role).order_by("-created_at")

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request: Request, pk=None) -> Response:
        approval = self.get_object()
        rationale = request.data.get("rationale", "Clinician verified and approved.")
        updated = ApprovalService.process_decision(
            approval=approval,
            clinician=request.user,
            decision=ApprovalStatus.APPROVED,
            rationale=rationale,
        )
        return Response(AgentApprovalSerializer(updated).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request: Request, pk=None) -> Response:
        approval = self.get_object()
        rationale = request.data.get("rationale", "Clinician rejected action.")
        updated = ApprovalService.process_decision(
            approval=approval,
            clinician=request.user,
            decision=ApprovalStatus.REJECTED,
            rationale=rationale,
        )
        return Response(AgentApprovalSerializer(updated).data)


class AgentToolsView(APIView):
    """
    GET /api/v1/ai/agents/tools/
    Returns list of authorized tools for the current user's role.
    """
    permission_classes = [permissions.IsAuthenticated, IsAgentAuthorizedUser]

    def get(self, request: Request) -> Response:
        user_role = getattr(request.user, "role", "patient")
        tools = ToolRegistry.list_authorized_tools(user_role=user_role)
        return Response({"tools": tools, "count": len(tools)})


class AgentEvaluationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/ai/agents/evaluations/
    Access authentic evaluation benchmark records.
    """
    queryset = AgentEvaluation.objects.all().order_by("-created_at")
    serializer_class = AgentEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAgentAuthorizedUser]


class AgentFeedbackView(APIView):
    """
    POST /api/v1/ai/agents/feedback/
    Record clinician / user feedback.
    """
    permission_classes = [permissions.IsAuthenticated, IsAgentAuthorizedUser]

    def post(self, request: Request) -> Response:
        execution_id = request.data.get("execution_id")
        rating = request.data.get("rating")
        comments = request.data.get("comments", "")

        if not execution_id or not rating:
            return Response({"detail": "execution_id and rating are required."}, status=status.HTTP_400_BAD_REQUEST)

        service = AgentService()
        feedback = service.submit_feedback(
            execution_id=execution_id,
            user=request.user,
            rating=rating,
            comments=comments,
        )
        return Response(AgentFeedbackSerializer(feedback).data, status=status.HTTP_201_CREATED)


class AgentHealthView(APIView):
    """
    GET /api/v1/ai/agents/health/
    Health check for AI agent services.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request: Request) -> Response:
        enabled = SafetyService.is_globally_enabled()
        from integrations.ollama.health import OllamaHealthChecker
        ollama_status = "UNKNOWN"
        try:
            health = OllamaHealthChecker.check_health()
            ollama_status = health.get("status", "UNKNOWN")
        except Exception:
            ollama_status = "UNAVAILABLE"

        return Response({
            "status": "HEALTHY" if enabled else "DISABLED_BY_KILL_SWITCH",
            "global_enabled": enabled,
            "ollama_inference": ollama_status,
            "runtime": "DeterministicAgentRuntime (LangGraph Adapter Ready)",
            "registered_tools_count": len(ToolRegistry._registry),
        })
