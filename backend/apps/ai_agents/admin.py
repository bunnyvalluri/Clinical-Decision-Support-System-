from django.contrib import admin
from apps.ai_agents.models import (
    AgentDefinition,
    AgentSession,
    AgentExecution,
    AgentMessage,
    AgentToolDefinition,
    AgentToolExecution,
    AgentApproval,
    AgentMemory,
    AgentProviderExecution,
    AgentSafetyEvent,
    AgentEvaluation,
    AgentFeedback,
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
