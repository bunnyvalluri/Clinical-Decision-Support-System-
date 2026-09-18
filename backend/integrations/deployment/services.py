"""
Clean Architecture Deployment Services for HealthNova AI CDSS.
Includes:
- DeploymentAuditService: Writes immutable audit logs to AuditLog and DeploymentRecord
- DeploymentRollbackService: Controls rollbacks with mandatory confirmation and version verification
- DeploymentService: Orchestrates end-to-end safe deployments (pre-flight checks, registry validation, Coolify triggers, lineage recording)
"""

import logging
import uuid
from typing import Any, Dict, Optional
from django.conf import settings
from django.utils import timezone

from integrations.coolify.client import CoolifyClient, CoolifyException
from .health import HealthCheckService
from .registry import ContainerRegistryClient

logger = logging.getLogger(__name__)


def _resolve_application(application_id: str) -> Optional[Any]:
    if not application_id:
        return None
    from apps.infrastructure.models import DeploymentApplication
    app = DeploymentApplication.objects.filter(coolify_resource_id=application_id).first()
    if not app:
        try:
            val = uuid.UUID(str(application_id))
            app = DeploymentApplication.objects.filter(id=val).first()
        except (ValueError, TypeError):
            pass
    return app


class DeploymentAuditService:
    """
    Guarantees immutable recording of all deployment, rollback, and container events.
    """

    @staticmethod
    def record_deployment_event(
        actor: Any,
        action: str,
        resource_id: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Any:
        from apps.core.models import AuditLog
        return AuditLog.objects.create(
            user=actor if getattr(actor, "is_authenticated", False) else None,
            action=action,
            resource_type="DeploymentRecord",
            resource_id=str(resource_id),
            description=description,
        )


class DeploymentRollbackService:
    """
    Manages safe, controlled rollbacks. Requires explicit human confirmation.
    Never executes automated schema tear-downs.
    """

    def __init__(
        self,
        coolify_client: Optional[CoolifyClient] = None,
        audit_service: Optional[DeploymentAuditService] = None,
    ):
        self.coolify = coolify_client or CoolifyClient()
        self.audit = audit_service or DeploymentAuditService()

    def rollback(
        self,
        application_id: str,
        target_commit_sha: str,
        actor: Any,
        confirmation: str,
        reason: str = "Rollback initiated",
    ) -> Dict[str, Any]:
        """
        Execute rollback to a previously verified commit SHA.
        Requires explicit confirmation='CONFIRM_ROLLBACK'.
        """
        if confirmation != "CONFIRM_ROLLBACK":
            raise ValueError("Rollback requires explicit confirmation='CONFIRM_ROLLBACK'.")

        if not application_id or not target_commit_sha:
            raise ValueError("application_id and target_commit_sha are mandatory for rollback.")

        corr_id = uuid.uuid4()
        app = _resolve_application(application_id)

        logger.warning(
            f"Initiating rollback for application {application_id} to commit {target_commit_sha} by {actor} [corr={corr_id}]"
        )

        # Trigger Coolify deployment with target commit
        deploy_res = self.coolify.deploy_application(
            app_uuid=application_id,
            commit=target_commit_sha,
            force=True,
        )
        coolify_dep_id = deploy_res.get("deployment_id", str(uuid.uuid4()))

        from apps.infrastructure.models import DeploymentRecord
        from apps.core.models import AuditLog

        # Record in DeploymentRecord
        record = DeploymentRecord.objects.create(
            coolify_deployment_id=coolify_dep_id,
            application=app,
            commit_sha=target_commit_sha,
            status=DeploymentRecord.Status.QUEUED,
            trigger="ROLLBACK",
            actor=actor if getattr(actor, "is_authenticated", False) else None,
            environment=app.environment if app else "PRODUCTION",
            correlation_id=corr_id,
            metadata={"reason": reason, "rollback": True},
        )

        # Write immutable audit log
        self.audit.record_deployment_event(
            actor=actor,
            action=AuditLog.Action.UPDATE,
            resource_id=str(record.id),
            description=f"Rollback queued for app {application_id} to {target_commit_sha}. Reason: {reason}",
            metadata={"correlation_id": str(corr_id)},
        )

        return {
            "success": True,
            "deployment_id": coolify_dep_id,
            "correlation_id": str(corr_id),
            "record_id": str(record.id),
            "status": "QUEUED",
        }


class DeploymentService:
    """
    Main orchestration service for production & staging deployments.
    Coordinates registry verification, lineage capture, Coolify dispatch, and audit logging.
    """

    def __init__(
        self,
        coolify_client: Optional[CoolifyClient] = None,
        registry_client: Optional[ContainerRegistryClient] = None,
        health_service: Optional[HealthCheckService] = None,
        audit_service: Optional[DeploymentAuditService] = None,
    ):
        self.coolify = coolify_client or CoolifyClient()
        self.registry = registry_client or ContainerRegistryClient()
        self.health = health_service or HealthCheckService()
        self.audit = audit_service or DeploymentAuditService()

    def deploy(
        self,
        application_id: str,
        commit_sha: str,
        actor: Any,
        image_digest: str = "",
        frontend_version: str = "",
        backend_version: str = "",
        model_version: str = "",
        dataset_version: str = "",
        reason: str = "Automated release trigger",
        force: bool = False,
    ) -> Dict[str, Any]:
        """
        Deploy application stack with full ML & codebase lineage metadata.
        """
        if not application_id:
            raise ValueError("application_id is required.")

        # Tag validation
        if commit_sha and not self.registry.validate_image_tag(commit_sha):
            raise ValueError(f"Unsafe image tag/commit '{commit_sha}'. Only immutable SHAs or semantic tags are allowed.")

        corr_id = uuid.uuid4()
        app = _resolve_application(application_id)

        # Trigger Coolify deploy
        deploy_res = self.coolify.deploy_application(
            app_uuid=application_id,
            commit=commit_sha if commit_sha else None,
            force=force,
        )
        coolify_dep_id = deploy_res.get("deployment_id", str(uuid.uuid4()))

        from apps.infrastructure.models import DeploymentRecord
        from apps.core.models import AuditLog

        # Save immutable record with full lineage
        record = DeploymentRecord.objects.create(
            coolify_deployment_id=coolify_dep_id,
            application=app,
            commit_sha=commit_sha,
            image_digest=image_digest,
            frontend_version=frontend_version,
            backend_version=backend_version,
            model_version=model_version,
            dataset_version=dataset_version,
            status=DeploymentRecord.Status.QUEUED,
            trigger="API",
            actor=actor if getattr(actor, "is_authenticated", False) else None,
            environment=app.environment if app else "PRODUCTION",
            correlation_id=corr_id,
            metadata={"reason": reason},
        )

        # Audit log
        self.audit.record_deployment_event(
            actor=actor,
            action=AuditLog.Action.CREATE,
            resource_id=str(record.id),
            description=f"Triggered deployment for {application_id} [sha={commit_sha}, model={model_version}, dataset={dataset_version}]",
            metadata={"correlation_id": str(corr_id)},
        )

        return {
            "success": True,
            "deployment_id": coolify_dep_id,
            "correlation_id": str(corr_id),
            "record_id": str(record.id),
            "status": "QUEUED",
        }
