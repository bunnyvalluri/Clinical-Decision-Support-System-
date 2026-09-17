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


class AgentTask(models.Model):
    """
    Authoritative PostgreSQL entity for Ruflo agent task queuing,
    state transitions, retry tracking, and human-in-the-loop gates.
    """

    class TaskPriority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class TaskStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        QUEUED = "QUEUED", "Queued"
        RUNNING = "RUNNING", "Running"
        WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL", "Waiting for Approval"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"
        TIMED_OUT = "TIMED_OUT", "Timed Out"
        REJECTED = "REJECTED", "Rejected"

    class ApprovalStatus(models.TextChoices):
        NONE = "NONE", "Not Required"
        PENDING = "PENDING", "Pending Approval"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_id = models.CharField(max_length=64, db_index=True)
    agent_type = models.CharField(max_length=64, db_index=True)
    task_type = models.CharField(max_length=64, db_index=True)
    priority = models.CharField(
        max_length=16,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM,
    )
    status = models.CharField(
        max_length=32,
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.PositiveSmallIntegerField(default=0)
    timeout_seconds = models.PositiveIntegerField(default=60)
    input_reference = models.JSONField(default=dict, blank=True)
    output_reference = models.JSONField(default=dict, blank=True)
    approval_required = models.BooleanField(default=False, db_index=True)
    approval_status = models.CharField(
        max_length=16,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.NONE,
    )
    error_code = models.CharField(max_length=64, blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_agent_tasks",
    )

    class Meta:
        db_table = "agent_tasks"
        ordering = ["-created_at"]
        verbose_name = "Ruflo Agent Task"
        verbose_name_plural = "Ruflo Agent Tasks"

    def __str__(self) -> str:
        return f"AgentTask {self.id} [{self.agent_type}:{self.task_type}] - {self.status}"


class AIAgentTrace(models.Model):
    """
    Immutable audit trace for every granular Ruflo agent invocation step.
    Captures input/output summaries, tool calls, latencies, and correlation metadata.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent_run_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    workflow_id = models.CharField(max_length=64, db_index=True)
    request_id = models.CharField(max_length=64, blank=True, default="", db_index=True)
    correlation_id = models.CharField(max_length=64, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="agent_traces",
    )
    role = models.CharField(max_length=32, default="SYSTEM")
    agent_name = models.CharField(max_length=64, db_index=True)
    agent_version = models.CharField(max_length=32, default="3.42.0")
    tool_calls = models.JSONField(default=list, help_text="List of tools executed in this trace step")
    input_summary = models.TextField(blank=True, default="")
    output_summary = models.TextField(blank=True, default="")
    status = models.CharField(max_length=32, default="COMPLETED")
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    latency_ms = models.FloatField(default=0.0)
    failure_reason = models.TextField(blank=True, default="")
    approval_state = models.CharField(max_length=32, default="NOT_REQUIRED")

    class Meta:
        db_table = "ai_agent_traces"
        ordering = ["-start_time"]
        verbose_name = "AI Agent Trace"
        verbose_name_plural = "AI Agent Traces"

    def __str__(self) -> str:
        return f"AIAgentTrace {self.agent_name} ({self.status}) [{self.workflow_id}]"


class AIApprovalGate(models.Model):
    """
    Human-in-the-loop approval record for patient-impacting clinical recommendations,
    production model promotions, and automated retraining workflows.
    """

    class ActionType(models.TextChoices):
        CLINICAL_RECOMMENDATION = "CLINICAL_RECOMMENDATION", "Clinical Recommendation"
        MODEL_PROMOTION = "MODEL_PROMOTION", "Model Promotion"
        RETRAINING_TRIGGER = "RETRAINING_TRIGGER", "Retraining Trigger"

    class Decision(models.TextChoices):
        PENDING = "PENDING", "Pending Decision"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action_type = models.CharField(max_length=32, choices=ActionType.choices)
    workflow_id = models.CharField(max_length=64, db_index=True)
    agent_task = models.ForeignKey(
        AgentTask,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_gates",
    )
    requested_by_agent = models.CharField(max_length=64)
    model_version = models.CharField(max_length=64, blank=True, default="")
    justification = models.TextField()
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_ai_gates",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    decision = models.CharField(
        max_length=16,
        choices=Decision.choices,
        default=Decision.PENDING,
        db_index=True,
    )
    rejection_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_approval_gates"
        ordering = ["-created_at"]
        verbose_name = "AI Approval Gate"
        verbose_name_plural = "AI Approval Gates"

    def __str__(self) -> str:
        return f"ApprovalGate {self.action_type} [{self.decision}] by {self.requested_by_agent}"


class AgentMemoryRecord(models.Model):
    """
    Namespace-segregated agent memory record.
    Strictly forbids storage of patient PHI.
    """

    class Namespace(models.TextChoices):
        ENGINEERING = "engineering", "Engineering"
        AGENT_COORDINATION = "agent_coordination", "Agent Coordination"
        PROJECT_KNOWLEDGE = "project_knowledge", "Project Knowledge"
        AI_EVALUATIONS = "ai_evaluations", "AI Evaluations"
        CLINICAL_GUIDELINES = "clinical_guidelines", "Clinical Guidelines"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    namespace = models.CharField(max_length=32, choices=Namespace.choices, db_index=True)
    key = models.CharField(max_length=255, db_index=True)
    value = models.JSONField(default=dict)
    provenance = models.CharField(max_length=255, blank=True, default="")
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "agent_memory_records"
        unique_together = ("namespace", "key")
        ordering = ["-created_at"]
        verbose_name = "Agent Memory Record"
        verbose_name_plural = "Agent Memory Records"

    def __str__(self) -> str:
        return f"[{self.namespace}] {self.key}"


# ===========================================================================
# Extended AI Platform Models (Prompt 31 — Awesome-LLM-Apps Integration)
# ===========================================================================

class AIModelConfig(models.Model):
    """
    Authoritative model configurations supporting multi-provider abstraction.
    """

    class Provider(models.TextChoices):
        OPENAI = "OPENAI", "OpenAI"
        ANTHROPIC = "ANTHROPIC", "Anthropic"
        GEMINI = "GEMINI", "Google Gemini"
        LOCAL = "LOCAL", "Local / Ollama"
        OPENSOURCE = "OPENSOURCE", "Open Source / vLLM"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.CharField(max_length=32, choices=Provider.choices, default=Provider.OPENAI, db_index=True)
    model_name = models.CharField(max_length=128, unique=True, db_index=True)
    version = models.CharField(max_length=32, default="1.0")
    temperature = models.FloatField(default=0.1)
    max_tokens = models.PositiveIntegerField(default=2048)
    context_window = models.PositiveIntegerField(default=128000)
    capabilities = models.JSONField(default=list, help_text="List of supported capabilities ['chat', 'tools', 'vision']")
    supports_tools = models.BooleanField(default=True)
    supports_vision = models.BooleanField(default=False)
    supports_structured_output = models.BooleanField(default=True)
    supports_streaming = models.BooleanField(default=True)
    cost_per_input_token = models.DecimalField(max_digits=12, decimal_places=8, default=0.0)
    cost_per_output_token = models.DecimalField(max_digits=12, decimal_places=8, default=0.0)
    is_active = models.BooleanField(default=True, db_index=True)
    is_default = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ai_model_configs"
        ordering = ["provider", "model_name"]

    def __str__(self) -> str:
        return f"{self.provider} - {self.model_name} (active: {self.is_active})"


class AIConversation(models.Model):
    """
    Stateful conversational session partitioned by user and optional patient context.
    """

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ARCHIVED = "ARCHIVED", "Archived"
        CLOSED = "CLOSED", "Closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_conversations",
        db_index=True,
    )
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="patient_ai_conversations",
        db_index=True,
    )
    role = models.CharField(max_length=32, default="DOCTOR", db_index=True)
    title = models.CharField(max_length=256, default="New Consultation")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        db_table = "ai_conversations"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"AIConversation {self.id} [{self.role}] - {self.title[:30]}"


class AIMessage(models.Model):
    """
    Individual message in an AI conversation with grounding and citation audit.
    """

    class MessageRole(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"
        SYSTEM = "system", "System"
        TOOL = "tool", "Tool"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.CASCADE,
        related_name="messages",
        db_index=True,
    )
    role = models.CharField(max_length=16, choices=MessageRole.choices, default=MessageRole.USER)
    content = models.TextField()
    model_name = models.CharField(max_length=128, blank=True, default="")
    citations = models.JSONField(default=list, blank=True)
    grounding_status = models.CharField(max_length=32, default="GROUNDED")
    grounding_confidence = models.FloatField(default=1.0)
    tool_calls = models.JSONField(default=list, blank=True)
    token_count = models.PositiveIntegerField(default=0)
    latency_ms = models.FloatField(default=0.0)
    is_error = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "ai_messages"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"AIMessage {self.id} ({self.role}) in {self.conversation_id}"


class AIExecution(models.Model):
    """
    Granular execution tracking for an agent workflow run.
    """

    class State(models.TextChoices):
        CREATED = "CREATED", "Created"
        PLANNING = "PLANNING", "Planning"
        EXECUTING = "EXECUTING", "Executing"
        WAITING_FOR_TOOL = "WAITING_FOR_TOOL", "Waiting for Tool"
        WAITING_FOR_REVIEW = "WAITING_FOR_REVIEW", "Waiting for Review"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"
        ABORTED = "ABORTED", "Aborted"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="executions",
        db_index=True,
    )
    correlation_id = models.CharField(max_length=64, db_index=True)
    agent_type = models.CharField(max_length=64, db_index=True)
    state = models.CharField(max_length=32, choices=State.choices, default=State.CREATED, db_index=True)
    input_payload = models.JSONField(default=dict, blank=True)
    output_payload = models.JSONField(default=dict, blank=True)
    total_tokens = models.PositiveIntegerField(default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.0)
    latency_ms = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "ai_executions"
        ordering = ["-created_at"]


class AIToolCall(models.Model):
    """
    Immutable log of every tool call dispatched during agent execution.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    execution = models.ForeignKey(
        AIExecution,
        on_delete=models.CASCADE,
        related_name="tool_calls",
        null=True,
        blank=True,
        db_index=True,
    )
    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tool_calls",
    )
    tool_name = models.CharField(max_length=128, db_index=True)
    input_arguments = models.JSONField(default=dict, blank=True)
    output_result = models.JSONField(default=dict, blank=True)
    is_success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, default="")
    latency_ms = models.FloatField(default=0.0)
    idempotency_key = models.CharField(max_length=64, blank=True, default="", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "ai_tool_calls"
        ordering = ["-created_at"]


class AIMemory(models.Model):
    """
    Long-term and short-term memory partition. PHI is strictly forbidden.
    """

    class Classification(models.TextChoices):
        PUBLIC = "PUBLIC", "Public"
        LOW_SENSITIVITY = "LOW_SENSITIVITY", "Low Sensitivity"
        SENSITIVE = "SENSITIVE", "Sensitive"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="ai_memories",
        db_index=True,
    )
    owner_type = models.CharField(max_length=32, default="USER", db_index=True)
    owner_id = models.CharField(max_length=64, default="", db_index=True)
    namespace = models.CharField(max_length=64, db_index=True)
    key = models.CharField(max_length=255, db_index=True)
    content = models.JSONField(default=dict)
    classification = models.CharField(max_length=32, choices=Classification.choices, default=Classification.LOW_SENSITIVITY)
    source = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    status = models.CharField(max_length=16, default="ACTIVE", db_index=True)

    class Meta:
        db_table = "ai_memories"
        unique_together = ("owner_id", "namespace", "key")
        ordering = ["-created_at"]


