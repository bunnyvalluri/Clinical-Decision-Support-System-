"""
Data models for Controlled Security Testing, Recon, and Vulnerability Management.
Based on Agentic-Bug-Hunter architecture adapted for Healthcare CDSS (BPY-CSE-2666).
Zero PHI stored; strictly separated from clinical patient records.
"""
import hashlib
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel


class SecurityEnvironment(models.TextChoices):
    DEVELOPMENT = "DEVELOPMENT", "Development"
    SECURITY_TEST = "SECURITY_TEST", "Isolated Security Test Lab"
    STAGING = "STAGING", "Staging (Authorized Only)"
    PRODUCTION = "PRODUCTION", "Production (Disabled by Default)"


class TargetType(models.TextChoices):
    APPLICATION = "APPLICATION", "Full Application"
    API = "API", "REST / JSON API"
    WEB_FRONTEND = "WEB_FRONTEND", "Next.js Web Frontend"
    BACKEND = "BACKEND", "Django Backend"
    MICROSERVICE = "MICROSERVICE", "Microservice"
    INTERNAL_SERVICE = "INTERNAL_SERVICE", "Internal Service"
    STAGING = "STAGING", "Staging Target"
    SECURITY_LAB = "SECURITY_LAB", "Local Security Lab"
    LOCAL_DEMO = "LOCAL_DEMO", "Local Synthetic Demo"
    INTERNET_TARGET = "INTERNET_TARGET", "External Target (Strict Admin Authorization Only)"


class ApprovalStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Authorization"
    APPROVED = "APPROVED", "Authorized"
    REJECTED = "REJECTED", "Rejected"
    EXPIRED = "EXPIRED", "Approval Expired"
    REVOKED = "REVOKED", "Approval Revoked"


def default_forbidden_tests():
    return ["DESTRUCTIVE_WRITE", "CREDENTIAL_SPRAYING", "DENIAL_OF_SERVICE", "PRODUCTION_EXPLOITATION"]


class SecurityTarget(BaseModel):
    """
    Strict allowlist target registry. Default-deny policy enforced.
    No test can execute against a target unless approved by an authorized administrator.
    """
    name = models.CharField(max_length=150, unique=True, help_text="Human-readable target identifier")
    environment = models.CharField(
        max_length=30,
        choices=SecurityEnvironment.choices,
        default=SecurityEnvironment.SECURITY_TEST,
        db_index=True,
    )
    target_type = models.CharField(
        max_length=30,
        choices=TargetType.choices,
        default=TargetType.API,
    )
    hostname = models.CharField(max_length=255, help_text="Domain or IP address (e.g. localhost, 127.0.0.1, cdss-staging.internal)")
    port = models.IntegerField(default=8000)
    protocol = models.CharField(max_length=10, default="http", choices=[("http", "HTTP"), ("https", "HTTPS"), ("ws", "WebSocket"), ("wss", "Secure WebSocket")])
    scope = models.TextField(
        help_text="Explicit allowed scope paths, URLs or CIDRs (newline or JSON array)",
        default="/api/v1/health/, /api/v1/predictions/, /api/v1/auth/",
    )
    owner = models.CharField(max_length=100, default="DevSecOps Team")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_security_targets",
    )
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        db_index=True,
    )
    approval_expires_at = models.DateTimeField(null=True, blank=True)
    allowed_tests = models.JSONField(
        default=list,
        help_text="List of permitted test identifiers (e.g. ['RBAC_CHECK', 'IDOR_CHECK', 'XSS_CHECK', 'RATE_LIMIT_CHECK'])",
    )
    forbidden_tests = models.JSONField(
        default=default_forbidden_tests,
        help_text="Explicitly forbidden test operations",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} [{self.environment}] ({self.approval_status})"

    @property
    def is_approval_valid(self) -> bool:
        if self.approval_status != ApprovalStatus.APPROVED or not self.is_active:
            return False
        if self.approval_expires_at and timezone.now() > self.approval_expires_at:
            return False
        if self.environment == SecurityEnvironment.PRODUCTION:
            return False  # Strict default-deny on production
        return True


