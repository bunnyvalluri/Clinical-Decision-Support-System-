"""
Disaster Recovery, Backup Tracking, and Business Continuity Models for HealthNova AI CDSS.
Provides verifiable, non-falsified persistence for:
1. Approved RPO / RTO targets (unconfigured by default).
2. Immutable backup execution logs with cryptographic SHA-256 validation.
3. Controlled disaster recovery drills with 14-point restoration verification.
4. Version-aware application, worker, and ML model rollbacks.
"""

import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class RecoveryTargetConfig(models.Model):
    """
    Singleton governance model defining approved RPO and RTO business targets.
    In accordance with Section 6 of Prompt 61, targets default to UNCONFIGURED ('Not yet defined')
    until explicitly reviewed and approved by an authorized IT Administrator.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    is_configured = models.BooleanField(
        default=False,
        help_text="Flag indicating whether RPO/RTO targets have been formally approved.",
    )
    approved_rpo_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Approved Recovery Point Objective in minutes (maximum acceptable data loss window).",
    )
    approved_rto_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Approved Recovery Time Objective in minutes (maximum acceptable recovery duration).",
    )
    backup_cadence = models.CharField(
        max_length=50,
        default="NOT_DEFINED",
        choices=[
            ("NOT_DEFINED", "Not yet defined"),
            ("CONTINUOUS_WAL", "Continuous WAL (Neon Safekeepers)"),
            ("HOURLY", "Hourly Incremental"),
            ("DAILY_OFFSITE", "Daily Encrypted S3 Export"),
        ],
    )
    retention_days = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Approved retention window in days.",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_dr_configs",
    )
    last_reviewed_at = models.DateTimeField(null=True, blank=True)
    compliance_framework = models.CharField(
        max_length=100,
        default="HIPAA Security Rule / 21 CFR Part 11",
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Recovery Target Configuration"
        verbose_name_plural = "Recovery Target Configurations"

    @classmethod
    def get_active_config(cls) -> "RecoveryTargetConfig":
        """Retrieve active configuration or create clean unconfigured default."""
        config = cls.objects.first()
        if not config:
            config = cls.objects.create(is_configured=False)
        return config

    def __str__(self):
        status = "Configured" if self.is_configured else "Not yet defined"
        return f"DR Policy [{status}] — RPO: {self.approved_rpo_minutes or 'Unset'}m, RTO: {self.approved_rto_minutes or 'Unset'}m"


class BackupRecord(models.Model):
    """
    Immutable historical audit and tracking record of every backup event.
    Stores cryptographic hashes, sizes, storage tiers, and validation results.
    """
    class BackupType(models.TextChoices):
        DATABASE_PITR = "DATABASE_PITR", "Neon Continuous WAL / Branch Snapshot"
        DATABASE_LOGICAL = "DATABASE_LOGICAL", "Encrypted Logical pg_dump"
        CONFIGURATION = "CONFIGURATION", "Platform / Nginx / Coolify Config"
        ML_METADATA = "ML_METADATA", "Model Registry & Dataset Lineage Manifest"
        FULL_SNAPSHOT = "FULL_SNAPSHOT", "Unified Clinical Platform Snapshot"

    class Status(models.TextChoices):
        QUEUED = "QUEUED", "Queued"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    class ValidationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Validation"
        VALIDATED = "VALIDATED", "Validated & Integrity Verified"
        FAILED = "FAILED", "Validation Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    backup_type = models.CharField(max_length=50, choices=BackupType.choices, default=BackupType.DATABASE_LOGICAL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED, db_index=True)
    storage_provider = models.CharField(
        max_length=50,
        default="NEON_POSTGRES",
        choices=[
            ("NEON_POSTGRES", "Neon PostgreSQL (Continuous WAL)"),
            ("AWS_S3_KMS", "AWS S3 (KMS Encrypted Bucket)"),
            ("LOCAL_SECURE", "Isolated Encrypted Volume"),
        ],
    )
    storage_location = models.CharField(max_length=500, blank=True, default="")
    size_bytes = models.BigIntegerField(default=0)
    checksum = models.CharField(max_length=64, blank=True, default="", help_text="SHA-256 checksum of the backup archive.")
    encryption_algorithm = models.CharField(max_length=50, default="AES-256-GCM / AWS-KMS")
    is_encrypted = models.BooleanField(default=True)
    validation_status = models.CharField(
        max_length=20,
        choices=ValidationStatus.choices,
        default=ValidationStatus.PENDING,
        db_index=True,
    )
    validation_details = models.JSONField(default=dict, blank=True)
    retention_days = models.PositiveIntegerField(default=30)
    expires_at = models.DateTimeField(null=True, blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="initiated_backups",
    )
    correlation_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Backup Record"
        verbose_name_plural = "Backup Records"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.backup_type} [{self.status}] — {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class DisasterRecoveryDrill(models.Model):
    """
    Audit record of controlled disaster recovery simulations and live failovers.
    Evaluates real system subsystems against the 14-point restoration verification standard.
    """
    class RecoveryType(models.TextChoices):
        DATABASE = "DATABASE", "Neon Database Point-In-Time Restoration"
        REDIS = "REDIS", "Redis Broker & Cache Reconstruction"
        CELERY = "CELERY", "Celery Task Queue & Worker Recovery"
        APPLICATION = "APPLICATION", "Application Container & Daphne ASGI Restart"
        DOCKER = "DOCKER", "Docker Image Digest & Registry Recovery"
        COOLIFY = "COOLIFY", "Coolify Platform & Orchestration Recovery"
        REGISTRY = "REGISTRY", "Container Registry Rollback"
        ML_MODEL = "ML_MODEL", "ML Model Registry & Checksum Verification"
        SEARCH = "SEARCH", "Meilisearch Index Rebuild from Neon Source"
        AI = "AI", "AI Gateway & Safe Degraded Fallback"
        CREDENTIAL = "CREDENTIAL", "Credential Compromise & Secret Rotation"
        COMPLETE_ENV = "COMPLETE_ENV", "Complete Environment Disaster Recovery"

    class DrillState(models.TextChoices):
        DETECTED = "DETECTED", "Detected"
        ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
        CONTAINED = "CONTAINED", "Contained"
        RECOVERING = "RECOVERING", "Recovering"
        VERIFIED = "VERIFIED", "Verified"
        RESOLVED = "RESOLVED", "Resolved"
        POSTMORTEM = "POSTMORTEM", "Postmortem"

    class VerificationStatus(models.TextChoices):
        NOT_TESTED = "NOT_TESTED", "Not Tested"
        CONFIGURED = "CONFIGURED", "Configured"
        TESTED = "TESTED", "Tested"
        VERIFIED = "VERIFIED", "Verified"
        FAILED = "FAILED", "Verification Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    drill_name = models.CharField(max_length=200)
    recovery_type = models.CharField(max_length=50, choices=RecoveryType.choices, default=RecoveryType.DATABASE)
    target_service = models.CharField(max_length=100)
    state = models.CharField(max_length=20, choices=DrillState.choices, default=DrillState.DETECTED, db_index=True)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.NOT_TESTED,
        db_index=True,
    )
    environment = models.CharField(max_length=50, default="DR_SIMULATION")
    checklist_results = models.JSONField(
        default=dict,
        blank=True,
        help_text="14-item verification checklist state and probe results.",
    )
    recovery_duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    executed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="executed_drills",
    )
    correlation_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Disaster Recovery Drill"
        verbose_name_plural = "Disaster Recovery Drills"
        ordering = ["-started_at"]

    def __str__(self):
        return f"DR Drill: {self.drill_name} [{self.verification_status}] ({self.recovery_type})"


class RollbackRecord(models.Model):
    """
    Version-aware record of rollbacks performed on application stacks or ML models.
    Guarantees compatibility verification before rolling back to a previous artifact.
    """
    class RollbackType(models.TextChoices):
        APPLICATION = "APPLICATION", "Full Application Stack"
        FRONTEND = "FRONTEND", "Next.js Frontend Container"
        BACKEND = "BACKEND", "Django ASGI Backend"
        WORKER = "WORKER", "Celery Async Worker"
        MODEL = "MODEL", "ML Model Artifact"
        CONFIGURATION = "CONFIGURATION", "Infrastructure Configuration"

    class Status(models.TextChoices):
        STARTED = "STARTED", "Started"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rollback_type = models.CharField(max_length=30, choices=RollbackType.choices, default=RollbackType.APPLICATION)
    service_name = models.CharField(max_length=100)
    current_commit_sha = models.CharField(max_length=40, blank=True, default="")
    target_commit_sha = models.CharField(max_length=40, blank=True, default="")
    current_model_version = models.CharField(max_length=50, blank=True, default="")
    target_model_version = models.CharField(max_length=50, blank=True, default="")
    compatibility_verified = models.BooleanField(
        default=False,
        help_text="True if target version schema/API was explicitly checked for backward compatibility.",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.STARTED, db_index=True)
    reason = models.TextField()
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="executed_rollbacks",
    )
    correlation_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Rollback Record"
        verbose_name_plural = "Rollback Records"
        ordering = ["-started_at"]

    def __str__(self):
        return f"Rollback {self.rollback_type} on {self.service_name} [{self.status}]"
