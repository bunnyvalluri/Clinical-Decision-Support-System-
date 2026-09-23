"""
PostgreSQL models for Controlled Typed-Decision AI Engines.
Authoritative source of truth: Neon PostgreSQL.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class SchemaStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft Schema"
    VALIDATION = "VALIDATION", "Pending Permutation & Safety Validation"
    APPROVED = "APPROVED", "Approved by Clinical Informaticist"
    ACTIVE = "ACTIVE", "Active in Clinical Workflows"
    SUSPENDED = "SUSPENDED", "Temporarily Suspended"
    RETIRED = "RETIRED", "Retired Schema"


class DecisionTypeChoices(models.TextChoices):
    CHOICE = "CHOICE", "Categorical Choice"
    SCORE = "SCORE", "Numerical Urgency Score"
    BOOLEAN = "BOOLEAN", "Boolean / Noul Flag"


class UncertaintyStatusChoices(models.TextChoices):
    SUPPORTED = "SUPPORTED", "Supported by strong confidence"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED", "Moderate confidence"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA", "Context lacks critical clinical attributes"
    CONFLICTING_DATA = "CONFLICTING_DATA", "Context presents contradictory signals"
    LOW_CONFIDENCE = "LOW_CONFIDENCE", "Below minimum confidence threshold"
    REQUIRES_CLINICIAN_REVIEW = "REQUIRES_CLINICIAN_REVIEW", "High clinical impact requires review"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE", "Provider offline or unsupported"


class TypedDecisionProvider(models.Model):
    """
    Registry of configured typed decision providers.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=64, unique=True, default="laya-mlx")
    display_name = models.CharField(max_length=128, default="Laya-MLX Native Runtime")
    is_enabled = models.BooleanField(default=True)
    runtime_mode = models.CharField(max_length=32, default="auto")
    service_url = models.CharField(max_length=255, blank=True, default="")
    platform_supported = models.BooleanField(default=False)
    health_status = models.CharField(max_length=32, default="SUPPORTED")
    capabilities_metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "typed_decision_providers"
        verbose_name = "Typed Decision Provider"
        verbose_name_plural = "Typed Decision Providers"

    def __str__(self) -> str:
        return f"{self.display_name} ({self.health_status})"


class TypedDecisionModel(models.Model):
    """
    Controlled local model registry entry for Laya-MLX and auxiliary typed models.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(TypedDecisionProvider, on_delete=models.CASCADE, related_name="models")
    model_identifier = models.CharField(max_length=128, default="convaiinnovations/laya")
    model_revision = models.CharField(max_length=64, default="573e5b62696ba441230cd6be71d593331b5d23af")
    model_checksum = models.CharField(max_length=128, default="sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    architecture = models.CharField(max_length=64, default="ModernBERT-DecisionModel")
    parameter_count = models.CharField(max_length=32, default="149M")
    context_limit = models.IntegerField(default=512)
    dtype = models.CharField(max_length=32, default="float16")
    license = models.CharField(max_length=64, default="Apache-2.0")
    provenance = models.CharField(max_length=255, default="https://github.com/mizorewww/laya-mlx")
    validation_status = models.CharField(max_length=32, default="VERIFIED")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "typed_decision_models"
        verbose_name = "Typed Decision Model"
        verbose_name_plural = "Typed Decision Models"

    def __str__(self) -> str:
        return f"{self.model_identifier} (rev: {self.model_revision[:7]})"


class TypedDecisionSchema(models.Model):
    """
    Versioned clinical decision schemas governed by clinical informaticists.
    Only APPROVED or ACTIVE schemas may be used in production workflows.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128, db_index=True)
    version = models.CharField(max_length=32, default="1.0.0")
    decision_type = models.CharField(max_length=32, choices=DecisionTypeChoices.choices, default=DecisionTypeChoices.CHOICE)
    instructions = models.TextField(help_text="Task guidance for the decision engine")
    allowed_options = models.JSONField(default=list, help_text="List of string choices or score criteria")
    validation_rules = models.JSONField(default=dict, blank=True, help_text="Safety and range validation constraints")
    clinical_context = models.CharField(max_length=128, default="TRIAGE_WORKFLOW", help_text="Clinical operational domain")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="owned_decision_schemas")
    status = models.CharField(max_length=32, choices=SchemaStatus.choices, default=SchemaStatus.DRAFT, db_index=True)
    robustness_status = models.CharField(max_length=32, default="NOT_EVALUATED")
    robustness_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    retired_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "typed_decision_schemas"
        unique_together = ("name", "version")
        verbose_name = "Typed Decision Schema"
        verbose_name_plural = "Typed Decision Schemas"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} v{self.version} [{self.status}]"