class PromptTemplate(models.Model):
    """
    Version-controlled prompt template registry.
    """

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        APPROVED = "APPROVED", "Approved"
        DEPRECATED = "DEPRECATED", "Deprecated"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128, db_index=True)
    version = models.CharField(max_length=32, default="1.0")
    template_content = models.TextField()
    purpose = models.TextField(blank=True, default="")
    model_compatibility = models.JSONField(default=list)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.APPROVED, db_index=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_prompts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ai_prompt_templates"
        unique_together = ("name", "version")
        ordering = ["name", "-version"]


class KnowledgeSource(models.Model):
    """
    Registry of approved institutional knowledge sources.
    """

    class SourceType(models.TextChoices):
        CLINICAL_GUIDELINE = "CLINICAL_GUIDELINE", "Clinical Guideline"
        INSTITUTIONAL_POLICY = "INSTITUTIONAL_POLICY", "Institutional Policy"
        RESEARCH_TRIAL = "RESEARCH_TRIAL", "Research Trial"
        FORMULARY = "FORMULARY", "Formulary"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=256, unique=True)
    source_type = models.CharField(max_length=32, choices=SourceType.choices, default=SourceType.CLINICAL_GUIDELINE)
    organization = models.CharField(max_length=256)
    trust_level = models.CharField(max_length=32, default="OFFICIAL_CONSENSUS")
    url_or_doi = models.CharField(max_length=512, blank=True, default="")
    is_approved = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_knowledge_sources"
        ordering = ["name"]


