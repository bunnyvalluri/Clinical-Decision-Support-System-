"""
REST Framework API Views for Infrastructure Management.
Restricted strictly to IT Administrators (with read-only operational telemetry for Informaticists).
Doctors, Nurses, and Patients are strictly forbidden (HTTP 403).
"""

import logging
import uuid
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.core.models import AuditLog
from apps.core.permissions import IsAdmin, IsITAdmin
from integrations.coolify.service import CoolifyPlatformService, get_coolify_client
from .models import InfrastructureServer, DeploymentApplication, DeploymentRecord
from .serializers import (
    InfrastructureServerSerializer,
    DeploymentApplicationSerializer,
    DeploymentRecordSerializer,
    TriggerDeploymentRequestSerializer,
)

logger = logging.getLogger(__name__)


class CanManageInfrastructure(permissions.BasePermission):
    """Grant full management only to IT Administrators. Informaticist has read-only."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # IT Admin has full access
        if getattr(request.user, "is_admin", False) or request.user.role in (UserRole.ADMIN, UserRole.IT_ADMIN):
            return True

        # Informaticists have read-only access to safe telemetry
        if request.user.role in (UserRole.MEDICAL_INFORMATICIST, UserRole.ANALYST, "INFORMATICIST"):
            return request.method in permissions.SAFE_METHODS

        return False


class InfrastructureHealthView(APIView):
    """
    Check Coolify control plane connectivity and circuit breaker state.
    GET /api/v1/infrastructure/health/
    """
    permission_classes = [CanManageInfrastructure]

    def get(self, request):
        service = CoolifyPlatformService()
        health = service.get_infrastructure_overview()
        return Response(health, status=status.HTTP_200_OK)


class InfrastructureServersListView(APIView):
    """
    List registered Docker host servers.
    GET /api/v1/infrastructure/servers/
    """
    permission_classes = [CanManageInfrastructure]

    def get(self, request):
        servers = InfrastructureServer.objects.all()
        serializer = InfrastructureServerSerializer(servers, many=True)
        return Response({"servers": serializer.data, "count": servers.count()})


class DeploymentApplicationsListView(APIView):
    """
    List configured application deployment stacks.
    GET /api/v1/infrastructure/applications/
    """
    permission_classes = [CanManageInfrastructure]

    def get(self, request):
        apps = DeploymentApplication.objects.all()
        serializer = DeploymentApplicationSerializer(apps, many=True)
        return Response({"applications": serializer.data, "count": apps.count()})


class DeploymentHistoryListView(APIView):
    """
    Historical deployment audit trail.
    GET /api/v1/infrastructure/deployments/
    """
    permission_classes = [CanManageInfrastructure]

    def get(self, request):
        deployments = DeploymentRecord.objects.all()[:50]
        serializer = DeploymentRecordSerializer(deployments, many=True)
        return Response({"deployments": serializer.data, "count": len(serializer.data)})


class TriggerDeploymentView(APIView):
    """
    Authorized deployment trigger for an application stack.
    POST /api/v1/infrastructure/deploy/
    Requires explicit IT Administrator credentials.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = TriggerDeploymentRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        app_id = serializer.validated_data["application_id"]
        commit_sha = serializer.validated_data.get("commit_sha", "")
        reason = serializer.validated_data.get("reason", "Manual trigger")
        corr_id = uuid.uuid4()

        service = CoolifyPlatformService()
        result = service.trigger_deployment(
            application_uuid=app_id,
            actor=request.user,
            commit_sha=commit_sha,
            correlation_id=str(corr_id),
        )

        # Record deployment in local database
        record = DeploymentRecord.objects.create(
            coolify_deployment_id=result["deployment_id"],
            commit_sha=commit_sha,
            status=DeploymentRecord.Status.QUEUED,
            trigger="API",
            actor=request.user,
            correlation_id=corr_id,
        )

        # Audit log
        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.Action.CREATE,
            resource_type="DeploymentRecord",
            resource_id=str(record.id),
            description=f"Triggered deployment for app {app_id} [sha={commit_sha}] reason={reason}",
        )

        return Response(
            {
                "success": True,
                "deployment_id": result["deployment_id"],
                "status": "QUEUED",
                "correlation_id": str(corr_id),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class RollbackDeploymentView(APIView):
    """
    Rollback deployment trigger.
    POST /api/v1/infrastructure/rollback/
    Requires explicit confirmation in payload.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        confirmation = request.data.get("confirmation")
        if confirmation != "CONFIRM_ROLLBACK":
            return Response(
                {"error": "Rollback requires explicit confirmation='CONFIRM_ROLLBACK' in payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        app_id = request.data.get("application_id")
        target_commit = request.data.get("target_commit_sha")
        if not app_id or not target_commit:
            return Response(
                {"error": "Both application_id and target_commit_sha are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        corr_id = uuid.uuid4()
        service = CoolifyPlatformService()
        result = service.trigger_deployment(
            application_uuid=app_id,
            actor=request.user,
            commit_sha=target_commit,
            correlation_id=str(corr_id),
        )

        DeploymentRecord.objects.create(
            coolify_deployment_id=result["deployment_id"],
            commit_sha=target_commit,
            status=DeploymentRecord.Status.QUEUED,
            trigger="ROLLBACK",
            actor=request.user,
            correlation_id=corr_id,
        )

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.Action.UPDATE,
            resource_type="DeploymentRecord",
            resource_id=str(corr_id),
            description=f"Rollback initiated for {app_id} to commit {target_commit}",
        )

        return Response(
            {
                "success": True,
                "message": "Rollback queued successfully.",
                "correlation_id": str(corr_id),
            },
            status=status.HTTP_202_ACCEPTED,
        )
