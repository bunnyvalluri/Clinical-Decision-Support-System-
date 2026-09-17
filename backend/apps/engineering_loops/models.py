"""
Data models for Controlled Engineering Loop Automation and Governance.
Based on cobusgreyling/loop-engineering architecture adapted for Healthcare CDSS.
Strictly separated from clinical patient records and medical decision logic.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel


class AutonomyLevel(models.TextChoices):
    L1_REPORT_ONLY = "L1_REPORT_ONLY", "L1 — Report Only (Discover & Triage)"
    L2_ASSISTED = "L2_ASSISTED", "L2 — Assisted (Propose Patch & Tests, Human Gate)"
    L3_CONTROLLED_UNATTENDED = "L3_CONTROLLED_UNATTENDED", "L3 — Controlled Unattended (Explicit Allowlist Only)"


class LoopCadence(models.TextChoices):
    MANUAL = "MANUAL", "On Demand / Manual"
    DAILY = "DAILY", "Daily Scheduled"
    HOURLY = "HOURLY", "Hourly Scheduled"
    CI_EVENT = "CI_EVENT", "CI / Pipeline Trigger"
    PR_EVENT = "PR_EVENT", "Pull Request Trigger"
    DEPENDENCY_EVENT = "DEPENDENCY_EVENT", "Dependency Update Trigger"


class LoopStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft Definition"
    VALIDATING = "VALIDATING", "Validating Constraints"
    READY = "READY", "Ready for Execution"
    SCHEDULED = "SCHEDULED", "Scheduled"
    QUEUED = "QUEUED", "Queued in Celery"
    RUNNING = "RUNNING", "Running in Worktree"
    VERIFYING = "VERIFYING", "Maker/Checker Verification"
    WAITING_APPROVAL = "WAITING_APPROVAL", "Waiting for Dual-Custody Approval"
    COMPLETED = "COMPLETED", "Completed Successfully"
    FAILED = "FAILED", "Failed"
    CANCELLED = "CANCELLED", "Cancelled"
    PAUSED = "PAUSED", "Paused"
    EXPIRED = "EXPIRED", "Expired"


class LoopPatternType(models.TextChoices):
    DAILY_TRIAGE = "DAILY_TRIAGE", "Daily Engineering Triage"
    THIN_LOOP = "THIN_LOOP", "Thin Scoped Loop"
    PR_BABYSITTER = "PR_BABYSITTER", "PR Babysitter"
    CI_SWEEPER = "CI_SWEEPER", "CI Failure Sweeper"
    DEPENDENCY_SWEEPER = "DEPENDENCY_SWEEPER", "Dependency Security Sweeper"
    CHANGELOG_DRAFTER = "CHANGELOG_DRAFTER", "Changelog Drafter"
    POST_MERGE_CLEANUP = "POST_MERGE_CLEANUP", "Post-Merge Branch Cleanup"
    ISSUE_TRIAGE = "ISSUE_TRIAGE", "Issue Triage & Classification"
    CLINICAL_CODE_HEALTH = "CLINICAL_CODE_HEALTH", "Clinical Code & Safety Check (L1)"
    ML_REGRESSION_CHECK = "ML_REGRESSION_CHECK", "ML Regression & Model Drift (L1)"
    DOCUMENTATION_SYNC = "DOCUMENTATION_SYNC", "Documentation & Spec Drift Check"
    SPEC_CONVERGENCE = "SPEC_CONVERGENCE", "Spec Kit Convergence Audit"


class EngineeringLoop(BaseModel):
    """
    Loop definition governing an automated engineering workflow.
    """
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField()
    repository = models.CharField(max_length=255, default="clinical-decision-support-system")
    pattern = models.CharField(
        max_length=50,
        choices=LoopPatternType.choices,
        default=LoopPatternType.DAILY_TRIAGE,
        db_index=True,
    )
    tool = models.CharField(max_length=100, default="@cobusgreyling/loop")
    cadence = models.CharField(
        max_length=30,
        choices=LoopCadence.choices,
        default=LoopCadence.MANUAL,
    )
    autonomy_level = models.CharField(
        max_length=30,
        choices=AutonomyLevel.choices,
        default=AutonomyLevel.L1_REPORT_ONLY,
        db_index=True,
    )
    status = models.CharField(
        max_length=30,
        choices=LoopStatus.choices,
        default=LoopStatus.READY,
        db_index=True,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_engineering_loops",
    )
    allowed_paths = models.JSONField(
        default=list,
        help_text="Explicit allowed paths in repository",
    )
    denied_paths = models.JSONField(
        default=list,
        help_text="Explicit denied paths (e.g. .env, clinical models, secrets)",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} [{self.pattern}] ({self.autonomy_level})"


class EngineeringLoopRun(BaseModel):
    """
    Execution trace for an engineering loop run.
    """
    loop = models.ForeignKey(
        EngineeringLoop,
        on_delete=models.CASCADE,
        related_name="runs",
    )
    run_id = models.CharField(max_length=64, unique=True, db_index=True)
    status = models.CharField(
        max_length=30,
        choices=LoopStatus.choices,
        default=LoopStatus.QUEUED,
        db_index=True,
    )
    trigger = models.CharField(max_length=50, default="MANUAL")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(default=0.0)
    cost_estimate = models.FloatField(default=0.0)
    actual_cost = models.FloatField(default=0.0)
    tokens_used = models.IntegerField(default=0)
    attempt_count = models.IntegerField(default=1)
    correlation_id = models.CharField(max_length=64, blank=True, db_index=True)
    worktree_path = models.CharField(max_length=512, blank=True)
    summary = models.TextField(blank=True)
    error = models.TextField(blank=True)
    loop_ready_score = models.IntegerField(
        default=0,
        help_text="Retrieved from upstream @cobusgreyling/loop doctor/audit",
    )
    findings_count = models.IntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Run {self.run_id[:8]} - {self.loop.name} [{self.status}]"


class EngineeringLoopTask(BaseModel):
    """
    Individual step or sub-task within a loop run.
    """
    run = models.ForeignKey(
        EngineeringLoopRun,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    task_type = models.CharField(max_length=100)
    description = models.TextField()
    status = models.CharField(max_length=30, default="PENDING")
    priority = models.CharField(max_length=20, default="MEDIUM")
    assigned_agent = models.CharField(max_length=100, default="LoopEngine")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    output_data = models.JSONField(default=dict)

    class Meta:
        ordering = ["created_at"]


class EngineeringLoopArtifact(BaseModel):
    """
    Artifact produced by a loop run (diff, report, SARIF, test log).
    """
    run = models.ForeignKey(
        EngineeringLoopRun,
        on_delete=models.CASCADE,
        related_name="artifacts",
    )
    artifact_type = models.CharField(max_length=50, default="REPORT")  # REPORT, DIFF, LOG, SARIF
    path = models.CharField(max_length=512)
    hash = models.CharField(max_length=64, blank=True)
    metadata = models.JSONField(default=dict)


class EngineeringLoopApproval(BaseModel):
    """
    Dual-custody approval record for L2/L3 actions, code changes, or PR creation.
    """
    run = models.ForeignKey(
        EngineeringLoopRun,
        on_delete=models.CASCADE,
        related_name="approvals",
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requested_loop_approvals",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="granted_loop_approvals",
    )
    approval_type = models.CharField(max_length=50, default="PATCH_MERGE")
    status = models.CharField(max_length=20, default="PENDING")  # PENDING, APPROVED, REJECTED, EXPIRED
    scope_notes = models.TextField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)


class EngineeringLoopAuditEvent(BaseModel):
    """
    Immutable audit log for engineering loop operations.
    """
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    loop = models.ForeignKey(
        EngineeringLoop,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    run = models.ForeignKey(
        EngineeringLoopRun,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=100, db_index=True)
    metadata = models.JSONField(default=dict)
    correlation_id = models.CharField(max_length=64, blank=True, db_index=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-timestamp"]


class EngineeringLoopBudget(BaseModel):
    """
    Budget control preventing infinite loops and cost overruns.
    """
    name = models.CharField(max_length=100, default="Global Engineering Loop Budget")
    daily_limit = models.FloatField(default=15.0, help_text="Daily limit in USD")
    weekly_limit = models.FloatField(default=75.0, help_text="Weekly limit in USD")
    per_run_limit = models.FloatField(default=2.0, help_text="Max cost per single run in USD")
    per_agent_limit = models.FloatField(default=1.0, help_text="Max cost per agent session in USD")
    current_daily_spend = models.FloatField(default=0.0)
    current_weekly_spend = models.FloatField(default=0.0)
    hard_stop = models.BooleanField(default=True, help_text="Halt execution when limit reached")

    def is_within_budget(self, estimated_cost: float) -> bool:
        if not self.hard_stop:
            return True
        if (self.current_daily_spend + estimated_cost) > self.daily_limit:
            return False
        if (self.current_weekly_spend + estimated_cost) > self.weekly_limit:
            return False
        if estimated_cost > self.per_run_limit:
            return False
        return True


class EngineeringToolRegistry(BaseModel):
    """
    Tool registry for coding agents. Default-deny strictly enforced.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    risk = models.CharField(
        max_length=20,
        choices=[
            ("LOW", "Low Risk"),
            ("MEDIUM", "Medium Risk"),
            ("HIGH", "High Risk"),
            ("CRITICAL", "Critical Risk"),
        ],
        default="MEDIUM",
    )
    permissions = models.JSONField(default=list)
    allowed_roles = models.JSONField(default=list)
    allowed_autonomy = models.CharField(
        max_length=30,
        choices=AutonomyLevel.choices,
        default=AutonomyLevel.L1_REPORT_ONLY,
    )
    allowed_paths = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Tool: {self.name} [Risk: {self.risk}]"
