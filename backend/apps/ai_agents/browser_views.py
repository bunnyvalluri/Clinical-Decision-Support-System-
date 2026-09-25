"""
REST API Views for Browser Agent Tasks, Controlled Tools, Policies, Providers, and Kill Switch.
Integrates Jev Ultrafast runtime through BrowserAgentGateway.
"""
import logging
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.ai_agents.browser_serializers import (
    AgentKillSwitchSerializer,
    ApprovedDestinationSerializer,
    BrowserAgentRunSerializer,
    BrowserAgentTaskCreateSerializer,
    BrowserAgentTaskSerializer,
    BrowserDestinationSerializer,
    BrowserTaskPolicySerializer,
    BrowserVerificationSerializer,
)
from apps.ai_agents.models import (
    AgentKillSwitchState,
    ApprovalStatus,
    ApprovedDestination,
    BrowserAgentRun,
    BrowserAgentTask,
    BrowserDestination,
    BrowserTaskPolicy,
    BrowserTaskState,
    BrowserVerification,
    VerificationStatus,
)
from apps.ai_agents.services.browser_tool_registry import BrowserToolRegistry
from apps.ai_agents.services.safety_gateway import BrowserAgentSafetyGateway
from apps.core.models import AuditLog
from integrations.browser_agent.gateway import BrowserAgentGateway

logger = logging.getLogger("ai_agents.browser_views")


