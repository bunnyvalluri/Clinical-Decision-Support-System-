"""
Django Models for Clinical AI Orchestration, Guardrails,
Grounded Citations, and MLOps Drift Tracking.
"""
import uuid
from django.conf import settings
from django.db import models


class AIInteraction(models.Model):
    """
    Immutable audit record for every agentic orchestrator evaluation.
    Captures tool executions, safety guardrail verdicts, and clinician review sign-offs.
    """

    class SafetyStatus(models.TextChoices):
        PASSED = "PASSED", "Passed Safety Policies"
        FLAGGED = "FLAGGED", "Safety Alert Flagged"
        SUPPRESSED = "SUPPRESSED", "Output Suppressed by Guardrail"

    class HumanDecision(models.TextChoices):
        APPROVED = "APPROVED", "Clinician Approved Recommendation"
        MODIFIED = "MODIFIED", "Clinician Modified Plan"
        OVERRIDDEN = "OVERRIDDEN", "Clinician Overrode AI Recommendation"
        REJECTED = "REJECTED", "Clinician Rejected Recommendation"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="ai_interactions",
        null=True,
        blank=True,
    )
    clinician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="initiated_ai_interactions",
    )
    correlation_id = models.CharField(max_length=64, db_index=True)
    operation_type = models.CharField(max_length=64, default="FULL_ORCHESTRATION")
    input_query = models.TextField(blank=True, default="")
    tools_invoked = models.JSONField(default=list, help_text="List of tools called and their latencies")
    safety_status = models.CharField(
        max_length=20,
        choices=SafetyStatus.choices,
        default=SafetyStatus.PASSED,
    )
    guardrail_flags = models.JSONField(default=list)
    requires_human_review = models.BooleanField(default=False, db_index=True)
    
    # Human-in-the-loop sign-off
    human_reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_ai_interactions",
    )
    human_decision = models.CharField(
        max_length=20,
        choices=HumanDecision.choices,
        null=True,
        blank=True,
    )
    human_rationale = models.TextField(blank=True, default="")
    human_reviewed_at = models.DateTimeField(null=True, blank=True)

    latency_ms = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "ai_interactions"
        ordering = ["-created_at"]
        verbose_name = "AI Orchestration Interaction"
        verbose_name_plural = "AI Orchestration Interactions"

    def __str__(self) -> str:
        return f"AIInteraction {self.id} [{self.operation_type}] - {self.safety_status}"


class ClinicalRuleEvaluation(models.Model):
    """
    Stores deterministic protocol evaluations (qSOFA, NEWS2, critical thresholds)
    associated with patient clinical encounters.
    """

    class Severity(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        MONITOR = "MONITOR", "Routine Monitoring"
        URGENT = "URGENT_EVALUATION", "Urgent Clinical Evaluation"
        CRITICAL = "CRITICAL_EMERGENCY", "Critical Emergency"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="rule_evaluations",
    )
    prediction = models.ForeignKey(
        "predictions.Prediction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deterministic_rules",
    )
    rule_name = models.CharField(max_length=128)
    severity = models.CharField(max_length=32, choices=Severity.choices, default=Severity.NORMAL)
    trigger_criteria = models.TextField()
    recommended_action = models.TextField()
    evaluated_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "clinical_rule_evaluations"
        ordering = ["-evaluated_at"]

    def __str__(self) -> str:
        return f"{self.rule_name} [{self.severity}] for Patient {self.patient_id}"


class KnowledgeDocument(models.Model):
    """
    Approved clinical reference text used for citation grounding in RAG workflows.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guideline_id = models.CharField(max_length=64, unique=True, db_index=True)
    title = models.CharField(max_length=512)
    organization = models.CharField(max_length=256)
    section = models.CharField(max_length=256)
    recommendation = models.TextField()
    evidence_level = models.CharField(max_length=128)
    doi_or_url = models.URLField(max_length=512, blank=True, null=True)
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "knowledge_documents"
        ordering = ["guideline_id"]

    def __str__(self) -> str:
        return f"[{self.guideline_id}] {self.title[:60]}"


class ModelDriftRecord(models.Model):
    """
    MLOps monitoring entity tracking feature drift (PSI, KS-test) and distribution shifts.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model_name = models.CharField(max_length=128, db_index=True)
    model_version = models.CharField(max_length=32)
    feature_name = models.CharField(max_length=64, db_index=True)
    psi_score = models.FloatField(help_text="Population Stability Index (<0.1 stable, >0.25 severe)")
    ks_statistic = models.FloatField(default=0.0)
    p_value = models.FloatField(default=1.0)
    is_drift_detected = models.BooleanField(default=False)
    drift_alert_triggered = models.BooleanField(default=False)
    evaluated_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "model_drift_records"
        ordering = ["-evaluated_at"]

    def __str__(self) -> str:
        return f"Drift {self.feature_name} (PSI={self.psi_score:.3f}, Drift={self.is_drift_detected})"
