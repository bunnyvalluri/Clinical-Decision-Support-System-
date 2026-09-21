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


class FeatureContributionSerializer(serializers.Serializer):
    """Individual feature contribution in a model explanation."""
    feature = serializers.CharField(read_only=True)
    value = serializers.FloatField(allow_null=True, read_only=True)
    contribution = serializers.FloatField(read_only=True)
    direction = serializers.CharField(read_only=True)
    relative_importance = serializers.FloatField(read_only=True)


class PredictionExplanationDetailSerializer(serializers.Serializer):
    """
    Full explanation response for GET /api/v1/predictions/{id}/explanation/.

    IMPORTANT: This represents a MODEL EXPLANATION, not a medical diagnosis.
    """
    prediction_id = serializers.UUIDField(read_only=True)
    risk_level = serializers.CharField(read_only=True)
    probability = serializers.FloatField(read_only=True)
    explanation_type = serializers.CharField(read_only=True, default="MODEL_EXPLANATION")
    method = serializers.CharField(read_only=True)
    baseline_value = serializers.FloatField(allow_null=True, read_only=True)
    features = FeatureContributionSerializer(many=True, read_only=True)
    disclaimer = serializers.CharField(read_only=True)


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
    cdss_guidance = serializers.SerializerMethodField(read_only=True)

    def get_cdss_guidance(self, obj):
        if hasattr(obj, "cdss_guidance") and obj.cdss_guidance:
            if hasattr(obj.cdss_guidance, "to_dict"):
                return obj.cdss_guidance.to_dict()
            return obj.cdss_guidance
        try:
            from services.clinical_decision_support_service import ClinicalDecisionSupportService
            cdss = ClinicalDecisionSupportService()
            guidance = cdss.generate_support_guidance(
                patient_id=str(obj.patient_id),
                features=obj.features_snapshot or {},
                prediction=obj,
            )
            return guidance.to_dict()
        except Exception:
            return None

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
            "uncertainty_score",
            "is_abstaining",
            "ood_status",
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
            "cdss_guidance",
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


class PredictionFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for clinician feedback on prediction utility and clinical alignment."""

    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        from apps.predictions.models import PredictionFeedback
        model = PredictionFeedback
        fields = [
            "id",
            "prediction",
            "patient",
            "user",
            "user_name",
            "user_email",
            "user_role",
            "feedback_category",
            "comments",
            "is_reviewed_by_informaticist",
            "reviewed_by",
            "reviewed_at",
            "created_at",
        ]
        read_only_fields = ["id", "prediction", "patient", "user", "user_name", "user_email", "user_role", "created_at"]


class PredictionOutcomeLinkSerializer(serializers.ModelSerializer):
    """Serializer for linking predictions to subsequent documented patient outcomes."""

    documented_by_name = serializers.CharField(source="documented_by.get_full_name", read_only=True)

    class Meta:
        from apps.predictions.models import PredictionOutcomeLink
        model = PredictionOutcomeLink
        fields = [
            "id",
            "prediction",
            "patient",
            "clinical_record",
            "outcome_type",
            "description",
            "documented_at",
            "documented_by",
            "documented_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "documented_by", "documented_by_name", "created_at"]


class FeatureDifferenceSerializer(serializers.Serializer):
    """Serializes comparative feature differences between current and previous predictions."""

    feature = serializers.CharField()
    display_name = serializers.CharField()
    unit = serializers.CharField(allow_blank=True)
    previous_value = serializers.CharField(allow_null=True)
    current_value = serializers.CharField(allow_null=True)
    delta = serializers.FloatField(allow_null=True)
    percentage_change = serializers.FloatField(allow_null=True)
    direction = serializers.CharField()
    is_numeric = serializers.BooleanField()
    is_significant = serializers.BooleanField()


class PredictionComparisonSerializer(serializers.Serializer):
    """Full detail comparison between current and previous prediction."""

    is_initial_prediction = serializers.BooleanField()
    patient_id = serializers.CharField()
    patient_mrn = serializers.CharField()
    risk_changed = serializers.BooleanField()
    transition_direction = serializers.CharField()
    risk_transition = serializers.CharField()
    time_between_predictions_seconds = serializers.IntegerField()
    time_between_formatted = serializers.CharField()
    current_prediction = serializers.DictField()
    previous_prediction = serializers.DictField(allow_null=True)
    model_version_changed = serializers.BooleanField()
    feature_changes = FeatureDifferenceSerializer(many=True)
    feature_changes_count = serializers.IntegerField()
    shap_divergence = serializers.DictField()
    alerts_generated = serializers.ListField(child=serializers.DictField())
    evaluation_timestamp = serializers.DateTimeField()

