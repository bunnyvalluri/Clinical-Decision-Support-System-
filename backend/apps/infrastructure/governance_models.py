"""
Infrastructure Governance Models.
Tracks OpenTofu IaC plans, apply records, human approvals, drift evaluations, and policy compliance.
"""

import uuid
from django.conf import settings
from django.db import models


class IaCPlanRecord(models.Model):
    """
    Historical and auditing record of an OpenTofu speculative plan.
    Enforces human approval gates before production application.
    """
    class Status(models.TextChoices):
        PLANNED = "PLANNED", "Planned"
        APPLIED = "APPLIED", "Applied"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    environment = models.CharField(max_length=50, default="production", db_index=True)
    tool = models.CharField(max_length=50, default="OpenTofu")
    plan_output = models.TextField()
    resources_to_add = models.IntegerField(default=0)
    resources_to_change = models.IntegerField(default=0)
    resources_to_destroy = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    requires_human_approval = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_iac_plans",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    correlation_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "IaC Plan Record"
        verbose_name_plural = "IaC Plan Records"
        ordering = ["-created_at"]

    def __str__(self):
        return f"IaC Plan {self.id} [{self.environment}] - +{self.resources_to_add} ~{self.resources_to_change} -{self.resources_to_destroy} ({self.status})"


class InfrastructureDriftRecord(models.Model):
    """
    Tracks state drift between Git-committed OpenTofu code and live cloud infrastructure.
    """
    class Status(models.TextChoices):
        IN_SYNC = "IN_SYNC", "In Sync"
        DRIFT_DETECTED = "DRIFT_DETECTED", "Drift Detected"
        ERROR = "ERROR", "Error"
        UNKNOWN = "UNKNOWN", "Unknown"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    environment = models.CharField(max_length=50, default="production", db_index=True)
    is_drifted = models.BooleanField(default=False)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.IN_SYNC)
    exit_code = models.IntegerField(default=0)
    drift_summary = models.TextField(blank=True)
    remediation_plan = models.TextField(blank=True)
    detected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Infrastructure Drift Record"
        verbose_name_plural = "Infrastructure Drift Records"
        ordering = ["-detected_at"]

    def __str__(self):
        return f"Drift [{self.environment}] - {self.status} (exit_code={self.exit_code})"


class InfrastructurePolicyCheck(models.Model):
    """
    Records compliance evaluation results against HIPAA, CIS benchmarks, and OPA Rego rules.
    """
    class Status(models.TextChoices):
        PASSED = "PASSED", "Passed"
        FAILED = "FAILED", "Failed"
        WARNING = "WARNING", "Warning"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    policy_name = models.CharField(max_length=255)
    policy_type = models.CharField(max_length=50, default="OPA_REGO")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PASSED)
    description = models.TextField(blank=True)
    violations = models.JSONField(default=list, blank=True)
    evaluated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Infrastructure Policy Check"
        verbose_name_plural = "Infrastructure Policy Checks"
        ordering = ["-evaluated_at"]

    def __str__(self):
        return f"{self.policy_name} ({self.status})"
