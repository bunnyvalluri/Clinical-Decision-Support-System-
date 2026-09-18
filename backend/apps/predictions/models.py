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

    # Uncertainty, Abstention & Out-of-Distribution Quality Gates
    uncertainty_score = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Normalized predictive uncertainty / entropy (0.0000 - 1.0000).",
    )
    is_abstaining = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True if model abstained due to high uncertainty or OOD, requiring review.",
    )
    ood_status = models.CharField(
        max_length=50,
        default="IN_DISTRIBUTION",
        db_index=True,
        help_text="Out-of-distribution detection status (IN_DISTRIBUTION, WARNING, OUT_OF_DISTRIBUTION).",
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


class ReviewStatus(models.TextChoices):
    PENDING_REVIEW = "PENDING_REVIEW", "Pending Review"
    REVIEWED = "REVIEWED", "Reviewed / Concurred"
    REQUIRES_MORE_INFORMATION = "REQUIRES_MORE_INFORMATION", "Requires More Information"
    ESCALATED = "ESCALATED", "Escalated"


class ReviewDecision(models.TextChoices):
    CONCUR = "CONCUR", "Concur with AI Risk Assessment"
    OVERRIDE = "OVERRIDE", "Override AI Prediction"
    MONITOR = "MONITOR", "Serial Observation Required"
    TRANSFER = "TRANSFER", "ICU / Specialist Transfer"


class ClinicalReview(BaseModel):
    """
    Human-in-the-loop clinical review record for machine learning predictions.
    Audited with doctor, timestamp, prediction, review status, and action.
    """

    prediction = models.OneToOneField(
        Prediction,
        on_delete=models.CASCADE,
        related_name="clinical_review",
        help_text="Prediction reviewed by physician.",
    )
    doctor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clinical_reviews",
        help_text="Physician performing the clinical review.",
    )
    status = models.CharField(
        max_length=35,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING_REVIEW,
        db_index=True,
    )
    decision = models.CharField(
        max_length=30,
        choices=ReviewDecision.choices,
        default=ReviewDecision.CONCUR,
    )
    rationale = models.TextField(
        blank=True,
        help_text="Mandatory clinical rationale explaining physician decision or override.",
    )
    override_risk_level = models.CharField(
        max_length=20,
        choices=RiskLevel.choices,
        null=True,
        blank=True,
        help_text="Target clinical risk tier if physician overrides.",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "clinical_reviews"
        verbose_name = "Clinical Review"
        verbose_name_plural = "Clinical Reviews"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Review for {self.prediction.id} by {self.doctor} [{self.status}]"


class RiskThresholdPolicy(BaseModel):
    """
    Configurable risk threshold policy for clinical severity tiers.
    Replaces hardcoded thresholds with versioned, auditable, and clinician-approved rules.
    """

    policy_version = models.CharField(max_length=50, unique=True, db_index=True)
    model_version = models.ForeignKey(
        "model_registry.ModelVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="threshold_policies",
        help_text="Model version to which this policy applies (null for global baseline).",
    )
    low_threshold = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=0.2500,
        help_text="Upper probability threshold for LOW risk tier (0.0000 - 1.0000).",
    )
    medium_threshold = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=0.5000,
        help_text="Upper probability threshold for MEDIUM risk tier (0.0000 - 1.0000).",
    )
    high_threshold = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=0.7500,
        help_text="Upper probability threshold for HIGH risk tier (0.0000 - 1.0000).",
    )
    effective_date = models.DateTimeField(default=timezone.now, db_index=True)
    approval_status = models.CharField(max_length=30, default="APPROVED", db_index=True)
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="authored_policies",
        help_text="Medical informaticist or clinical lead who authored the policy.",
    )
    clinical_rationale = models.TextField(
        blank=True,
        help_text="Clinical justification and validation evidence for threshold configuration.",
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "risk_threshold_policies"
        verbose_name = "Risk Threshold Policy"
        verbose_name_plural = "Risk Threshold Policies"
        ordering = ["-effective_date"]

    def __str__(self) -> str:
        return f"Policy {self.policy_version} [Low<{self.low_threshold}, Med<{self.medium_threshold}, High<{self.high_threshold}]"

    def classify_probability(self, probability: float) -> str:
        """Categorize continuous probability into discrete risk level based on configured policy thresholds."""
        p = float(probability)
        if p < float(self.low_threshold):
            return RiskLevel.LOW
        if p < float(self.medium_threshold):
            return RiskLevel.MEDIUM
        if p < float(self.high_threshold):
            return RiskLevel.HIGH
        return RiskLevel.CRITICAL


