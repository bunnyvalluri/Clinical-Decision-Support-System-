"""
REST API Views for Browser Agent Tasks, Controlled Tools, and Kill Switch.

Endpoints:
- GET, POST  /api/v1/ai-agents/browser/tasks/
- GET        /api/v1/ai-agents/browser/tasks/<uuid:pk>/
- POST       /api/v1/ai-agents/browser/tasks/<uuid:pk>/approve/
- POST       /api/v1/ai-agents/browser/tasks/<uuid:pk>/reject/
- POST       /api/v1/ai-agents/browser/tasks/<uuid:pk>/cancel/
- GET, POST  /api/v1/ai-agents/browser/destinations/
- GET        /api/v1/ai-agents/browser/tools/
- GET        /api/v1/ai-agents/browser/health/
- GET, POST  /api/v1/ai-agents/browser/kill-switch/
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
    BrowserAgentTaskCreateSerializer,
    BrowserAgentTaskSerializer,
)
from apps.ai_agents.models import (
    AgentKillSwitchState,
    ApprovedDestination,
    ApprovalStatus,
    BrowserAgentTask,
    BrowserTaskState,
    VerificationStatus,
)
from apps.ai_agents.services.browser_tool_registry import BrowserToolRegistry
from apps.ai_agents.services.safety_gateway import BrowserAgentSafetyGateway
from apps.core.models import AuditLog
from integrations.laya_agent.adapter import LayaAgentAdapter

logger = logging.getLogger("ai_agents.browser_views")


def _is_staff_or_admin(user) -> bool:
    return getattr(user, "role", "") in (UserRole.ADMIN, UserRole.INFORMATICIST, UserRole.CLINICIAN, UserRole.DOCTOR) or getattr(user, "is_superuser", False)


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
        
        # Filtering
        exec_status = request.query_params.get("status")
        if exec_status:
            qs = qs.filter(execution_status=exec_status.upper())

        risk_level = request.query_params.get("risk_level")
        if risk_level:
            qs = qs.filter(risk_level=risk_level.upper())

        domain = request.query_params.get("domain")
        if domain:
            qs = qs.filter(destination_domain__icontains=domain)

        serializer = BrowserAgentTaskSerializer(qs[:50], many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    # POST: Submit new task
    serializer = BrowserAgentTaskCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    # Safety Gateway Evaluation
    eval_result = BrowserAgentSafetyGateway.evaluate_task_submission(
        user=request.user,
        goal=data["goal"],
        destination_url=data["destination_url"],
        requested_phi=data.get("phi_classification"),
    )

    task = BrowserAgentTask.objects.create(
        requested_by=request.user,
        role=getattr(request.user, "role", "ADMIN"),
        goal=data["goal"],
        destination_url=data["destination_url"],
        destination_domain=eval_result["domain"],
        environment=data.get("environment", "PRODUCTION"),
        risk_level=eval_result["risk_level"],
        phi_classification=eval_result["phi_classification"],
        approval_status=ApprovalStatus.APPROVED if eval_result["is_approved_to_run"] else ApprovalStatus.PENDING,
        execution_status=eval_result["execution_status"],
        failure_reason=eval_result["block_reason"],
        independent_verification_rules=data.get("independent_verification_rules", {}),
        audit_reference=f"TASK-BROWSER-{timezone.now().strftime('%Y%m%d%H%M%S')}",
    )

    # Audit creation
    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.CREATE,
        resource_type="BrowserAgentTask",
        resource_id=str(task.id),
        description=f"User {request.user.email} submitted browser task {task.id} -> {task.destination_domain} (Status: {task.execution_status})",
        metadata={
            "goal": task.goal,
            "destination": task.destination_domain,
            "risk_level": task.risk_level,
            "status": task.execution_status,
            "block_reason": task.failure_reason,
        },
    )

    # If approved to run immediately, trigger execution (or async via Celery)
    if eval_result["is_approved_to_run"]:
        try:
            from apps.ai_agents.tasks import execute_browser_agent_task_async
            execute_browser_agent_task_async.delay(str(task.id))
        except Exception:
            # Fallback to synchronous adapter execution if Celery broker is not connected
            LayaAgentAdapter.execute_task(str(task.id))
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
        task = BrowserAgentTask.objects.select_related("requested_by", "approved_by").get(id=pk)
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
    task.execution_status = BrowserTaskState.APPROVED
    task.save(update_fields=["approval_status", "approved_by", "approved_at", "execution_status"])

    # Audit sign-off
    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.UPDATE,
        resource_type="BrowserAgentTask",
        resource_id=str(task.id),
        description=f"Physician/Admin {request.user.email} approved browser task {task.id} targeting {task.destination_domain}.",
        metadata={"decision": "APPROVED", "task_id": str(task.id)},
    )

    # Launch task execution
    try:
        from apps.ai_agents.tasks import execute_browser_agent_task_async
        execute_browser_agent_task_async.delay(str(task.id))
    except Exception:
        LayaAgentAdapter.execute_task(str(task.id))
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

    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.UPDATE,
        resource_type="BrowserAgentTask",
        resource_id=str(task.id),
        description=f"Physician/Admin {request.user.email} rejected browser task {task.id}: {reason}",
        metadata={"decision": "REJECTED", "reason": reason},
    )
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

    task.execution_status = BrowserTaskState.CANCELLED
    task.failure_reason = "Cancelled by user."
    task.completed_at = timezone.now()
    task.save(update_fields=["execution_status", "failure_reason", "completed_at"])

    return Response(BrowserAgentTaskSerializer(task).data)


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def approved_destination_list_create_view(request: Request) -> Response:
    """
    List or add approved destination domains.
    """
    if not _is_staff_or_admin(request.user):
        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        destinations = ApprovedDestination.objects.all().order_by("domain")
        return Response(ApprovedDestinationSerializer(destinations, many=True).data)

    # POST: Admin only
    if getattr(request.user, "role", "") != UserRole.ADMIN and not getattr(request.user, "is_superuser", False):
        return Response({"detail": "Only system administrators can register approved destinations."}, status=status.HTTP_403_FORBIDDEN)

    serializer = ApprovedDestinationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    destination = serializer.save()

    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.CREATE,
        resource_type="ApprovedDestination",
        resource_id=str(destination.id),
        description=f"Administrator {request.user.email} added approved domain {destination.domain}.",
        metadata={"domain": destination.domain, "phi_allowed": destination.phi_allowed},
    )
    return Response(serializer.data, status=status.HTTP_201_CREATED)


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
    status_info = LayaAgentAdapter.get_runtime_status()
    total_tasks = BrowserAgentTask.objects.count()
    succeeded = BrowserAgentTask.objects.filter(execution_status=BrowserTaskState.SUCCEEDED).count()
    pass_rate = round((succeeded / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    return Response({
        "status": status_info["status"],
        "details": status_info["details"],
        "runtime_type": status_info["runtime_type"],
        "apple_silicon_available": status_info["apple_silicon_available"],
        "remote_service_available": status_info["remote_service_available"],
        "total_tasks_count": total_tasks,
        "verification_pass_rate_pct": pass_rate,
        "timestamp": timezone.now().isoformat(),
    })


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

    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.UPDATE,
        resource_type="AgentKillSwitchState",
        resource_id=str(state.id),
        description=f"Administrator {request.user.email} {'ACTIVATED' if is_active else 'DEACTIVATED'} emergency agent kill switch: {reason}",
        metadata={"is_active": is_active, "reason": reason},
    )

    return Response(AgentKillSwitchSerializer(state).data)
