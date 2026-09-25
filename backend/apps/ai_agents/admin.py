from django.contrib import admin
from apps.ai_agents.models import (
    AgentApproval,
    AgentDefinition,
    AgentEvaluation,
    AgentExecution,
    AgentFeedback,
    AgentKillSwitchState,
    AgentMemory,
    AgentMessage,
    AgentProviderExecution,
    AgentSafetyEvent,
    AgentSession,
    AgentToolDefinition,
    AgentToolExecution,
    BrowserAgentAction,
    BrowserAgentAuditEvent,
    BrowserAgentRun,
    BrowserAgentTask,
    BrowserArtifact,
    BrowserDestination,
    BrowserTaskPolicy,
    BrowserVerification,
)


@admin.register(AgentDefinition)
class AgentDefinitionAdmin(admin.ModelAdmin):
    list_display = ["slug", "name", "version", "security_level", "enabled", "updated_at"]
    list_filter = ["security_level", "enabled"]
    search_fields = ["slug", "name"]


@admin.register(AgentSession)
class AgentSessionAdmin(admin.ModelAdmin):
    list_display = ["id", "agent_type", "user", "role", "patient", "status", "created_at"]
    list_filter = ["status", "role", "agent_type"]
    search_fields = ["id", "user__email", "patient__mrn"]


@admin.register(AgentExecution)
class AgentExecutionAdmin(admin.ModelAdmin):
    list_display = ["id", "session", "status", "iteration_count", "tool_call_count", "latency_ms", "started_at"]
    list_filter = ["status", "provider"]
    search_fields = ["request_id", "correlation_id"]


@admin.register(AgentToolDefinition)
class AgentToolDefinitionAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "risk_level", "patient_data_access", "approval_required", "enabled"]
    list_filter = ["category", "risk_level", "approval_required", "enabled"]
    search_fields = ["name", "description"]


@admin.register(AgentToolExecution)
class AgentToolExecutionAdmin(admin.ModelAdmin):
    list_display = ["tool_name", "user", "role", "authorization_decision", "status", "execution_time_ms", "created_at"]
    list_filter = ["status", "authorization_decision", "tool_name"]
    search_fields = ["tool_name", "correlation_id"]


@admin.register(AgentApproval)
class AgentApprovalAdmin(admin.ModelAdmin):
    list_display = ["requested_action", "affected_patient", "risk_level", "status", "reviewed_by", "created_at"]
    list_filter = ["status", "risk_level", "approving_role"]
    search_fields = ["requested_action", "reason"]


@admin.register(AgentSafetyEvent)
class AgentSafetyEventAdmin(admin.ModelAdmin):
    list_display = ["event_type", "severity", "user", "correlation_id", "created_at"]
    list_filter = ["event_type", "severity"]
    search_fields = ["correlation_id"]


@admin.register(AgentEvaluation)
class AgentEvaluationAdmin(admin.ModelAdmin):
    list_display = ["dataset_name", "model_name", "tool_selection_accuracy", "safety_refusal_accuracy", "passed_test_cases", "total_test_cases", "created_at"]
    list_filter = ["model_name"]


@admin.register(AgentFeedback)
class AgentFeedbackAdmin(admin.ModelAdmin):
    list_display = ["execution", "user", "rating", "created_at"]
    list_filter = ["rating"]


@admin.register(BrowserDestination)
class BrowserDestinationAdmin(admin.ModelAdmin):
    list_display = ["domain", "scheme", "port", "sensitivity", "approval_required", "is_active", "owner"]
    list_filter = ["is_active", "sensitivity", "approval_required"]
    search_fields = ["domain", "purpose", "owner"]


@admin.register(BrowserTaskPolicy)
class BrowserTaskPolicyAdmin(admin.ModelAdmin):
    list_display = ["name", "task_type", "destination", "required_role", "approval_required", "max_steps", "enabled"]
    list_filter = ["enabled", "approval_required", "required_role"]
    search_fields = ["name", "task_type", "destination"]


@admin.register(BrowserAgentTask)
class BrowserAgentTaskAdmin(admin.ModelAdmin):
    list_display = ["id", "destination_domain", "requested_by", "role", "execution_status", "verification_status", "provider", "created_at"]
    list_filter = ["execution_status", "verification_status", "provider", "risk_level"]
    search_fields = ["destination_domain", "goal", "audit_reference"]


@admin.register(BrowserAgentRun)
class BrowserAgentRunAdmin(admin.ModelAdmin):
    list_display = ["id", "task", "status", "steps_count", "duration_ms", "started_at", "completed_at"]
    list_filter = ["status"]


@admin.register(BrowserAgentAction)
class BrowserAgentActionAdmin(admin.ModelAdmin):
    list_display = ["task", "step_index", "operation", "target_index", "target_label", "is_mutation", "status"]
    list_filter = ["operation", "is_mutation", "status"]


@admin.register(BrowserVerification)
class BrowserVerificationAdmin(admin.ModelAdmin):
    list_display = ["task", "status", "verified_at"]
    list_filter = ["status"]


@admin.register(BrowserArtifact)
class BrowserArtifactAdmin(admin.ModelAdmin):
    list_display = ["name", "artifact_type", "task", "phi_classification", "size_bytes", "created_at"]
    list_filter = ["artifact_type", "phi_classification"]


@admin.register(BrowserAgentAuditEvent)
class BrowserAgentAuditEventAdmin(admin.ModelAdmin):
    list_display = ["event_type", "task", "actor", "destination", "security_decision", "timestamp"]
    list_filter = ["event_type", "security_decision"]
    search_fields = ["destination", "details"]


@admin.register(AgentKillSwitchState)
class AgentKillSwitchStateAdmin(admin.ModelAdmin):
    list_display = ["is_active", "activated_by", "reason", "activated_at"]
