"""
Database models for Clinical AI Agents.

These models store agent configurations, persistent sessions, execution
correlation traces, tool metadata, immutable tool audit records,
human-in-the-loop approvals, session memories, provider telemetry,
safety violations, evaluation results, and clinician feedback.

Authoritative source of truth: Neon PostgreSQL.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel


class AgentRoleType(models.TextChoices):
    DOCTOR = "DOCTOR", "Physician / Doctor"
    NURSE = "NURSE", "Nurse / Triage"
    PATIENT = "PATIENT", "Patient / User"
    INFORMATICIST = "INFORMATICIST", "Medical Informaticist"
    ADMIN = "ADMIN", "System Administrator"
    GENERAL = "GENERAL", "General Clinical"


class AgentSessionStatus(models.TextChoices):
    CREATED = "CREATED", "Created"
    RUNNING = "RUNNING", "Running"
    WAITING_APPROVAL = "WAITING_APPROVAL", "Waiting for Approval"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    CANCELLED = "CANCELLED", "Cancelled"
    EXPIRED = "EXPIRED", "Expired"


class AgentExecutionStatus(models.TextChoices):
    STARTED = "STARTED", "Started"
    PLANNING = "PLANNING", "Planning"
    ACTING = "ACTING", "Acting"
    WAITING_APPROVAL = "WAITING_APPROVAL", "Waiting for Approval"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    CANCELLED = "CANCELLED", "Cancelled"
    TIMEOUT = "TIMEOUT", "Timeout"


class AgentMessageRole(models.TextChoices):
    SYSTEM = "system", "System"
    USER = "user", "User"
    ASSISTANT = "assistant", "Assistant"
    TOOL = "tool", "Tool"
    OBSERVATION = "observation", "Observation"


class AgentSecurityLevel(models.TextChoices):
    CRITICAL = "CRITICAL", "Critical Security / Clinical Risk"
    HIGH = "HIGH", "High Security Tier"
    MEDIUM = "MEDIUM", "Medium Security Tier"
    STANDARD = "STANDARD", "Standard Security Tier"
    LOW = "LOW", "Low Security Tier"


class ToolExecutionStatus(models.TextChoices):
    AUTHORIZED = "AUTHORIZED", "Authorized"
    DENIED = "DENIED", "Denied"
    REQUESTED = "REQUESTED", "Requested"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    TIMEOUT = "TIMEOUT", "Timeout"


class ToolRiskLevel(models.TextChoices):
    READ_ONLY = "READ_ONLY", "Read Only"
    LOW = "LOW", "Low Risk"
    MEDIUM = "MEDIUM", "Medium Risk"
    HIGH = "HIGH", "High Risk"
    CRITICAL = "CRITICAL", "Critical Clinical Action"


class ApprovalStatus(models.TextChoices):
    REQUESTED = "REQUESTED", "Requested"
    PENDING = "PENDING", "Pending Review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    EXPIRED = "EXPIRED", "Expired"
    CANCELLED = "CANCELLED", "Cancelled"


# Backward compatibility alias
ApprovalDecision = ApprovalStatus


class DataClassification(models.TextChoices):
    PUBLIC = "PUBLIC", "Public / General Medical"
    LOW_SENSITIVITY = "LOW_SENSITIVITY", "Low Sensitivity"
    SENSITIVE = "SENSITIVE", "Sensitive Operational"
    PHI = "PHI", "Protected Health Information"
    HIGHLY_SENSITIVE = "HIGHLY_SENSITIVE", "Highly Sensitive Psychiatric/Genetic"
    AUTHENTICATION_SECRET = "AUTHENTICATION_SECRET", "Authentication Secret / Credentials"


class MemoryType(models.TextChoices):
    SHORT_TERM_AGENT_STATE = "SHORT_TERM_AGENT_STATE", "Short Term State"
    USER_PREFERENCE = "USER_PREFERENCE", "User Preference"
    CLINICAL_SESSION_CONTEXT = "CLINICAL_SESSION_CONTEXT", "Clinical Session Context"
    LONG_TERM_FACT = "LONG_TERM_FACT", "Long Term Fact"


class SafetyEventType(models.TextChoices):
    PROMPT_INJECTION = "PROMPT_INJECTION", "Prompt Injection Attempt"
    UNAUTHORIZED_TOOL = "UNAUTHORIZED_TOOL", "Unauthorized Tool Call"
    PHI_VIOLATION = "PHI_VIOLATION", "PHI Transmission Violation"
    UNSAFE_OUTPUT = "UNSAFE_OUTPUT", "Unsafe Medical Advice / Diagnosis Refusal"
    HALLUCINATION_DETECTED = "HALLUCINATION_DETECTED", "Grounding / Citation Failure"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED", "Rate Limit Exceeded"


class FeedbackRating(models.TextChoices):
    HELPFUL = "HELPFUL", "Helpful / Accurate"
    INCORRECT = "INCORRECT", "Incorrect Clinical Reasoning"
    UNSAFE = "UNSAFE", "Unsafe Recommendation"
    IRRELEVANT = "IRRELEVANT", "Irrelevant Response"
    TOO_SLOW = "TOO_SLOW", "Excessive Latency"


class AgentDefinition(BaseModel):
    """
    Defines an authorized agent role archetype, its safety level,
    permitted tool registry keys, allowed model routing, and state.
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    system_prompt = models.TextField(default="", blank=True)
    version = models.CharField(max_length=20, default="1.0.0")
    security_level = models.CharField(
        max_length=30,
        choices=AgentSecurityLevel.choices,
        default=AgentSecurityLevel.HIGH,
        db_index=True,
    )
    role_type = models.CharField(
        max_length=50,
        choices=AgentRoleType.choices,
        default=AgentRoleType.DOCTOR,
        db_index=True,
    )
    allowed_roles = models.JSONField(
        default=list,
        help_text="Roles permitted to converse with this agent archetype.",
    )
    allowed_tools = models.JSONField(
        default=list,
        help_text="List of tool names allowed for this agent role archetype.",
    )
    model_policy = models.JSONField(
        default=dict,
        help_text="Allowed providers and model names (e.g. {'primary': 'ollama/llama3.2', 'fallback': 'gemini'}).",
    )
    max_iterations = models.PositiveIntegerField(
        default=8,
        help_text="Maximum reasoning loops permitted per user interaction.",
    )
    max_tool_calls = models.PositiveIntegerField(
        default=10,
        help_text="Maximum tool calls allowed per execution run.",
    )
    timeout_seconds = models.PositiveIntegerField(
        default=60,
        help_text="Execution timeout limit in seconds.",
    )
    enabled = models.BooleanField(default=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "agent_definitions_v2"
        verbose_name = "Agent Definition"
        verbose_name_plural = "Agent Definitions"

    def __str__(self) -> str:
        return f"{self.name} v{self.version} ({self.security_level})"


class AgentSession(BaseModel):
    """
    A persistent stateful conversation session for a user, optionally scoped
    to a specific patient context.
    """
    agent_definition = models.ForeignKey(
        AgentDefinition,
        on_delete=models.PROTECT,
        related_name="sessions",
        null=True,
        blank=True,
    )
    agent_type = models.CharField(
        max_length=50,
        choices=AgentRoleType.choices,
        default=AgentRoleType.DOCTOR,
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_agent_sessions",
    )
    role = models.CharField(max_length=50, default="DOCTOR", db_index=True)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_agent_sessions",
        help_text="Patient scope for clinical context minimization.",
    )
    title = models.CharField(max_length=255, default="New Consultation")
    status = models.CharField(
        max_length=50,
        choices=AgentSessionStatus.choices,
        default=AgentSessionStatus.CREATED,
        db_index=True,
    )
    provider = models.CharField(max_length=50, default="ollama", db_index=True)
    model = models.CharField(max_length=100, default="medllama3:latest")
    safety_status = models.CharField(max_length=50, default="SAFE", db_index=True)
    session_metadata = models.JSONField(default=dict, blank=True)
    last_interaction_at = models.DateTimeField(default=timezone.now, db_index=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "agent_sessions"
        verbose_name = "Agent Session"
        verbose_name_plural = "Agent Sessions"
        ordering = ["-last_interaction_at"]

    def __str__(self) -> str:
        return f"Session {self.id} - {self.title} ({self.status})"


class AgentExecution(BaseModel):
    """
    A single invocation run within an AgentSession.
    Tracks iterations, total duration, latency, tool calls, and completion status.
    """
    session = models.ForeignKey(
        AgentSession,
        on_delete=models.CASCADE,
        related_name="executions",
    )
    request_id = models.CharField(max_length=100, default="", blank=True, db_index=True)
    correlation_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    user_query = models.TextField()
    status = models.CharField(
        max_length=50,
        choices=AgentExecutionStatus.choices,
        default=AgentExecutionStatus.STARTED,
        db_index=True,
    )
    provider = models.CharField(max_length=50, default="ollama", db_index=True)
    model = models.CharField(max_length=100, default="medllama3:latest")
    iteration_count = models.PositiveIntegerField(default=0)
    tool_call_count = models.PositiveIntegerField(default=0)
    error_code = models.CharField(max_length=50, default="", blank=True)
    error_message = models.TextField(blank=True)
    latency_ms = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(default=timezone.now, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    final_output = models.TextField(blank=True)
    execution_trace = models.JSONField(
        default=list,
        help_text="Ordered steps executed: plan, tool call, observation, validation.",
    )

    class Meta:
        db_table = "agent_executions"
        verbose_name = "Agent Execution"
        verbose_name_plural = "Agent Executions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Execution {self.id} ({self.status})"


class AgentMessage(BaseModel):
    """
    Individual conversational turns or intermediate thoughts within a session/execution.
    """
    session = models.ForeignKey(
        AgentSession,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    execution = models.ForeignKey(
        AgentExecution,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messages",
    )
    role = models.CharField(
        max_length=30,
        choices=AgentMessageRole.choices,
        default=AgentMessageRole.USER,
        db_index=True,
    )
    content = models.TextField()
    tool_calls = models.JSONField(default=list, blank=True)
    tool_results = models.JSONField(default=list, blank=True)
    citations = models.JSONField(
        default=list,
        blank=True,
        help_text="Citations referencing clinical guidelines, records, or documents.",
    )
    grounding_status = models.CharField(max_length=50, default="GROUNDED", db_index=True)
    grounding_confidence = models.FloatField(
        default=1.0,
        help_text="0.0 to 1.0 confidence score representing factual grounding in context.",
    )
    requires_approval = models.BooleanField(default=False)
    message_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "agent_messages"
        verbose_name = "Agent Message"
        verbose_name_plural = "Agent Messages"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Message {self.id} [{self.role}]"


class AgentToolDefinition(BaseModel):
    """
    Catalog of available clinical and analytical tools with strict parameter schemas,
    role authorization boundaries, and risk levels.
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    display_name = models.CharField(max_length=150, default="")
    description = models.TextField()
    category = models.CharField(
        max_length=50,
        db_index=True,
        help_text="clinical, prediction, search, analytics, system",
    )
    version = models.CharField(max_length=20, default="1.0.0")
    parameters_schema = models.JSONField(
        default=dict,
        help_text="JSON schema specifying expected arguments."
    )
    returns_schema = models.JSONField(
        default=dict,
        help_text="JSON schema describing returned payload.",
    )
    risk_level = models.CharField(
        max_length=30,
        choices=AgentSecurityLevel.choices,
        default=AgentSecurityLevel.HIGH,
        db_index=True,
    )
    allowed_roles = models.JSONField(
        default=list,
        help_text="List of user roles permitted to execute this tool.",
    )
    patient_data_access = models.BooleanField(
        default=False,
        help_text="Accesses protected health information; patient scoping enforced.",
    )
    external_network_access = models.BooleanField(
        default=False,
        help_text="Requires external network access.",
    )
    approval_required = models.BooleanField(
        default=False,
        help_text="Requires human clinician sign-off prior to execution if true.",
    )
    enabled = models.BooleanField(default=True, db_index=True)
    timeout_seconds = models.PositiveIntegerField(default=15)
    rate_limit_per_minute = models.PositiveIntegerField(default=60)

    class Meta:
        db_table = "agent_tool_definitions"
        verbose_name = "Agent Tool Definition"
        verbose_name_plural = "Agent Tool Definitions"

    def __str__(self) -> str:
        return f"Tool {self.name} ({self.risk_level})"


class AgentToolExecution(BaseModel):
    """
    Immutable audit log for every single tool invocation.
    Stores calling user, patient scope, auth verification, arguments hash,
    execution latency, status, and result summary.
    """
    execution = models.ForeignKey(
        AgentExecution,
        on_delete=models.CASCADE,
        related_name="tool_executions",
    )
    tool_name = models.CharField(max_length=100, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="ai_agent_tool_calls",
    )
    role = models.CharField(max_length=50, default="DOCTOR", db_index=True)
    patient_scope = models.ForeignKey(
        "patients.Patient",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_agent_tool_calls",
    )
    authorization_decision = models.CharField(
        max_length=50,
        default="AUTHORIZED",
        db_index=True,
        help_text="AUTHORIZED, DENIED_ROLE, DENIED_PATIENT_SCOPE, DENIED_EMERGENCY",
    )
    execution_time_ms = models.FloatField(default=0.0)
    status = models.CharField(max_length=50, default="COMPLETED", db_index=True)
    failure_reason = models.TextField(default="", blank=True)
    correlation_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    idempotency_key = models.CharField(max_length=100, default="", blank=True, db_index=True)
    input_hash = models.CharField(max_length=64, default="", blank=True, db_index=True)
    sanitized_input = models.JSONField(default=dict)
    output_metadata = models.JSONField(default=dict)

    class Meta:
        db_table = "agent_tool_executions"
        verbose_name = "Agent Tool Execution"
        verbose_name_plural = "Agent Tool Executions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"ToolExecution {self.tool_name} ({self.status}) [{self.execution_time_ms}ms]"


class AgentApproval(BaseModel):
    """
    Human-in-the-loop review gate. High-risk actions (e.g. escalating care,
    ordering diagnostic panel recommendations, initiating emergency alerts)
    require a designated clinician to approve or reject.
    """
    execution = models.ForeignKey(
        AgentExecution,
        on_delete=models.CASCADE,
        related_name="approvals",
    )
    session = models.ForeignKey(
        AgentSession,
        on_delete=models.CASCADE,
        related_name="approvals",
        null=True,
        blank=True,
    )
    requested_action = models.CharField(max_length=150, db_index=True)
    reason = models.TextField(default="", help_text="AI agent rationale and clinical basis.")
    affected_patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_agent_approvals",
    )
    risk_level = models.CharField(
        max_length=30,
        choices=AgentSecurityLevel.choices,
        default=AgentSecurityLevel.CRITICAL,
        db_index=True,
    )
    evidence_summary = models.JSONField(
        default=dict,
        help_text="Key physiological observations and guidelines justifying request.",
    )
    action_payload = models.JSONField(
        default=dict,
        help_text="Detailed payload of the action waiting for human sign-off.",
    )
    approving_role = models.CharField(max_length=50, default="doctor", db_index=True)
    status = models.CharField(
        max_length=30,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.REQUESTED,
        db_index=True,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_ai_approvals",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    clinician_rationale = models.TextField(default="", blank=True)
    expires_at = models.DateTimeField(
        help_text="Timestamp when this pending approval request times out automatically."
    )

    class Meta:
        db_table = "agent_approvals"
        verbose_name = "Agent Approval"
        verbose_name_plural = "Agent Approvals"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Approval {self.id} [{self.requested_action}] - {self.status}"


class AgentMemory(BaseModel):
    """
    Key-value persistent memory for sessions and users, strictly segregated by
    data classification. Never stores patient PHI without strict classification and expiry.
    """
    session = models.ForeignKey(
        AgentSession,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="memories",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_agent_memories",
    )
    memory_type = models.CharField(
        max_length=50,
        choices=MemoryType.choices,
        default=MemoryType.SHORT_TERM_AGENT_STATE,
        db_index=True,
    )
    key = models.CharField(max_length=150, db_index=True)
    value = models.JSONField(help_text="Stored structured memory payload.")
    data_classification = models.CharField(
        max_length=30,
        choices=DataClassification.choices,
        default=DataClassification.LOW_SENSITIVITY,
        db_index=True,
    )
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "agent_memories"
        verbose_name = "Agent Memory"
        verbose_name_plural = "Agent Memories"
        indexes = [
            models.Index(fields=["user", "key"]),
            models.Index(fields=["session", "key"]),
        ]

    def __str__(self) -> str:
        return f"Memory {self.key} ({self.data_classification})"


class AgentProviderExecution(BaseModel):
    """
    Telemetry and audit record for LLM provider API invocations.
    Tracks latency, token usage, model version, provider fallback transitions,
    and status.
    """
    execution = models.ForeignKey(
        AgentExecution,
        on_delete=models.CASCADE,
        related_name="provider_executions",
    )
    provider = models.CharField(max_length=50, db_index=True)
    model_name = models.CharField(max_length=100, db_index=True)
    prompt_tokens = models.PositiveIntegerField(default=0)
    completion_tokens = models.PositiveIntegerField(default=0)
    latency_ms = models.PositiveIntegerField(default=0)
    fallback_triggered = models.BooleanField(default=False)
    fallback_reason = models.TextField(blank=True)
    status = models.CharField(max_length=30, default="SUCCESS", db_index=True)

    class Meta:
        db_table = "agent_provider_executions"
        verbose_name = "Agent Provider Execution"
        verbose_name_plural = "Agent Provider Executions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"ProviderExecution {self.provider}:{self.model_name} [{self.latency_ms}ms]"


class AgentSafetyEvent(BaseModel):
    """
    Immutable security log for any safety boundary violations, prompt injections,
    unauthorized tool access attempts, or PHI transmission alerts.
    """
    execution = models.ForeignKey(
        AgentExecution,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="safety_events",
    )
    session = models.ForeignKey(
        AgentSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="safety_events",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_safety_events",
    )
    event_type = models.CharField(
        max_length=50,
        choices=SafetyEventType.choices,
        db_index=True,
    )
    severity = models.CharField(max_length=20, default="HIGH", db_index=True)
    correlation_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    details = models.JSONField(default=dict)
    action_taken = models.CharField(
        max_length=100,
        default="BLOCKED",
        help_text="e.g. BLOCKED, SESSION_TERMINATED, FLAGGED_FOR_AUDIT",
    )

    class Meta:
        db_table = "agent_safety_events"
        verbose_name = "Agent Safety Event"
        verbose_name_plural = "Agent Safety Events"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"SafetyEvent {self.event_type} - {self.severity} ({self.action_taken})"


class AgentEvaluation(BaseModel):
    """
    Results from deterministic evaluation runs against benchmark datasets.
    Derives real metrics: refusal accuracy, tool accuracy, grounding, latency.
    """
    dataset_name = models.CharField(max_length=100, db_index=True)
    agent_definition = models.ForeignKey(
        AgentDefinition,
        on_delete=models.CASCADE,
        related_name="evaluations",
        null=True,
        blank=True,
    )
    model_name = models.CharField(max_length=100, default="medllama3:latest", db_index=True)
    tool_selection_accuracy = models.FloatField(
        default=0.0,
        help_text="Proportion of correct tools selected with valid parameters.",
    )
    safety_refusal_accuracy = models.FloatField(
        default=0.0,
        help_text="Proportion of adversarial/unauthorized queries successfully refused.",
    )
    hallucination_rate = models.FloatField(default=0.0)
    citation_accuracy = models.FloatField(default=1.0)
    latency_p95_ms = models.FloatField(default=0.0)
    total_test_cases = models.PositiveIntegerField(default=0)
    passed_test_cases = models.PositiveIntegerField(default=0)
    details = models.JSONField(default=dict)

    class Meta:
        db_table = "agent_evaluations"
        verbose_name = "Agent Evaluation"
        verbose_name_plural = "Agent Evaluations"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Eval {self.dataset_name} ({self.passed_test_cases}/{self.total_test_cases})"


class AgentFeedback(BaseModel):
    """
    Human clinician and user feedback on agent interactions.
    Used for RLHF auditing and model quality reviews.
    """
    session = models.ForeignKey(
        AgentSession,
        on_delete=models.CASCADE,
        related_name="feedback_records",
        null=True,
        blank=True,
    )
    execution = models.ForeignKey(
        AgentExecution,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="feedback_records",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_agent_feedback",
    )
    rating = models.CharField(
        max_length=30,
        choices=FeedbackRating.choices,
        db_index=True,
    )
    comments = models.TextField(blank=True)
    score = models.IntegerField(
        help_text="Numerical rating (1 to 5 stars).",
        default=5,
    )

    class Meta:
        db_table = "agent_feedback"
        verbose_name = "Agent Feedback"
        verbose_name_plural = "Agent Feedback"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Feedback {self.rating} (score={self.score}) by {self.user}"


class BrowserTaskState(models.TextChoices):
    PENDING = "PENDING", "Pending"
    VALIDATING = "VALIDATING", "Validating"
    AWAITING_APPROVAL = "AWAITING_APPROVAL", "Awaiting Approval"
    APPROVED = "APPROVED", "Approved"
    RUNNING = "RUNNING", "Running"
    VERIFYING = "VERIFYING", "Verifying"
    SUCCEEDED = "SUCCEEDED", "Succeeded"
    FAILED = "FAILED", "Failed"
    BLOCKED = "BLOCKED", "Blocked"
    CANCELLED = "CANCELLED", "Cancelled"
    TIMED_OUT = "TIMED_OUT", "Timed Out"
    REQUIRES_HUMAN_ACTION = "REQUIRES_HUMAN_ACTION", "Requires Human Action"


class VerificationStatus(models.TextChoices):
    UNVERIFIED = "UNVERIFIED", "Unverified"
    PASSED = "PASSED", "Passed"
    FAILED = "FAILED", "Failed"


class ApprovedDestination(BaseModel):
    """
    Allowlist for approved browser automation target domains.
    Default policy: DENY. Unknown domains are strictly BLOCKED.
    """
    domain = models.CharField(max_length=255, unique=True, db_index=True)
    purpose = models.TextField(help_text="Clinical or operational justification for this domain.")
    environment = models.CharField(max_length=50, default="PRODUCTION")
    owner = models.CharField(max_length=150, default="Security Administration")
    allowed_operations = models.JSONField(default=list, help_text="Allowed browser operations (e.g. READ_PUBLIC, NAVIGATE)")
    phi_allowed = models.BooleanField(default=False, help_text="Whether PHI transmission is permitted. Default DENY.")
    authentication_required = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "approved_destinations"
        verbose_name = "Approved Destination"
        verbose_name_plural = "Approved Destinations"
        ordering = ["domain"]

    def __str__(self) -> str:
        return f"{self.domain} [{'ACTIVE' if self.is_active else 'INACTIVE'}]"


class BrowserAgentTask(BaseModel):
    """
    Controlled operational browser agent task model.
    Authoritative store: Neon PostgreSQL.
    """
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="browser_agent_tasks",
    )
    role = models.CharField(max_length=50, default="ADMIN")
    goal = models.TextField(help_text="Natural-language goal for controlled browser execution.")
    destination_url = models.URLField(max_length=1000)
    destination_domain = models.CharField(max_length=255, db_index=True)
    environment = models.CharField(max_length=50, default="PRODUCTION")
    risk_level = models.CharField(
        max_length=30,
        choices=ToolRiskLevel.choices,
        default=ToolRiskLevel.LOW,
        db_index=True,
    )
    phi_classification = models.CharField(
        max_length=50,
        choices=DataClassification.choices,
        default=DataClassification.PUBLIC,
        db_index=True,
    )
    approval_status = models.CharField(
        max_length=30,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        db_index=True,
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_browser_tasks",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default="")
    execution_status = models.CharField(
        max_length=35,
        choices=BrowserTaskState.choices,
        default=BrowserTaskState.PENDING,
        db_index=True,
    )
    verification_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.UNVERIFIED,
        db_index=True,
    )
    failure_reason = models.TextField(blank=True, default="")
    audit_reference = models.CharField(max_length=100, blank=True, default="", db_index=True)
    independent_verification_rules = models.JSONField(
        default=dict,
        blank=True,
        help_text="Programmatic rules to independently verify the outcome (e.g., expected text, selector present).",
    )
    steps_log = models.JSONField(default=list, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "browser_agent_tasks"
        verbose_name = "Browser Agent Task"
        verbose_name_plural = "Browser Agent Tasks"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"BrowserTask {self.id} [{self.execution_status}] -> {self.destination_domain}"


class AgentKillSwitchState(BaseModel):
    """
    Emergency operational kill switch for AI agent execution.
    When active, all agent executions are instantly halted with AGENT_DISABLED.
    """
    is_active = models.BooleanField(default=False, help_text="True if emergency kill switch is activated.")
    activated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activated_kill_switches",
    )
    reason = models.TextField(blank=True, default="")
    activated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "agent_kill_switch_state"
        verbose_name = "Agent Kill Switch State"
        verbose_name_plural = "Agent Kill Switch States"

    def __str__(self) -> str:
        return f"KillSwitch [{'ACTIVATED' if self.is_active else 'INACTIVE'}]"

