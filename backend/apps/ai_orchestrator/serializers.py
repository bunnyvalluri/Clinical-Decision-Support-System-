"""
Serializers for Clinical AI Orchestration, Deterministic Rules,
Knowledge Retrieval, and Human-in-the-Loop Decisions.
"""
from rest_framework import serializers
from .models import (
    AgentMemoryRecord,
    AgentTask,
    AIAgentTrace,
    AIApprovalGate,
    AIInteraction,
    ClinicalRuleEvaluation,
    KnowledgeDocument,
    ModelDriftRecord,
)


class OrchestratorEvaluationRequestSerializer(serializers.Serializer):
    patient_id = serializers.UUIDField(required=True)
    query = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    model_name = serializers.CharField(required=False, allow_blank=True, max_length=128)
    correlation_id = serializers.CharField(required=False, allow_blank=True, max_length=64)


class ClinicalRulesEvaluateSerializer(serializers.Serializer):
    respiratory_rate = serializers.FloatField(required=False, min_value=1, max_value=80)
    systolic_bp = serializers.FloatField(required=False, min_value=30, max_value=300)
    diastolic_bp = serializers.FloatField(required=False, min_value=20, max_value=200)
    heart_rate = serializers.IntegerField(required=False, min_value=20, max_value=300)
    temperature = serializers.FloatField(required=False, min_value=25.0, max_value=45.0)
    oxygen_saturation = serializers.FloatField(required=False, min_value=40.0, max_value=100.0)
    glucose = serializers.FloatField(required=False, min_value=10.0, max_value=1000.0)
    potassium = serializers.FloatField(required=False, min_value=1.0, max_value=12.0)
    creatinine = serializers.FloatField(required=False, min_value=0.1, max_value=30.0)
    lactic_acid = serializers.FloatField(required=False, min_value=0.1, max_value=30.0)
    altered_mental_status = serializers.BooleanField(required=False, default=False)
    glasgow_coma_scale = serializers.IntegerField(required=False, min_value=3, max_value=15)


class KnowledgeQuerySerializer(serializers.Serializer):
    query = serializers.CharField(required=True, min_length=2, max_length=500)
    clinical_context = serializers.DictField(required=False, default=dict)
    top_k = serializers.IntegerField(required=False, min_value=1, max_value=10, default=3)


class HumanReviewDecisionSerializer(serializers.Serializer):
    interaction_id = serializers.UUIDField(required=True)
    decision = serializers.ChoiceField(choices=AIInteraction.HumanDecision.choices, required=True)
    rationale = serializers.CharField(required=True, min_length=5, max_length=2000)


class AIInteractionSerializer(serializers.ModelSerializer):
    clinician_name = serializers.SerializerMethodField()

    class Meta:
        model = AIInteraction
        fields = [
            "id",
            "patient",
            "clinician",
            "clinician_name",
            "correlation_id",
            "operation_type",
            "input_query",
            "tools_invoked",
            "safety_status",
            "guardrail_flags",
            "requires_human_review",
            "human_decision",
            "human_rationale",
            "human_reviewed_at",
            "latency_ms",
            "created_at",
        ]
        read_only_fields = fields

    def get_clinician_name(self, obj) -> str:
        if obj.clinician:
            return f"{obj.clinician.first_name} {obj.clinician.last_name}".strip() or obj.clinician.username
        return "System"


class ModelDriftRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelDriftRecord
        fields = "__all__"
        read_only_fields = ["id", "evaluated_at"]


class AgentTaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AgentTask
        fields = [
            "id",
            "workflow_id",
            "agent_type",
            "task_type",
            "priority",
            "status",
            "created_at",
            "started_at",
            "completed_at",
            "retry_count",
            "timeout_seconds",
            "input_reference",
            "output_reference",
            "approval_required",
            "approval_status",
            "error_code",
            "created_by",
            "created_by_name",
        ]
        read_only_fields = ["id", "created_at", "started_at", "completed_at"]

    def get_created_by_name(self, obj) -> str:
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return "System"


class AIAgentTraceSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AIAgentTrace
        fields = [
            "id",
            "agent_run_id",
            "workflow_id",
            "request_id",
            "correlation_id",
            "user",
            "user_name",
            "role",
            "agent_name",
            "agent_version",
            "tool_calls",
            "input_summary",
            "output_summary",
            "status",
            "start_time",
            "end_time",
            "latency_ms",
            "failure_reason",
            "approval_state",
        ]
        read_only_fields = fields

    def get_user_name(self, obj) -> str:
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return "System"


class AIApprovalGateSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AIApprovalGate
        fields = [
            "id",
            "action_type",
            "workflow_id",
            "agent_task",
            "requested_by_agent",
            "model_version",
            "justification",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "decision",
            "rejection_reason",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_approved_by_name(self, obj) -> str:
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return ""


class AIApprovalDecisionSerializer(serializers.Serializer):
    gate_id = serializers.UUIDField(required=True)
    decision = serializers.ChoiceField(choices=AIApprovalGate.Decision.choices, required=True)
    rationale = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class AgentMemoryRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentMemoryRecord
        fields = ["id", "namespace", "key", "value", "provenance", "expires_at", "created_at"]
        read_only_fields = ["id", "created_at"]


class SwarmWorkflowRequestSerializer(serializers.Serializer):
    patient_id = serializers.UUIDField(required=True)
    query = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    correlation_id = serializers.CharField(required=False, allow_blank=True, max_length=64)


# ===========================================================================
# Extended Serializers for Prompt 31 Endpoints
# ===========================================================================

from .models import (
    AIModelConfig,
    AIConversation,
    AIMessage,
    AIEvaluation,
    MCPServer,
    MCPTool,
)


class AIChatRequestSerializer(serializers.Serializer):
    query = serializers.CharField(required=True, min_length=1, max_length=4096)
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
    patient_id = serializers.UUIDField(required=False, allow_null=True)
    model_name = serializers.CharField(required=False, allow_blank=True, max_length=128)
    temperature = serializers.FloatField(required=False, min_value=0.0, max_value=1.0, default=0.1)
    max_tokens = serializers.IntegerField(required=False, min_value=100, max_value=4096, default=2048)


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = [
            "id",
            "conversation",
            "role",
            "content",
            "model_name",
            "citations",
            "grounding_status",
            "grounding_confidence",
            "tool_calls",
            "token_count",
            "latency_ms",
            "is_error",
            "created_at",
        ]
        read_only_fields = fields


class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = [
            "id",
            "user",
            "patient",
            "role",
            "title",
            "status",
            "metadata",
            "messages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class AIModelConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModelConfig
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class AIEvaluationSerializer(serializers.ModelSerializer):
    evaluated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AIEvaluation
        fields = [
            "id",
            "benchmark_name",
            "model_name",
            "total_cases",
            "passed_cases",
            "grounding_accuracy",
            "citation_precision",
            "safety_compliance_rate",
            "avg_latency_ms",
            "total_cost",
            "summary_metrics",
            "evaluated_by",
            "evaluated_by_name",
            "evaluated_at",
        ]
        read_only_fields = ["id", "evaluated_at"]

    def get_evaluated_by_name(self, obj) -> str:
        if obj.evaluated_by:
            return f"{obj.evaluated_by.first_name} {obj.evaluated_by.last_name}".strip() or obj.evaluated_by.username
        return "Automated Suite"


class AIEvaluationRunRequestSerializer(serializers.Serializer):
    benchmark_name = serializers.CharField(required=False, default="ClinicalSafetyRegression", max_length=128)
    model_name = serializers.CharField(required=False, default="claude-3-5-sonnet-20241022", max_length=128)


class MCPServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = MCPServer
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

