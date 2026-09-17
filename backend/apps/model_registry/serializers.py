"""
Serializers for model_registry app.
Handles serialization of model versions, metrics, approvals, deployments, and lifecycle actions.
"""
from rest_framework import serializers

from apps.model_registry.models import (
    DataQualityReport,
    DatasetVersion,
    ModelApproval,
    ModelDeployment,
    ModelEvaluation,
    ModelRollback,
    ModelStatus,
    ModelVersion,
)


class ModelVersionSerializer(serializers.ModelSerializer):
    """Full representation of a registered ML model version."""

    is_active = serializers.BooleanField(read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True, default=None)
    activated_by_email = serializers.EmailField(source="activated_by.email", read_only=True, default=None)

    class Meta:
        model = ModelVersion
        fields = [
            "id",
            "model_name",
            "algorithm",
            "version",
            "status",
            "is_active",
            "accuracy",
            "precision",
            "recall",
            "f1_score",
            "roc_auc",
            "checksum",
            "training_dataset_identifier",
            "feature_schema_version",
            "preprocessing_version",
            "artifact_location",
            "metrics",
            "hyperparameters",
            "training_dataset_info",
            "created_by",
            "created_by_email",
            "activated_by",
            "activated_by_email",
            "created_at",
            "activated_at",
            "retired_at",
        ]
        read_only_fields = fields


class ModelActivationSerializer(serializers.Serializer):
    """Payload serializer for model promotion to ACTIVE/PRODUCTION status."""

    reason = serializers.CharField(
        required=False,
        default="Manual promotion to production",
        max_length=500,
        help_text="Clinical justification for promoting this model version.",
    )


class ModelRollbackSerializer(serializers.Serializer):
    """Payload serializer for rolling back production model to an earlier version."""

    target_version = serializers.CharField(
        required=True,
        max_length=50,
        help_text="The target version string to roll back to.",
    )
    reason = serializers.CharField(
        required=False,
        default="Production rollback",
        max_length=500,
        help_text="Clinical justification for rolling back the active model.",
    )


class ModelApprovalSerializer(serializers.ModelSerializer):
    """Serializer for human clinician sign-off records."""

    approved_by_email = serializers.EmailField(source="approved_by.email", read_only=True)

    class Meta:
        model = ModelApproval
        fields = ["id", "model_version", "approved_by", "approved_by_email", "role", "status", "clinical_rationale", "created_at"]
        read_only_fields = ["id", "created_at", "approved_by_email"]


class ModelDeploymentSerializer(serializers.ModelSerializer):
    """Serializer for staged, canary, or production model deployments."""

    deployed_by_email = serializers.EmailField(source="deployed_by.email", read_only=True)

    class Meta:
        model = ModelDeployment
        fields = ["id", "model_version", "stage", "traffic_percentage", "deployed_by", "deployed_by_email", "status", "created_at"]
        read_only_fields = ["id", "created_at", "deployed_by_email"]


class DatasetVersionSerializer(serializers.ModelSerializer):
    """Serializer for versioned clinical datasets."""

    class Meta:
        model = DatasetVersion
        fields = "__all__"


class DataQualityReportSerializer(serializers.ModelSerializer):
    """Serializer for data quality inspection reports."""

    class Meta:
        model = DataQualityReport
        fields = "__all__"