class KnowledgeDocumentVersion(models.Model):
    """
    Versioned instance of a clinical knowledge document with SHA-256 fingerprint.
    """

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        APPROVED = "APPROVED", "Approved"
        EXPIRED = "EXPIRED", "Expired"
        REJECTED = "REJECTED", "Rejected"
        ARCHIVED = "ARCHIVED", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        KnowledgeDocument,
        on_delete=models.CASCADE,
        related_name="versions",
        db_index=True,
    )
    version = models.CharField(max_length=32, default="1.0")
    content_hash = models.CharField(max_length=64, help_text="SHA-256 digest of verified text")
    classification = models.CharField(max_length=32, default="PUBLIC")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.APPROVED, db_index=True)
    published_date = models.DateField(null=True, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    expiration_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_knowledge_document_versions"
        unique_together = ("document", "version")


class KnowledgeChunk(models.Model):
    """
    Searchable semantic chunk indexed with lexical tsvector and vector embeddings.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_version = models.ForeignKey(
        KnowledgeDocumentVersion,
        on_delete=models.CASCADE,
        related_name="chunks",
        null=True,
        blank=True,
        db_index=True,
    )
    guideline_id = models.CharField(max_length=64, db_index=True)
    chunk_index = models.PositiveIntegerField(default=0)
    section_header = models.CharField(max_length=256, blank=True, default="")
    chunk_text = models.TextField()
    token_count = models.PositiveIntegerField(default=0)
    embedding_model = models.CharField(max_length=64, default="text-embedding-3-small")
    embedding_dimensions = models.PositiveIntegerField(default=1536)
    embedding_vector = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_knowledge_chunks"
        ordering = ["guideline_id", "chunk_index"]


class RAGQuery(models.Model):
    """
    Audit log of RAG retrieval queries, rewrites, and relevance evaluations.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rag_queries",
        db_index=True,
    )
    correlation_id = models.CharField(max_length=64, db_index=True)
    query_text = models.TextField()
    rewritten_query = models.TextField(blank=True, default="")
    retrieval_strategy = models.CharField(max_length=32, default="HYBRID_RRF")
    relevance_score = models.FloatField(default=1.0)
    grounding_status = models.CharField(max_length=32, default="GROUNDED")
    latency_ms = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "ai_rag_queries"
        ordering = ["-created_at"]


