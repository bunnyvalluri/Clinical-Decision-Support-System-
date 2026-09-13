"""
Predictions models — historical patient risk inferences and interpretable explanations.
"""
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel


class RiskLevel(models.TextChoices):
    LOW = "LOW", "Low Risk"
    MEDIUM = "MEDIUM", "Medium Risk"
    HIGH = "HIGH", "High Risk"
    CRITICAL = "CRITICAL", "Critical Risk"


class Prediction(BaseModel):
    """
    Historical patient risk level prediction record.

    Preserves immutable record of inference inputs, outputs, probability distributions,
    and associated model versions.
    """

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="predictions",
        help_text="Patient who was assessed.",
    )
    clinical_record = models.ForeignKey(
        "clinical.ClinicalRecord",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="predictions",
        help_text="Underlying clinical encounter vitals used for this inference.",
    )
    model_version = models.ForeignKey(
        "model_registry.ModelVersion",
        on_delete=models.PROTECT,
        related_name="predictions",
        help_text="Model version record used for this prediction.",
    )

    # Denormalised model identifiers for fast querying and historical durability
    model_name = models.CharField(max_length=100, db_index=True)
    model_version_str = models.CharField(max_length=50, db_index=True)

    prediction_result = models.CharField(
        max_length=20,
        choices=RiskLevel.choices,
        db_index=True,
        help_text="Discrete clinical risk category.",
    )
    probability = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        help_text="Predicted risk probability (0.0000 - 1.0000).",
    )
    confidence_score = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Model confidence metric where supported.",
    )
    inference_latency_ms = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Execution inference time in milliseconds.",
    )
    feature_schema_version = models.CharField(
        max_length=50,
        default="v1.0",
        help_text="Input feature schema definition version.",
    )
    features_snapshot = models.JSONField(
        help_text="Immutable snapshot of feature values passed into the model.",
    )
    prediction_timestamp = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="Timestamp when the inference was executed.",
    )

    # Clinician Overrides & Review
    clinician_override = models.CharField(
        max_length=20,
        choices=RiskLevel.choices,
        null=True,
        blank=True,
        help_text="Manual clinical override if physician disagrees with AI prediction.",
    )
    override_reason = models.TextField(
        blank=True,
        help_text="Clinical justification for overriding AI prediction.",
    )
    overridden_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prediction_overrides",
        help_text="Physician who recorded the clinical override.",
    )

    class Meta:
        db_table = "predictions"
        verbose_name = "Prediction"
        verbose_name_plural = "Predictions"
        ordering = ["-prediction_timestamp"]
        indexes = [
            models.Index(fields=["patient", "prediction_timestamp"]),
            models.Index(fields=["prediction_result", "prediction_timestamp"]),
            models.Index(fields=["model_name", "model_version_str"]),
            models.Index(fields=["prediction_timestamp"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=(models.Q(probability__gte=0.0) & models.Q(probability__lte=1.0)),
                name="check_prediction_probability_range",
            ),
            models.CheckConstraint(
                check=models.Q(inference_latency_ms__gte=0),
                name="check_inference_latency_positive",
            ),
        ]

    def __str__(self) -> str:
        return f"Prediction: {self.patient.mrn} -> {self.prediction_result} ({float(self.probability):.1%})"


class PredictionExplanation(BaseModel):
    """
    Explainability attributions for a single prediction.

    Captures SHAP/LIME feature importances and human-readable risk drivers.
    """

    prediction = models.OneToOneField(
        Prediction,
        on_delete=models.CASCADE,
        related_name="explanation",
        help_text="Prediction explained by this attribution set.",
    )
    method = models.CharField(
        max_length=50,
        default="TreeSHAP",
        help_text="Explainability algorithm (e.g. TreeSHAP, KernelSHAP, IntegratedGradients).",
    )
    feature_importances = models.JSONField(
        default=dict,
        help_text="Dictionary of feature weights/SHAP values {feature: value}.",
    )
    top_risk_factors = models.JSONField(
        default=list,
        help_text="Sorted list of key risk contributors with clinical descriptions.",
    )
    baseline_value = models.FloatField(
        null=True,
        blank=True,
        help_text="Expected base value / prior log-odds.",
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "prediction_explanations"
        verbose_name = "Prediction Explanation"
        verbose_name_plural = "Prediction Explanations"
        ordering = ["-generated_at"]

    def __str__(self) -> str:
        return f"Explanation ({self.method}) for Prediction {self.prediction_id}"