class SecurityScanState(models.TextChoices):
    CREATED = "CREATED", "Created"
    APPROVAL_PENDING = "APPROVAL_PENDING", "Pending Dual-Custody Approval"
    APPROVED = "APPROVED", "Approved"
    QUEUED = "QUEUED", "Queued in Celery"
    RUNNING = "RUNNING", "Running"
    PAUSED = "PAUSED", "Paused"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    CANCELLED = "CANCELLED", "Cancelled"
    TIMED_OUT = "TIMED_OUT", "Timed Out"
    BLOCKED = "BLOCKED", "Blocked by Safety Policy"


class SecurityScan(BaseModel):
    """
    Record of a controlled security scan execution against an approved target.
    """
    target = models.ForeignKey(SecurityTarget, on_delete=models.CASCADE, related_name="scans")
    scan_type = models.CharField(
        max_length=50,
        choices=[
            ("RECON", "Attack Surface & Route Recon"),
            ("API_SECURITY", "API Security & Injection Testing"),
            ("RBAC_AUTH", "5-Role Privilege Escalation & Auth Matrix"),
            ("IDOR", "Insecure Direct Object References"),
            ("SSRF_CHECK", "Safe SSRF & Egress Boundary Check"),
            ("COMPREHENSIVE_LAB", "Full Controlled Security Lab Scan"),
        ],
        default="API_SECURITY",
    )
    status = models.CharField(
        max_length=30,
        choices=SecurityScanState.choices,
        default=SecurityScanState.CREATED,
        db_index=True,
    )
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="initiated_security_scans",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_security_scans",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    max_requests = models.IntegerField(default=100)
    rate_limit_rps = models.FloatField(default=5.0)
    timeout_seconds = models.IntegerField(default=300)
    tools_used = models.JSONField(default=list)
    raw_logs_sanitized = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Scan {str(self.id)[:8]} - {self.target.name} [{self.status}]"


class FindingSeverity(models.TextChoices):
    INFO = "INFO", "Informational"
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    CRITICAL = "CRITICAL", "Critical"


class FindingState(models.TextChoices):
    DISCOVERED = "DISCOVERED", "Discovered"
    TRIAGED = "TRIAGED", "Triaged"
    VALIDATION_REQUIRED = "VALIDATION_REQUIRED", "Validation Required"
    VALIDATED = "VALIDATED", "Validated (Confirmed Real Vulnerability)"
    FALSE_POSITIVE = "FALSE_POSITIVE", "False Positive (Filtered Out)"
    DUPLICATE = "DUPLICATE", "Duplicate"
    REMEDIATION_REQUIRED = "REMEDIATION_REQUIRED", "Remediation Required"
    IN_PROGRESS = "IN_PROGRESS", "Remediation In Progress"
    FIXED = "FIXED", "Fix Implemented (Pending Retest)"
    RETEST_REQUIRED = "RETEST_REQUIRED", "Retest Required"
    RESOLVED = "RESOLVED", "Resolved & Confirmed"
    ACCEPTED_RISK = "ACCEPTED_RISK", "Accepted Risk by Authority"
    REJECTED = "REJECTED", "Rejected by Validation Gate"


class SecurityFinding(BaseModel):
    """
    Vulnerability finding verified by the 7-question validation gate.
    No theoretical findings stored without reproducible evidence.
    """
    scan = models.ForeignKey(SecurityScan, on_delete=models.SET_NULL, null=True, blank=True, related_name="findings")
    target = models.ForeignKey(SecurityTarget, on_delete=models.CASCADE, related_name="findings")
    title = models.CharField(max_length=255)
    vulnerability_type = models.CharField(max_length=100, db_index=True)
    severity = models.CharField(max_length=20, choices=FindingSeverity.choices, default=FindingSeverity.LOW, db_index=True)
    state = models.CharField(max_length=30, choices=FindingState.choices, default=FindingState.DISCOVERED, db_index=True)
    confidence = models.FloatField(default=0.8, help_text="Deterministic confidence score (0.0 - 1.0)")
    affected_component = models.CharField(max_length=255)
    affected_endpoint = models.CharField(max_length=255)
    description = models.TextField()
    impact = models.TextField()
    root_cause = models.TextField(blank=True)
    remediation_guidance = models.TextField()
    cwe_id = models.CharField(max_length=50, blank=True, help_text="e.g. CWE-639, CWE-79, CWE-89")
    cvss_score = models.FloatField(default=0.0)
    discovered_by = models.CharField(max_length=100, default="AgenticBugHunterAdapter")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_security_findings",
    )
    validated_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.severity}] {self.title} ({self.state})"