class RAGRetrieval(models.Model):
    """
    Mapping between a RAG query and retrieved document chunks with reciprocal ranks.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    query = models.ForeignKey(
        RAGQuery,
        on_delete=models.CASCADE,
        related_name="retrievals",
        db_index=True,
    )
    chunk = models.ForeignKey(
        KnowledgeChunk,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="retrieval_instances",
    )
    guideline_id = models.CharField(max_length=64)
    lexical_rank = models.PositiveIntegerField(default=0)
    vector_rank = models.PositiveIntegerField(default=0)
    rrf_score = models.FloatField(default=0.0)
    rerank_score = models.FloatField(default=0.0)
    is_used_in_context = models.BooleanField(default=True)

    class Meta:
        db_table = "ai_rag_retrievals"


class AIEvaluation(models.Model):
    """
    Automated evaluation benchmark runs tracking grounding, citation precision, and safety.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    benchmark_name = models.CharField(max_length=128, db_index=True)
    model_name = models.CharField(max_length=128, db_index=True)
    total_cases = models.PositiveIntegerField(default=0)
    passed_cases = models.PositiveIntegerField(default=0)
    grounding_accuracy = models.FloatField(default=0.0)
    citation_precision = models.FloatField(default=0.0)
    safety_compliance_rate = models.FloatField(default=0.0)
    avg_latency_ms = models.FloatField(default=0.0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.0)
    summary_metrics = models.JSONField(default=dict)
    evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_evaluations",
    )
    evaluated_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "ai_evaluations"
        ordering = ["-evaluated_at"]


