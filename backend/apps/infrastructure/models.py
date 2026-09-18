"""
Infrastructure and Deployment Tracking Models.
Records metadata for Coolify-managed servers, application deployments, and audit history.
Strictly excludes raw SSH keys or production secrets.
"""

import uuid
from django.conf import settings
from django.db import models


class InfrastructureServer(models.Model):
    """
    Metadata representation of a Coolify-managed Docker host server.
    Private SSH keys are managed exclusively by Coolify and never persisted here.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coolify_server_id = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    environment = models.CharField(max_length=50, default="PRODUCTION")
    status = models.CharField(max_length=50, default="HEALTHY")
    region = models.CharField(max_length=50, default="us-east-2")
    provider = models.CharField(max_length=100, default="Dedicated VM")
    last_health_check = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Infrastructure Server"
        verbose_name_plural = "Infrastructure Servers"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.environment}) - {self.status}"


class DeploymentApplication(models.Model):
    """
    Tracks application stacks orchestrated by Coolify (Frontend, Backend, Workers).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coolify_resource_id = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    environment = models.CharField(max_length=50, default="PRODUCTION")
    repository = models.CharField(max_length=255, default="healthnova/cdss-platform")
    branch = models.CharField(max_length=100, default="main")
    deployment_status = models.CharField(max_length=50, default="IDLE")
    last_deployment_id = models.CharField(max_length=100, blank=True, default="")
    last_deployed_commit = models.CharField(max_length=40, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Deployment Application"
        verbose_name_plural = "Deployment Applications"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} [{self.branch}] - {self.deployment_status}"


class DeploymentRecord(models.Model):
    """
    Immutable historical record of a deployment execution.
    """
    class Status(models.TextChoices):
        QUEUED = "QUEUED", "Queued"
        RUNNING = "RUNNING", "Running"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"
        UNKNOWN = "UNKNOWN", "Unknown"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coolify_deployment_id = models.CharField(max_length=100, db_index=True)
    application = models.ForeignKey(
        DeploymentApplication,
        on_delete=models.CASCADE,
        related_name="deployments",
        null=True,
        blank=True,
    )
    commit_sha = models.CharField(max_length=40, blank=True, default="")
    image_digest = models.CharField(max_length=255, blank=True, default="")
    frontend_version = models.CharField(max_length=50, blank=True, default="")
    backend_version = models.CharField(max_length=50, blank=True, default="")
    model_version = models.CharField(max_length=50, blank=True, default="")
    dataset_version = models.CharField(max_length=50, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    trigger = models.CharField(max_length=50, default="MANUAL")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_deployments",
    )
    environment = models.CharField(max_length=50, default="PRODUCTION")
    correlation_id = models.UUIDField(default=uuid.uuid4, db_index=True)

    class Meta:
        verbose_name = "Deployment Record"
        verbose_name_plural = "Deployment Records"
        ordering = ["-started_at"]

    def __str__(self):
        return f"Deployment {self.coolify_deployment_id} ({self.status}) - {self.environment}"


# Re-export Disaster Recovery and Backup Models
from .recovery_models import (  # noqa: E402
    RecoveryTargetConfig,
    BackupRecord,
    DisasterRecoveryDrill,
    RollbackRecord,
)

# Re-export Platform Governance & IaC Models
from .governance_models import (  # noqa: E402
    IaCPlanRecord,
    InfrastructureDriftRecord,
    InfrastructurePolicyCheck,
)

__all__ = [
    "InfrastructureServer",
    "DeploymentApplication",
    "DeploymentRecord",
    "RecoveryTargetConfig",
    "BackupRecord",
    "DisasterRecoveryDrill",
    "RollbackRecord",
    "IaCPlanRecord",
    "InfrastructureDriftRecord",
    "InfrastructurePolicyCheck",
]