def _is_staff_or_admin(user) -> bool:
    if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
        return True
    role = str(getattr(user, "role", "")).upper()
    return role in (
        UserRole.ADMIN,
        UserRole.IT_ADMIN,
        UserRole.MEDICAL_INFORMATICIST,
        UserRole.CLINICIAN,
        UserRole.DOCTOR,
        "ADMIN",
        "INFORMATICIST",
        "DOCTOR",
        "CLINICIAN",
    )


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def browser_task_list_create_view(request: Request) -> Response:
    """
    List or create controlled browser agent tasks.
    """
    if not _is_staff_or_admin(request.user):
        return Response({"detail": "Permission denied. Ordinary patients cannot access browser automation."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        qs = BrowserAgentTask.objects.all().select_related("requested_by", "approved_by")
        
        exec_status = request.query_params.get("status")
        if exec_status:
            qs = qs.filter(execution_status=exec_status.upper())

        risk_level = request.query_params.get("risk_level")
        if risk_level:
            qs = qs.filter(risk_level=risk_level.upper())

        domain = request.query_params.get("domain")
        if domain:
            qs = qs.filter(destination_domain__icontains=domain)

        provider = request.query_params.get("provider")
        if provider:
            qs = qs.filter(provider=provider)

        serializer = BrowserAgentTaskSerializer(qs[:50], many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    # POST: Submit new task through Gateway
    serializer = BrowserAgentTaskCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    provider_id = data.get("provider", "jev-ultrafast")
    task_res = BrowserAgentGateway.create_task({
        "user": request.user,
        "goal": data["goal"],
        "destination_url": data["destination_url"],
        "allowed_operations": data.get("allowed_operations"),
        "phi_classification": data.get("phi_classification"),
        "patient_context_reference": data.get("patient_context_reference"),
        "environment": data.get("environment", "PRODUCTION"),
        "independent_verification_rules": data.get("independent_verification_rules", {}),
    }, provider_id=provider_id)

    task_id = task_res["task_id"]
    task = BrowserAgentTask.objects.get(id=task_id)

    # If approved to run immediately, dispatch async via Celery or sync
    if task.approval_status == ApprovalStatus.APPROVED and task.execution_status == BrowserTaskState.READY:
        try:
            from apps.ai_agents.tasks import execute_browser_agent_task_async
            execute_browser_agent_task_async.delay(str(task.id))
        except Exception:
            BrowserAgentGateway.start_task(str(task.id), provider_id=provider_id)
            task.refresh_from_db()

    return Response(BrowserAgentTaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def browser_task_detail_view(request: Request, pk: str) -> Response:
    """
    Get detailed execution log and verification report for a browser task.
    """
    if not _is_staff_or_admin(request.user):
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    try:
        task = BrowserAgentTask.objects.select_related("requested_by", "approved_by").prefetch_related("runs__actions").get(id=pk)
    except (BrowserAgentTask.DoesNotExist, ValueError):
        return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

    return Response(BrowserAgentTaskSerializer(task).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def browser_task_approve_view(request: Request, pk: str) -> Response:
    """
    Human-in-the-loop review sign-off for pending browser task.
    """
    if not _is_staff_or_admin(request.user):
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    try:
        task = BrowserAgentTask.objects.get(id=pk)
    except (BrowserAgentTask.DoesNotExist, ValueError):
        return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

    if task.execution_status != BrowserTaskState.AWAITING_APPROVAL:
        return Response({"detail": f"Task cannot be approved in state '{task.execution_status}'."}, status=status.HTTP_400_BAD_REQUEST)

    task.approval_status = ApprovalStatus.APPROVED
    task.approved_by = request.user
    task.approved_at = timezone.now()
    task.execution_status = BrowserTaskState.READY
    task.save(update_fields=["approval_status", "approved_by", "approved_at", "execution_status"])

    # Launch task execution
    try:
        from apps.ai_agents.tasks import execute_browser_agent_task_async
        execute_browser_agent_task_async.delay(str(task.id))
    except Exception:
        BrowserAgentGateway.start_task(str(task.id), provider_id=task.provider)
        task.refresh_from_db()

    return Response(BrowserAgentTaskSerializer(task).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def browser_task_reject_view(request: Request, pk: str) -> Response:
    """
    Human reviewer rejects a pending browser task.
    """
    if not _is_staff_or_admin(request.user):
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    try:
        task = BrowserAgentTask.objects.get(id=pk)
    except (BrowserAgentTask.DoesNotExist, ValueError):
        return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get("reason", "Rejected by reviewer.")
    task.approval_status = ApprovalStatus.REJECTED
    task.rejection_reason = reason
    task.execution_status = BrowserTaskState.BLOCKED
    task.failure_reason = f"Human rejection: {reason}"
    task.save(update_fields=["approval_status", "rejection_reason", "execution_status", "failure_reason"])

    return Response(BrowserAgentTaskSerializer(task).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def browser_task_cancel_view(request: Request, pk: str) -> Response:
    """
    Cancel an active or queued browser task.
    """
    if not _is_staff_or_admin(request.user):
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    try:
        task = BrowserAgentTask.objects.get(id=pk)
    except (BrowserAgentTask.DoesNotExist, ValueError):
        return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

    BrowserAgentGateway.cancel_task(str(task.id), reason="Cancelled by user")
    task.refresh_from_db()
    return Response(BrowserAgentTaskSerializer(task).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def browser_task_runs_view(request: Request, pk: str) -> Response:
    """
    List runs and atomic actions for a browser task.
    """
    if not _is_staff_or_admin(request.user):
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    runs = BrowserAgentRun.objects.filter(task_id=pk).prefetch_related("actions").order_by("-created_at")
    return Response(BrowserAgentRunSerializer(runs, many=True).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def browser_task_verification_view(request: Request, pk: str) -> Response:
    """
    Retrieve independent verification report for a task.
    """
    if not _is_staff_or_admin(request.user):
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    verification = BrowserVerification.objects.filter(task_id=pk).first()
    if not verification:
        return Response({"detail": "Verification record not found."}, status=status.HTTP_404_NOT_FOUND)

    return Response(BrowserVerificationSerializer(verification).data)


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def approved_destination_list_create_view(request: Request) -> Response:
    """
    List or add approved destination domains.
    """
    if not _is_staff_or_admin(request.user):
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        destinations = BrowserDestination.objects.all().order_by("domain")
        return Response(BrowserDestinationSerializer(destinations, many=True).data)

    # POST: Admin only
    if getattr(request.user, "role", "") != UserRole.ADMIN and not getattr(request.user, "is_superuser", False):
        return Response({"detail": "Only system administrators can register approved destinations."}, status=status.HTTP_403_FORBIDDEN)

    serializer = BrowserDestinationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    destination = serializer.save()

    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def browser_task_policy_list_create_view(request: Request) -> Response:
    """
    List or create browser task policies.
    """
    if not _is_staff_or_admin(request.user):
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        policies = BrowserTaskPolicy.objects.all().order_by("name")
        return Response(BrowserTaskPolicySerializer(policies, many=True).data)

    if getattr(request.user, "role", "") != UserRole.ADMIN and not getattr(request.user, "is_superuser", False):
        return Response({"detail": "Only system administrators can configure policies."}, status=status.HTTP_403_FORBIDDEN)

    serializer = BrowserTaskPolicySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    policy = serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def browser_providers_list_view(request: Request) -> Response:
    """
    List registered browser runtime providers.
    """
    providers = BrowserAgentGateway.list_providers()
    return Response({"count": len(providers), "providers": providers})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def browser_tools_list_view(request: Request) -> Response:
    """
    List controlled browser tools and metadata.
    """
    tools = BrowserToolRegistry.get_all_tools()
    return Response({"count": len(tools), "tools": tools})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def browser_agent_health_view(request: Request) -> Response:
    """
    Return honest runtime health diagnostics.
    """
    provider_id = request.query_params.get("provider", "jev-ultrafast")
    health = BrowserAgentGateway.health_check(provider_id=provider_id)
    return Response(health)


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def browser_agent_kill_switch_view(request: Request) -> Response:
    """
    Get or toggle emergency operational kill switch.
    """
    if getattr(request.user, "role", "") != UserRole.ADMIN and not getattr(request.user, "is_superuser", False):
        return Response({"detail": "Only administrators can manage the agent kill switch."}, status=status.HTTP_403_FORBIDDEN)

    state = AgentKillSwitchState.objects.first()
    if not state:
        state = AgentKillSwitchState.objects.create(is_active=False)

    if request.method == "GET":
        return Response(AgentKillSwitchSerializer(state).data)

    # POST: toggle switch
    is_active = request.data.get("is_active", not state.is_active)
    reason = request.data.get("reason", "Administrative toggle.")

    state.is_active = is_active
    state.activated_by = request.user
    state.reason = reason
    state.activated_at = timezone.now() if is_active else None
    state.save()

    return Response(AgentKillSwitchSerializer(state).data)
