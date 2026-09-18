"""
DRF Views and ViewSets for Google Jules Engineering Automation.
Restricted exclusively to IT Administrators and authorized engineering staff.
"""
import time
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from integrations.jules.config import get_jules_settings
from integrations.jules.circuit_breaker import global_jules_circuit_breaker
from integrations.jules.models import (
    JulesSource,
    JulesSession,
    JulesActivity,
    JulesRemediationJob,
    JulesApproval,
    RemediationJobStatus,
)
from integrations.jules.serializers import (
    JulesSourceSerializer,
    JulesSessionSerializer,
    JulesActivitySerializer,
    JulesRemediationJobSerializer,
    JulesRemediationCreateSerializer,
    JulesApprovePlanSerializer,
    JulesSendMessageSerializer,
    JulesApprovalSerializer,
)
from integrations.jules.services import JulesSourceSyncService, JulesRemediationService
from integrations.jules.adapters import get_jules_client
from integrations.jules.exceptions import JulesBaseError


class IsJulesAdmin(IsAuthenticated):
    """Permission allowing only IT_ADMIN, ADMIN, or superusers to manage Jules."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        user = request.user
        role = getattr(user, "role", "").upper()
        return bool(user.is_superuser or user.is_staff or role in ("IT_ADMIN", "ADMIN"))


class JulesHealthView(APIView):
    permission_classes = [IsJulesAdmin]

    def get(self, request):
        settings = get_jules_settings()
        client = get_jules_client()
        start = time.time()
        api_reachable = False
        error_msg = None

        if settings.is_configured and settings.enabled:
            try:
                client.list_sources(page_size=1)
                api_reachable = True
            except Exception as e:
                error_msg = str(e)

        latency_ms = round((time.time() - start) * 1000, 2)
        sources_count = JulesSource.objects.filter(enabled=True).count()
        active_sessions = JulesSession.objects.exclude(state__in=["COMPLETED", "FAILED", "CANCELLED"]).count()

        return Response(
            {
                "service": "jules",
                "enabled": settings.enabled,
                "configured": settings.is_configured,
                "api_reachable": api_reachable,
                "latency_ms": latency_ms,
                "error": error_msg,
                "sources_count": sources_count,
                "active_sessions_count": active_sessions,
                "circuit_breaker": global_jules_circuit_breaker.get_status(),
                "environment": settings.environment,
            },
            status=status.HTTP_200_OK,
        )


class JulesSourceViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsJulesAdmin]
    queryset = JulesSource.objects.all()
    serializer_class = JulesSourceSerializer

    @action(detail=False, methods=["post"])
    def sync(self, request):
        try:
            sources = JulesSourceSyncService.sync_sources(actor_id=request.user.email)
            return Response(JulesSourceSerializer(sources, many=True).data, status=status.HTTP_200_OK)
        except JulesBaseError as e:
            return Response(e.to_dict(), status=e.status_code or 500)


class JulesRemediationJobViewSet(viewsets.ModelViewSet):
    permission_classes = [IsJulesAdmin]
    queryset = JulesRemediationJob.objects.select_related("session", "source").prefetch_related("approvals").all()
    serializer_class = JulesRemediationJobSerializer

    def create(self, request, *args, **kwargs):
        serializer = JulesRemediationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            job = JulesRemediationService.create_remediation_job(
                title=data["title"],
                issue_category=data["issue_category"],
                description=data["description"],
                repository=data.get("repository", "HealthNova-AI"),
                branch=data.get("branch", "develop"),
                trigger_type=data.get("trigger_type", "MANUAL"),
                severity=data.get("severity", "MEDIUM"),
                issue_reference=data.get("issue_reference", ""),
                affected_files=data.get("affected_files", []),
                error_log=data.get("error_log", ""),
                created_by=request.user,
                actor_role=getattr(request.user, "role", "IT_ADMIN"),
            )
            return Response(JulesRemediationJobSerializer(job).data, status=status.HTTP_201_CREATED)
        except JulesBaseError as e:
            return Response(e.to_dict(), status=e.status_code or 500)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        job = self.get_object()
        serializer = JulesApprovePlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get("reason", "")

        try:
            approval = JulesRemediationService.approve_plan(job, approver_user=request.user, reason=reason)
            return Response(JulesApprovalSerializer(approval).data, status=status.HTTP_200_OK)
        except JulesBaseError as e:
            return Response(e.to_dict(), status=e.status_code or 500)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        job = self.get_object()
        job.status = RemediationJobStatus.CANCELLED
        job.save(update_fields=["status", "updated_at"])
        if hasattr(job, "session"):
            job.session.state = "CANCELLED"
            job.session.save(update_fields=["state", "updated_at"])
        return Response({"status": "CANCELLED"}, status=status.HTTP_200_OK)


class JulesSessionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsJulesAdmin]
    queryset = JulesSession.objects.prefetch_related("activities", "artifacts").all()
    serializer_class = JulesSessionSerializer

    @action(detail=True, methods=["post"])
    def message(self, request, pk=None):
        session = self.get_object()
        serializer = JulesSendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            act = JulesRemediationService.send_session_message(
                session, message=serializer.validated_data["message"], sender=request.user
            )
            return Response(JulesActivitySerializer(act).data, status=status.HTTP_200_OK)
        except JulesBaseError as e:
            return Response(e.to_dict(), status=e.status_code or 500)

    @action(detail=True, methods=["get"])
    def activities(self, request, pk=None):
        session = self.get_object()
        acts = JulesRemediationService.sync_session_activities(session)
        return Response(JulesActivitySerializer(acts, many=True).data, status=status.HTTP_200_OK)


class JulesActivityListView(APIView):
    permission_classes = [IsJulesAdmin]

    def get(self, request):
        limit = min(int(request.query_params.get("limit", 50)), 100)
        acts = JulesActivity.objects.select_related("jules_session").order_by("-created_at")[:limit]
        return Response(JulesActivitySerializer(acts, many=True).data, status=status.HTTP_200_OK)


class JulesSettingsView(APIView):
    permission_classes = [IsJulesAdmin]

    def get(self, request):
        s = get_jules_settings()
        return Response(
            {
                "enabled": s.enabled,
                "is_configured": s.is_configured,
                "base_url": s.base_url,
                "timeout_seconds": s.timeout_seconds,
                "connect_timeout_seconds": s.connect_timeout_seconds,
                "max_concurrent_sessions": s.max_concurrent_sessions,
                "require_plan_approval": s.require_plan_approval,
                "auto_create_pr": s.auto_create_pr,
                "allowed_repositories": s.allowed_repositories,
                "allowed_branches": s.allowed_branches,
                "environment": s.environment,
                "circuit_breaker": global_jules_circuit_breaker.get_status(),
            },
            status=status.HTTP_200_OK,
        )
