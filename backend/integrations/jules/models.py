"""
Authoritative Neon PostgreSQL Models for Google Jules Engineering Automation.
Strictly separated from clinical patient data and medical decision logic.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel


class JulesSessionState(models.TextChoices):
    QUEUED = "QUEUED", "Queued"
    PLANNING = "PLANNING", "Generating Plan"
    PLAN_PENDING_APPROVAL = "PLAN_PENDING_APPROVAL", "Plan Pending Human Approval"
    EXECUTING = "EXECUTING", "Executing Code Remediation"
    VALIDATING = "VALIDATING", "Running Automated Validation"
    AWAITING_REVIEW = "AWAITING_REVIEW", "Awaiting Engineer Review"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    CANCELLED = "CANCELLED", "Cancelled"


class RemediationTriggerType(models.TextChoices):
    CI_FAILURE = "CI_FAILURE", "GitHub Actions CI Failure"
    REACT_DOCTOR = "REACT_DOCTOR", "React Doctor Diagnostic"
    BRUNO = "BRUNO", "Bruno API Test Failure"
    STRIX = "STRIX", "Strix Authorized Security Finding"
    BUG_HUNTER = "BUG_HUNTER", "Agentic Bug Hunter Finding"
    PENTEST_AGENTS = "PENTEST_AGENTS", "Pentest Agent Finding"
    DJANGO_TEST = "DJANGO_TEST", "Django Test Failure"
    NEXTJS_BUILD = "NEXTJS_BUILD", "Next.js Build Failure"
    TYPESCRIPT = "TYPESCRIPT", "TypeScript Compile Failure"
    LINT = "LINT", "Linter / Formatter Failure"
    COOLIFY = "COOLIFY", "Coolify Deployment Failure"
    MANUAL = "MANUAL", "Manual Developer Request"


class RemediationIssueCategory(models.TextChoices):
    BUILD_FAILURE = "BUILD_FAILURE", "Build Failure"
    TYPESCRIPT_ERROR = "TYPESCRIPT_ERROR", "TypeScript Error"
    PYTHON_ERROR = "PYTHON_ERROR", "Python Error"
    DJANGO_ERROR = "DJANGO_ERROR", "Django Error"
    DATABASE_ERROR = "DATABASE_ERROR", "Database Error"
    API_ERROR = "API_ERROR", "API Error"
    UI_ERROR = "UI_ERROR", "UI / React Error"
    TEST_FAILURE = "TEST_FAILURE", "Test Failure"
    LINT_FAILURE = "LINT_FAILURE", "Lint Failure"
    PERFORMANCE_REGRESSION = "PERFORMANCE_REGRESSION", "Performance Regression"
    ACCESSIBILITY_FAILURE = "ACCESSIBILITY_FAILURE", "Accessibility Failure"
    SECURITY_FINDING = "SECURITY_FINDING", "Security Finding"
    DEPENDENCY_FAILURE = "DEPENDENCY_FAILURE", "Dependency Failure"
    DOCKER_FAILURE = "DOCKER_FAILURE", "Docker Failure"
    CI_FAILURE = "CI_FAILURE", "CI Failure"
    DEPLOYMENT_FAILURE = "DEPLOYMENT_FAILURE", "Deployment Failure"
    DOCUMENTATION_FAILURE = "DOCUMENTATION_FAILURE", "Documentation Failure"
    OTHER = "OTHER", "Other"


class RemediationSeverity(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    CRITICAL = "CRITICAL", "Critical"


class RemediationJobStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING_AUTHORIZATION = "PENDING_AUTHORIZATION", "Pending Authorization"
    AUTHORIZED = "AUTHORIZED", "Authorized"
    QUEUED = "QUEUED", "Queued"
    JULES_SESSION_CREATED = "JULES_SESSION_CREATED", "Jules Session Created"
    PLANNING = "PLANNING", "Planning"
    PLAN_PENDING_APPROVAL = "PLAN_PENDING_APPROVAL", "Plan Pending Approval"
    EXECUTING = "EXECUTING", "Executing"
    VALIDATING = "VALIDATING", "Validating"
    AWAITING_REVIEW = "AWAITING_REVIEW", "Awaiting Review"
    APPROVED = "APPROVED", "Approved"
    PR_CREATED = "PR_CREATED", "PR Created"
    MERGED = "MERGED", "Merged"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    CANCELLED = "CANCELLED", "Cancelled"
    EXPIRED = "EXPIRED", "Expired"
    REJECTED = "REJECTED", "Rejected"


class ApprovalType(models.TextChoices):
    PLAN_EXECUTION = "PLAN_EXECUTION", "Plan Execution Approval"
    PR_CREATION = "PR_CREATION", "Pull Request Creation"
    PR_MERGE = "PR_MERGE", "Pull Request Merge"
    SENSITIVE_REMEDIATION = "SENSITIVE_REMEDIATION", "Sensitive Component Remediation"


class ApprovalStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    EXPIRED = "EXPIRED", "Expired"


class JulesSource(BaseModel):
    """
    Connected GitHub repository synchronized from Google Jules /v1alpha/sources.
    """
    external_name = models.CharField(max_length=255, unique=True, help_text="e.g. sources/github/owner/repo")
    source_id = models.CharField(max_length=120, db_index=True)
    provider = models.CharField(max_length=50, default="github")
    github_owner = models.CharField(max_length=100)
    github_repository = models.CharField(max_length=150)
    is_private = models.BooleanField(default=True)
    default_branch = models.CharField(max_length=100, default="main")
    available_branches = models.JSONField(default=list, blank=True)
    enabled = models.BooleanField(default=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["github_owner", "github_repository"]
        verbose_name = "Jules Source"
        verbose_name_plural = "Jules Sources"

    def __str__(self):
        return f"{self.github_owner}/{self.github_repository} ({self.default_branch})"


class JulesRemediationJob(BaseModel):
    """
    Controlled lifecycle of an automated code remediation task.
    """
    correlation_id = models.CharField(max_length=64, unique=True, db_index=True)
    source = models.ForeignKey(JulesSource, on_delete=models.SET_NULL, null=True, blank=True, related_name="remediation_jobs")
    repository = models.CharField(max_length=200, default="HealthNova-AI")
    branch = models.CharField(max_length=100, default="develop")
    trigger_type = models.CharField(max_length=40, choices=RemediationTriggerType.choices, default=RemediationTriggerType.MANUAL, db_index=True)
    issue_category = models.CharField(max_length=50, choices=RemediationIssueCategory.choices, default=RemediationIssueCategory.BUILD_FAILURE, db_index=True)
    issue_reference = models.CharField(max_length=255, blank=True, default="", help_text="e.g. Issue #142, CI Run #9928, Strix SEC-04")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    severity = models.CharField(max_length=20, choices=RemediationSeverity.choices, default=RemediationSeverity.MEDIUM, db_index=True)
    status = models.CharField(max_length=40, choices=RemediationJobStatus.choices, default=RemediationJobStatus.DRAFT, db_index=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="jules_jobs_created")
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="jules_jobs_approved")
    validation_status = models.CharField(max_length=20, default="PENDING")
    validation_output = models.JSONField(default=dict, blank=True)
    pr_url = models.URLField(max_length=500, blank=True, default="")
    pr_number = models.IntegerField(null=True, blank=True)
    prompt_version = models.CharField(max_length=20, default="1.0")
    remediation_attempts = models.IntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Jules Remediation Job"
        verbose_name_plural = "Jules Remediation Jobs"

    def __str__(self):
        return f"[{self.correlation_id}] {self.title} ({self.status})"


class JulesSession(BaseModel):
    """
    Unit of work executed in Google Jules /v1alpha/sessions.
    """
    external_session_id = models.CharField(max_length=200, unique=True, null=True, blank=True, db_index=True)
    remediation_job = models.OneToOneField(JulesRemediationJob, on_delete=models.CASCADE, related_name="session")
    title = models.CharField(max_length=255)
    prompt = models.TextField(help_text="Sanitized instruction sent to Jules")
    repository = models.CharField(max_length=200)
    branch = models.CharField(max_length=100)
    state = models.CharField(max_length=40, choices=JulesSessionState.choices, default=JulesSessionState.QUEUED, db_index=True)
    automation_mode = models.CharField(max_length=40, default="NONE")
    require_plan_approval = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="jules_sessions")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Jules Session"
        verbose_name_plural = "Jules Sessions"

    def __str__(self):
        return f"Session: {self.title} ({self.state})"


class JulesActivity(BaseModel):
    """
    Chronological progress event recorded within a Jules session.
    """
    external_activity_id = models.CharField(max_length=200, blank=True, default="", db_index=True)
    jules_session = models.ForeignKey(JulesSession, on_delete=models.CASCADE, related_name="activities")
    activity_type = models.CharField(max_length=60, default="PROGRESS", help_text="e.g. PLAN_GENERATED, PROGRESS, MESSAGE, ARTIFACT")
    originator = models.CharField(max_length=40, default="JULES", help_text="JULES, SYSTEM, or USER")
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Jules Activity"
        verbose_name_plural = "Jules Activities"

    def __str__(self):
        return f"[{self.activity_type}] {self.originator}: {self.description[:60]}"


class JulesArtifact(BaseModel):
    """
    Patch, diff, or report generated during a Jules remediation.
    """
    jules_session = models.ForeignKey(JulesSession, on_delete=models.CASCADE, related_name="artifacts")
    artifact_type = models.CharField(max_length=50, default="PATCH")
    path = models.CharField(max_length=500, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Jules Artifact"
        verbose_name_plural = "Jules Artifacts"

    def __str__(self):
        return f"{self.artifact_type} ({self.path})"


class JulesApproval(BaseModel):
    """
    Explicit dual-custody gate requiring human IT Admin / Lead approval.
    """
    remediation_job = models.ForeignKey(JulesRemediationJob, on_delete=models.CASCADE, related_name="approvals")
    approval_type = models.CharField(max_length=40, choices=ApprovalType.choices, default=ApprovalType.PLAN_EXECUTION)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="jules_approvals_requested")
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="jules_approvals_granted")
    status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING, db_index=True)
    reason = models.TextField(blank=True, default="")
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Jules Approval"
        verbose_name_plural = "Jules Approvals"

    def is_expired(self) -> bool:
        if self.expires_at and timezone.now() > self.expires_at:
            return True
        return False


class JulesAuditEvent(BaseModel):
    """
    Immutable audit log entry for all Jules actions.
    """
    actor_id = models.CharField(max_length=100, default="SYSTEM")
    action = models.CharField(max_length=100, db_index=True)
    resource_type = models.CharField(max_length=60, db_index=True)
    resource_id = models.CharField(max_length=100, db_index=True)
    correlation_id = models.CharField(max_length=64, blank=True, default="", db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Jules Audit Event"
        verbose_name_plural = "Jules Audit Events"

    def __str__(self):
        return f"[{self.action}] {self.resource_type}:{self.resource_id} by {self.actor_id}"