class TypedDecisionRequest(models.Model):
    """
    Audit record for every typed-decision invocation.
    Never stores unnecessary direct PHI.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schema = models.ForeignKey(TypedDecisionSchema, on_delete=models.SET_NULL, null=True, related_name="requests")
    provider = models.ForeignKey(TypedDecisionProvider, on_delete=models.SET_NULL, null=True, related_name="requests")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="typed_decision_requests")
    user_role = models.CharField(max_length=64, default="DOCTOR")
    correlation_id = models.CharField(max_length=64, db_index=True)
    context_hash = models.CharField(max_length=64, help_text="SHA-256 of minimized context")
    had_phi_redaction = models.BooleanField(default=False)
    decision_type = models.CharField(max_length=32, default=DecisionTypeChoices.CHOICE)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "typed_decision_requests"
        verbose_name = "Typed Decision Request"
        verbose_name_plural = "Typed Decision Requests"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Request {self.id} ({self.decision_type}) by {self.user_role}"


class TypedDecisionResult(models.Model):
    """
    Immutable outcome of a typed decision inference.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.OneToOneField(TypedDecisionRequest, on_delete=models.CASCADE, related_name="result")
    result_value = models.CharField(max_length=255)
    confidence = models.FloatField(default=0.0)
    probabilities = models.JSONField(default=dict, blank=True)
    uncertainty_status = models.CharField(
        max_length=32, choices=UncertaintyStatusChoices.choices, default=UncertaintyStatusChoices.SUPPORTED
    )
    requires_human_review = models.BooleanField(default=False, db_index=True)
    clinician_review_status = models.CharField(max_length=32, default="PENDING")
    clinician_action = models.CharField(max_length=64, blank=True, default="")
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_typed_decisions")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    latency_ms = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "typed_decision_results"
        verbose_name = "Typed Decision Result"
        verbose_name_plural = "Typed Decision Results"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Result {self.id} -> {self.result_value} ({self.confidence:.2f})"


class TypedDecisionEvaluation(models.Model):
    """
    Evaluation metrics for typed decision models and schemas (accuracy, calibration, robustness).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schema = models.ForeignKey(TypedDecisionSchema, on_delete=models.CASCADE, related_name="evaluations")
    model = models.ForeignKey(TypedDecisionModel, on_delete=models.SET_NULL, null=True, related_name="evaluations")
    sample_size = models.IntegerField(default=0)
    robustness_score = models.FloatField(null=True, blank=True)
    calibration_error = models.FloatField(null=True, blank=True)
    average_latency_ms = models.FloatField(default=0.0)
    override_rate = models.FloatField(default=0.0)
    passed_robustness = models.BooleanField(default=True)
    evaluation_details = models.JSONField(default=dict, blank=True)
    evaluated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "typed_decision_evaluations"
        verbose_name = "Typed Decision Evaluation"
        verbose_name_plural = "Typed Decision Evaluations"
        ordering = ["-evaluated_at"]

    def __str__(self) -> str:
        return f"Eval {self.schema.name} (robustness: {self.robustness_score})"


class TypedDecisionAuditEvent(models.Model):
    """
    Tamper-evident audit event for administrative, configuration, and inference actions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=64, db_index=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    actor_role = models.CharField(max_length=64, default="SYSTEM")
    target_identifier = models.CharField(max_length=128, blank=True, default="")
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "typed_decision_audit_events"
        verbose_name = "Typed Decision Audit Event"
        verbose_name_plural = "Typed Decision Audit Events"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {self.action} by {self.actor_role}"
