"""
DRF Serializers for Infrastructure & Deployment Management.
Exposes deployment records and server health strictly to authorized IT Administrators.
"""

from rest_framework import serializers
from .models import (
    InfrastructureServer,
    DeploymentApplication,
    DeploymentRecord,
    IaCPlanRecord,
    InfrastructureDriftRecord,
    InfrastructurePolicyCheck,
)


class InfrastructureServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfrastructureServer
        fields = [
            "id",
            "coolify_server_id",
            "name",
            "environment",
            "status",
            "region",
            "provider",
            "last_health_check",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DeploymentApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeploymentApplication
        fields = [
            "id",
            "coolify_resource_id",
            "name",
            "environment",
            "repository",
            "branch",
            "deployment_status",
            "last_deployment_id",
            "last_deployed_commit",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DeploymentRecordSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    application_name = serializers.CharField(source="application.name", read_only=True)

    class Meta:
        model = DeploymentRecord
        fields = [
            "id",
            "coolify_deployment_id",
            "application",
            "application_name",
            "commit_sha",
            "status",
            "started_at",
            "finished_at",
            "trigger",
            "actor",
            "actor_username",
            "environment",
            "correlation_id",
        ]
        read_only_fields = ["id", "started_at", "correlation_id"]


class TriggerDeploymentRequestSerializer(serializers.Serializer):
    application_id = serializers.CharField(required=True)
    commit_sha = serializers.CharField(required=False, allow_blank=True)
    reason = serializers.CharField(required=False, default="Operational update")


# --- Disaster Recovery & Backup Serializers (Prompt 61) ---

from .models import (  # noqa: E402
    RecoveryTargetConfig,
    BackupRecord,
    DisasterRecoveryDrill,
    RollbackRecord,
)


class RecoveryTargetConfigSerializer(serializers.ModelSerializer):
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True)
    rpo_display = serializers.SerializerMethodField()
    rto_display = serializers.SerializerMethodField()

    class Meta:
        model = RecoveryTargetConfig
        fields = [
            "id",
            "is_configured",
            "approved_rpo_minutes",
            "approved_rto_minutes",
            "rpo_display",
            "rto_display",
            "backup_cadence",
            "retention_days",
            "approved_by",
            "approved_by_username",
            "last_reviewed_at",
            "compliance_framework",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "rpo_display", "rto_display"]

    def get_rpo_display(self, obj):
        if not obj.is_configured or obj.approved_rpo_minutes is None:
            return "Not yet defined"
        return f"{obj.approved_rpo_minutes} minutes"

    def get_rto_display(self, obj):
        if not obj.is_configured or obj.approved_rto_minutes is None:
            return "Not yet defined"
        return f"{obj.approved_rto_minutes} minutes"


class UpdateRecoveryTargetConfigRequestSerializer(serializers.Serializer):
    approved_rpo_minutes = serializers.IntegerField(min_value=1, required=True)
    approved_rto_minutes = serializers.IntegerField(min_value=1, required=True)
    backup_cadence = serializers.ChoiceField(
        choices=["CONTINUOUS_WAL", "HOURLY", "DAILY_OFFSITE"],
        default="CONTINUOUS_WAL",
    )
    retention_days = serializers.IntegerField(min_value=1, default=30)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class BackupRecordSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = BackupRecord
        fields = [
            "id",
            "backup_type",
            "status",
            "storage_provider",
            "storage_location",
            "size_bytes",
            "checksum",
            "encryption_algorithm",
            "is_encrypted",
            "validation_status",
            "validation_details",
            "retention_days",
            "expires_at",
            "actor",
            "actor_username",
            "correlation_id",
            "created_at",
            "completed_at",
            "error_message",
        ]
        read_only_fields = ["id", "created_at", "correlation_id"]


class TriggerBackupRequestSerializer(serializers.Serializer):
    backup_type = serializers.ChoiceField(
        choices=[
            ("DATABASE_PITR", "Neon Continuous WAL / Branch Snapshot"),
            ("DATABASE_LOGICAL", "Encrypted Logical pg_dump"),
            ("CONFIGURATION", "Configuration Manifest"),
            ("ML_METADATA", "ML Model Registry Manifest"),
        ],
        default="DATABASE_LOGICAL",
    )
    storage_destination = serializers.ChoiceField(
        choices=["NEON_POSTGRES", "AWS_S3_KMS", "LOCAL_SECURE"],
        default="AWS_S3_KMS",
    )
    migration_name = serializers.CharField(required=False, allow_blank=True, default="")


class DisasterRecoveryDrillSerializer(serializers.ModelSerializer):
    executed_by_username = serializers.CharField(source="executed_by.username", read_only=True)

    class Meta:
        model = DisasterRecoveryDrill
        fields = [
            "id",
            "drill_name",
            "recovery_type",
            "target_service",
            "state",
            "verification_status",
            "environment",
            "checklist_results",
            "recovery_duration_seconds",
            "executed_by",
            "executed_by_username",
            "correlation_id",
            "started_at",
            "completed_at",
            "notes",
        ]
        read_only_fields = ["id", "started_at", "correlation_id"]


class RollbackRecordSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = RollbackRecord
        fields = [
            "id",
            "rollback_type",
            "service_name",
            "current_commit_sha",
            "target_commit_sha",
            "current_model_version",
            "target_model_version",
            "compatibility_verified",
            "status",
            "reason",
            "actor",
            "actor_username",
            "correlation_id",
            "started_at",
            "completed_at",
            "details",
        ]
        read_only_fields = ["id", "started_at", "correlation_id"]


class IaCPlanRecordSerializer(serializers.ModelSerializer):
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True)

    class Meta:
        model = IaCPlanRecord
        fields = [
            "id",
            "environment",
            "tool",
            "plan_output",
            "resources_to_add",
            "resources_to_change",
            "resources_to_destroy",
            "status",
            "requires_human_approval",
            "approved_by",
            "approved_by_username",
            "approved_at",
            "correlation_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "correlation_id", "created_at", "updated_at"]


class InfrastructureDriftRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfrastructureDriftRecord
        fields = [
            "id",
            "environment",
            "is_drifted",
            "status",
            "exit_code",
            "drift_summary",
            "remediation_plan",
            "detected_at",
        ]
        read_only_fields = ["id", "detected_at"]


class InfrastructurePolicyCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfrastructurePolicyCheck
        fields = [
            "id",
            "policy_name",
            "policy_type",
            "status",
            "description",
            "violations",
            "evaluated_at",
        ]
        read_only_fields = ["id", "evaluated_at"]

