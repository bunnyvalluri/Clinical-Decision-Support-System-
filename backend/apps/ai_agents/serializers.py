from rest_framework import serializers
from apps.ai_agents.models import (
    AgentDefinition,
    AgentSession,
    AgentExecution,
    AgentMessage,
    AgentToolDefinition,
    AgentToolExecution,
    AgentApproval,
    AgentMemory,
    AgentSafetyEvent,
    AgentEvaluation,
    AgentFeedback,
)


class AgentDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentDefinition
        fields = [
            "id",
            "slug",
            "name",
            "description",
            "version",
            "allowed_roles",
            "allowed_tools",
            "security_level",
            "max_iterations",
            "max_tool_calls",
            "timeout_seconds",
            "enabled",
            "created_at",
            "updated_at",
        ]


class AgentSessionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)

    class Meta:
        model = AgentSession
        fields = [
            "id",
            "agent_type",
            "user",
            "user_email",
            "role",
            "patient",
            "patient_mrn",
            "status",
            "provider",
            "model",
            "safety_status",
            "created_at",
            "updated_at",
            "expires_at",
        ]
        read_only_fields = ["user", "role", "created_at", "updated_at"]


class AgentExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentExecution
        fields = [
            "id",
            "session",
            "request_id",
            "correlation_id",
            "status",
            "iteration_count",
            "tool_call_count",
            "provider",
            "model",
            "error_code",
            "error_message",
            "latency_ms",
            "started_at",
            "completed_at",
        ]


class AgentMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentMessage
        fields = [
            "id",
            "session",
            "execution",
            "role",
            "content",
            "tool_calls",
            "tool_results",
            "citations",
            "grounding_status",
            "grounding_confidence",
            "requires_approval",
            "created_at",
        ]


class AgentToolDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentToolDefinition
        fields = [
            "id",
            "name",
            "description",
            "category",
            "version",
            "risk_level",
            "allowed_roles",
            "patient_data_access",
            "external_network_access",
            "approval_required",
            "enabled",
            "timeout_seconds",
            "rate_limit_per_minute",
        ]


class AgentToolExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentToolExecution
        fields = [
            "id",
            "execution",
            "tool_name",
            "user",
            "role",
            "patient_scope",
            "authorization_decision",
            "execution_time_ms",
            "status",
            "failure_reason",
            "correlation_id",
            "created_at",
        ]


class AgentApprovalSerializer(serializers.ModelSerializer):
    reviewed_by_name = serializers.CharField(source="reviewed_by.get_full_name", read_only=True)
    patient_mrn = serializers.CharField(source="affected_patient.mrn", read_only=True)

    class Meta:
        model = AgentApproval
        fields = [
            "id",
            "execution",
            "session",
            "requested_action",
            "reason",
            "affected_patient",
            "patient_mrn",
            "risk_level",
            "evidence_summary",
            "action_payload",
            "approving_role",
            "status",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "clinician_rationale",
            "created_at",
            "expires_at",
        ]
        read_only_fields = ["status", "reviewed_by", "reviewed_at", "created_at"]


class AgentMemorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentMemory
        fields = [
            "id",
            "session",
            "user",
            "memory_type",
            "key",
            "value",
            "data_classification",
            "expires_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]


class AgentSafetyEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentSafetyEvent
        fields = [
            "id",
            "execution",
            "event_type",
            "severity",
            "details",
            "correlation_id",
            "user",
            "created_at",
        ]


class AgentEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentEvaluation
        fields = [
            "id",
            "dataset_name",
            "model_name",
            "tool_selection_accuracy",
            "safety_refusal_accuracy",
            "hallucination_rate",
            "citation_accuracy",
            "latency_p95_ms",
            "total_test_cases",
            "passed_test_cases",
            "details",
            "created_at",
        ]


class AgentFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentFeedback
        fields = [
            "id",
            "execution",
            "user",
            "rating",
            "comments",
            "created_at",
        ]
        read_only_fields = ["user", "created_at"]