class AgentDefinition(models.Model):
    """
    Declarative specification of an agent's role, action tier, and tool boundaries.
    """

    class ActionLevel(models.TextChoices):
        LEVEL_0 = "LEVEL_0", "Level 0: Read-Only Informational"
        LEVEL_1 = "LEVEL_1", "Level 1: Analysis & Aggregation"
        LEVEL_2 = "LEVEL_2", "Level 2: Draft Preparation"
        LEVEL_3 = "LEVEL_3", "Level 3: Human-Approved Action"
        LEVEL_4 = "LEVEL_4", "Level 4: Restricted Admin Action"
        LEVEL_5 = "LEVEL_5", "Level 5: Forbidden Autonomous Action"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent_type = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=128)
    description = models.TextField()
    action_level = models.CharField(max_length=16, choices=ActionLevel.choices, default=ActionLevel.LEVEL_1)
    allowed_roles = models.JSONField(default=list)
    allowed_tools = models.JSONField(default=list)
    default_model = models.CharField(max_length=128, default="claude-3-5-sonnet")
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "ai_agent_definitions"


class MCPServer(models.Model):
    """
    Registry of approved Model Context Protocol servers.
    """

    class TrustLevel(models.TextChoices):
        SANDBOXED = "SANDBOXED", "Sandboxed Local Network"
        VERIFIED_EXTERNAL = "VERIFIED_EXTERNAL", "Verified External"
        RESTRICTED = "RESTRICTED", "Restricted Admin Only"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128, unique=True, db_index=True)
    endpoint_url = models.CharField(max_length=512)
    trust_level = models.CharField(max_length=32, choices=TrustLevel.choices, default=TrustLevel.SANDBOXED)
    allowed_roles = models.JSONField(default=list)
    allowed_agents = models.JSONField(default=list)
    approved_tools = models.JSONField(default=list)
    is_active = models.BooleanField(default=True, db_index=True)
    timeout_seconds = models.PositiveIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    last_health_check = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "ai_mcp_servers"


class MCPTool(models.Model):
    """
    Catalog of approved tools hosted on an MCP server.
    """

    class RiskLevel(models.TextChoices):
        LOW = "LOW", "Low Risk"
        MEDIUM = "MEDIUM", "Medium Risk"
        HIGH = "HIGH", "High Risk"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    server = models.ForeignKey(
        MCPServer,
        on_delete=models.CASCADE,
        related_name="tools",
        db_index=True,
    )
    name = models.CharField(max_length=128, db_index=True)
    description = models.TextField()
    input_schema = models.JSONField(default=dict)
    output_schema = models.JSONField(default=dict)
    required_permissions = models.JSONField(default=list)
    risk_level = models.CharField(max_length=16, choices=RiskLevel.choices, default=RiskLevel.LOW)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "ai_mcp_tools"
        unique_together = ("server", "name")


class AIAuditEvent(models.Model):
    """
    Immutable, PHI-redacted audit log for every AI transaction across the platform.
    """

    class EventType(models.TextChoices):
        CHAT_REQUEST = "CHAT_REQUEST", "Chat Request"
        TOOL_EXECUTION = "TOOL_EXECUTION", "Tool Execution"
        SAFETY_FLAG = "SAFETY_FLAG", "Safety Flag"
        APPROVAL_DECISION = "APPROVAL_DECISION", "Approval Decision"
        RAG_QUERY = "RAG_QUERY", "RAG Query"
        KILL_SWITCH = "KILL_SWITCH", "Kill Switch Toggle"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    correlation_id = models.CharField(max_length=64, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_audit_events",
        db_index=True,
    )
    role = models.CharField(max_length=32, default="SYSTEM")
    event_type = models.CharField(max_length=32, choices=EventType.choices, db_index=True)
    agent_type = models.CharField(max_length=64, blank=True, default="")
    model_name = models.CharField(max_length=128, blank=True, default="")
    payload_summary = models.TextField(blank=True, default="", help_text="Redacted summary without PHI")
    safety_verdict = models.CharField(max_length=32, default="PASSED")
    latency_ms = models.FloatField(default=0.0)
    cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "ai_audit_events"
        ordering = ["-created_at"]


# Compatibility aliases for requirements
AITrace = AIAgentTrace
AgentExecution = AgentTask
AIApproval = AIApprovalGate
