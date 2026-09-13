"""
Serializers for model_registry app.
Handles serialization of model versions, metrics, and lifecycle actions.
"""
from rest_framework import serializers

from apps.model_registry.models import ModelStatus, ModelVersion


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
    """Payload serializer for model promotion to ACTIVE status."""

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