class SecurityEvidence(BaseModel):
    """
    Sanitized evidence supporting a security finding.
    Zero PHI, secrets, or raw credentials stored.
    """
    finding = models.ForeignKey(SecurityFinding, on_delete=models.CASCADE, related_name="evidences")
    evidence_type = models.CharField(
        max_length=50,
        choices=[
            ("HTTP_REQUEST", "Redacted HTTP Request"),
            ("HTTP_RESPONSE", "Redacted HTTP Response"),
            ("LOG_TRACE", "Sanitized Log Trace"),
            ("REPRODUCTION_POC", "Safe Reproduction Steps"),
        ],
        default="REPRODUCTION_POC",
    )
    sanitized_request = models.JSONField(default=dict)
    sanitized_response = models.JSONField(default=dict)
    reproduction_steps = models.TextField()
    evidence_hash = models.CharField(max_length=64, blank=True)
    captured_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        if not self.evidence_hash:
            content = f"{self.evidence_type}:{self.reproduction_steps}:{self.sanitized_request}"
            self.evidence_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        super().save(*args, **kwargs)


class SecurityValidation(BaseModel):
    """
    Implements the 7-question validation gate from Agentic-Bug-Hunter:
    1. Is target authorized?
    2. Is affected component actually vulnerable?
    3. Can behavior be reproduced?
    4. Is issue exploitable?
    5. Is there meaningful impact?
    6. Is evidence sufficient?
    7. Is finding reportable?
    """
    finding = models.OneToOneField(SecurityFinding, on_delete=models.CASCADE, related_name="validation")
    validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    is_target_authorized = models.BooleanField(default=True)
    is_vulnerable = models.BooleanField(default=False)
    is_reproducible = models.BooleanField(default=False)
    is_exploitable = models.BooleanField(default=False)
    has_meaningful_impact = models.BooleanField(default=False)
    is_evidence_sufficient = models.BooleanField(default=False)
    is_reportable = models.BooleanField(default=False)
    validation_notes = models.TextField(blank=True)
    decision = models.CharField(
        max_length=30,
        choices=[
            ("VALIDATED", "Validated (Passed 7 Questions)"),
            ("FALSE_POSITIVE", "False Positive Rejected"),
            ("INSUFFICIENT_EVIDENCE", "Insufficient Evidence (Discarded)"),
        ],
        default="INSUFFICIENT_EVIDENCE",
    )
    validated_at = models.DateTimeField(default=timezone.now)

    def evaluate_gate(self) -> bool:
        """Returns True only if all 7 questions pass."""
        passed = all([
            self.is_target_authorized,
            self.is_vulnerable,
            self.is_reproducible,
            self.is_exploitable,
            self.has_meaningful_impact,
            self.is_evidence_sufficient,
            self.is_reportable,
        ])
        self.decision = "VALIDATED" if passed else "FALSE_POSITIVE"
        return passed


class SecurityReport(BaseModel):
    """
    Auditable security report generated from validated findings.
    Requires human reviewer sign-off before distribution.
    """
    scan = models.ForeignKey(SecurityScan, on_delete=models.SET_NULL, null=True, blank=True, related_name="reports")
    title = models.CharField(max_length=255)
    summary = models.TextField()
    report_type = models.CharField(
        max_length=50,
        choices=[
            ("TECHNICAL_DEV", "Technical Developer Report"),
            ("EXECUTIVE_AUDIT", "Executive Audit Summary"),
            ("COMPLIANCE_HIPAA", "HIPAA/SOC2 Security Posture"),
        ],
        default="TECHNICAL_DEV",
    )
    findings_summary = models.JSONField(default=dict)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_security_reports")
    is_approved = models.BooleanField(default=False)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class SecurityApproval(BaseModel):
    """
    Dual-custody authorization for security scan execution.
    """
    target = models.ForeignKey(SecurityTarget, on_delete=models.CASCADE, related_name="approvals")
    scan = models.ForeignKey(SecurityScan, on_delete=models.SET_NULL, null=True, blank=True)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="requested_approvals")
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="granted_approvals")
    status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    scope_notes = models.TextField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)


