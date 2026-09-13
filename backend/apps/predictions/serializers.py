"""
Serializers for Patient Risk Predictions, Batch Inference, and Clinician Overrides.
"""
from rest_framework import serializers

from apps.predictions.models import Prediction, PredictionExplanation, RiskLevel


class PredictionExplanationSerializer(serializers.ModelSerializer):
    """Serializer for explainability feature importances and clinical risk drivers."""

    class Meta:
        model = PredictionExplanation
        fields = [
            "id",
            "method",
            "feature_importances",
            "top_risk_factors",
            "baseline_value",
            "generated_at",
        ]
        read_only_fields = fields


class PredictionSerializer(serializers.ModelSerializer):
    """Full detail prediction response serializer including explanation and model info."""

    explanation = PredictionExplanationSerializer(read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    overridden_by_name = serializers.CharField(source="overridden_by.get_full_name", read_only=True)

    # Explicit domain aliases
    prediction_id = serializers.UUIDField(source="id", read_only=True)
    patient_id = serializers.UUIDField(read_only=True)
    risk_level = serializers.CharField(source="prediction_result", read_only=True)
    model_version = serializers.CharField(source="model_version_str", read_only=True)
    inference_latency = serializers.DecimalField(source="inference_latency_ms", max_digits=8, decimal_places=2, read_only=True)
    timestamp = serializers.DateTimeField(source="prediction_timestamp", read_only=True)

    class Meta:
        model = Prediction
        fields = [
            "id",
            "prediction_id",
            "patient",
            "patient_id",
            "patient_mrn",
            "clinical_record",
            "model_version",
            "model_name",
            "model_version_str",
            "prediction_result",
            "risk_level",
            "probability",
            "confidence_score",
            "inference_latency",
            "inference_latency_ms",
            "feature_schema_version",
            "features_snapshot",
            "timestamp",
            "prediction_timestamp",
            "clinician_override",
            "override_reason",
            "overridden_by",
            "overridden_by_name",
            "explanation",
            "created_at",
        ]
        read_only_fields = fields


class PredictionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for paginated list queries."""

    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    prediction_id = serializers.UUIDField(source="id", read_only=True)
    patient_id = serializers.UUIDField(read_only=True)
    risk_level = serializers.CharField(source="prediction_result", read_only=True)

    class Meta:
        model = Prediction
        fields = [
            "id",
            "prediction_id",
            "patient",
            "patient_id",
            "patient_mrn",
            "model_name",
            "model_version_str",
            "prediction_result",
            "risk_level",
            "probability",
            "confidence_score",
            "inference_latency_ms",
            "prediction_timestamp",
            "clinician_override",
            "created_at",
        ]
        read_only_fields = fields


class PredictionRequestSerializer(serializers.Serializer):
    """Input payload for single-patient real-time prediction."""

    patient_id = serializers.UUIDField(required=True, help_text="UUID of target patient.")
    clinical_record_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Optional specific clinical record encounter ID.",
    )
    model_name = serializers.CharField(
        required=False,
        default=None,
        allow_null=True,
        help_text="Optional model name override; defaults to active model.",
    )
    vitals = serializers.DictField(
        required=False,
        default=None,
        allow_null=True,
        help_text="Optional direct vitals observation dictionary.",
    )


class BatchPredictionRequestSerializer(serializers.Serializer):
    """Input payload for high-throughput batch prediction."""

    records = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        max_length=500,
        help_text="Array of objects with patient_id, optional clinical_record_id, and optional vitals.",
    )
    model_name = serializers.CharField(
        required=False,
        default=None,
        allow_null=True,
        help_text="Optional model name override.",
    )


class ClinicalOverrideSerializer(serializers.Serializer):
    """Input payload for recording a physician override."""

    clinician_override = serializers.ChoiceField(
        choices=RiskLevel.choices,
        help_text="New clinician assigned risk level.",
    )
    override_reason = serializers.CharField(
        min_length=5,
        max_length=2000,
        help_text="Clinical justification for override.",
    )