class SecurityRemediation(BaseModel):
    """
    Remediation task tracking code fixes and pull requests for validated vulnerabilities.
    """
    finding = models.OneToOneField(SecurityFinding, on_delete=models.CASCADE, related_name="remediation")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    pull_request_url = models.URLField(blank=True)
    commit_hash = models.CharField(max_length=64, blank=True)
    remediation_notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=30,
        choices=[("PENDING", "Pending"), ("IN_PROGRESS", "In Progress"), ("FIXED", "Fixed"), ("VERIFIED", "Verified")],
        default="PENDING",
    )


class SecurityRetest(BaseModel):
    """
    Automated retest execution verifying vulnerability closure.
    """
    finding = models.ForeignKey(SecurityFinding, on_delete=models.CASCADE, related_name="retests")
    executed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    passed = models.BooleanField(default=False, help_text="True if original vulnerability is confirmed fixed and cannot be reproduced")
    test_output = models.TextField(blank=True)
    executed_at = models.DateTimeField(default=timezone.now)


class SecurityAuditEvent(BaseModel):
    """
    Immutable security testing audit log.
    """
    event_type = models.CharField(max_length=100, db_index=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    target_name = models.CharField(max_length=255)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-timestamp"]


class SecurityToolExecution(BaseModel):
    """
    Execution trace for individual security tools (httpx, nuclei, ffuf, custom adapters).
    """
    scan = models.ForeignKey(SecurityScan, on_delete=models.CASCADE, related_name="tool_executions")
    tool_name = models.CharField(max_length=100)
    tool_version = models.CharField(max_length=50, default="1.0.0")
    execution_time_seconds = models.FloatField(default=0.0)
    exit_code = models.IntegerField(default=0)
    stdout_sanitized = models.TextField(blank=True)
    stderr_sanitized = models.TextField(blank=True)


# ---------------------------------------------------------------------------
# Reconnaissance Models
# ---------------------------------------------------------------------------

class ReconSession(BaseModel):
    target = models.ForeignKey(SecurityTarget, on_delete=models.CASCADE, related_name="recon_sessions")
    status = models.CharField(max_length=30, default="COMPLETED")
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_endpoints_discovered = models.IntegerField(default=0)


class ReconAsset(BaseModel):
    session = models.ForeignKey(ReconSession, on_delete=models.CASCADE, related_name="assets")
    asset_type = models.CharField(max_length=50, default="HOST")  # HOST, SERVICE, REPOSITORY
    value = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict)


class ReconEndpoint(BaseModel):
    session = models.ForeignKey(ReconSession, on_delete=models.CASCADE, related_name="endpoints")
    path = models.CharField(max_length=255)
    http_method = models.CharField(max_length=10, default="GET")
    auth_required = models.BooleanField(default=True)
    role_required = models.CharField(max_length=50, default="IT_ADMIN")
    is_discovered_dynamically = models.BooleanField(default=True)


class ReconParameter(BaseModel):
    endpoint = models.ForeignKey(ReconEndpoint, on_delete=models.CASCADE, related_name="parameters")
    param_name = models.CharField(max_length=100)
    param_type = models.CharField(max_length=50, default="string")  # query, body, path, header
    is_sensitive = models.BooleanField(default=False)


class ReconTechnology(BaseModel):
    session = models.ForeignKey(ReconSession, on_delete=models.CASCADE, related_name="technologies")
    name = models.CharField(max_length=100)
    version = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=100, default="Framework")


class ReconFinding(BaseModel):
    session = models.ForeignKey(ReconSession, on_delete=models.CASCADE, related_name="recon_findings")
    title = models.CharField(max_length=255)
    details = models.TextField()
    severity = models.CharField(max_length=20, default="INFO")


class ReconEvidence(BaseModel):
    finding = models.ForeignKey(ReconFinding, on_delete=models.CASCADE, related_name="recon_evidences")
    evidence_data = models.JSONField(default=dict)
