"""
Serializers for Browser Agent Tasks, Policies, Destinations, Runs, and Kill Switch.
"""
from rest_framework import serializers

from apps.ai_agents.models import (
    AgentKillSwitchState,
    ApprovedDestination,
    BrowserAgentAction,
    BrowserAgentRun,
    BrowserAgentTask,
    BrowserDestination,
    BrowserTaskPolicy,
    BrowserTaskState,
    BrowserVerification,
    DataClassification,
    ToolRiskLevel,
    VerificationStatus,
)


class BrowserDestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrowserDestination
        fields = [
            "id",
            "domain",
            "hostname",
            "scheme",
            "port",
            "purpose",
            "environment",
            "owner",
            "allowed_paths",
            "allowed_operations",
            "allowed_roles",
            "sensitivity",
            "approval_required",
            "phi_allowed",
            "authentication_required",
            "expiration",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


ApprovedDestinationSerializer = BrowserDestinationSerializer


class BrowserTaskPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = BrowserTaskPolicy
        fields = [
            "id",
            "name",
            "task_type",
            "destination",
            "allowed_operations",
            "sensitivity",
            "required_role",
            "approval_required",
            "max_steps",
            "max_duration",
            "allowed_file_types",
            "enabled",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BrowserAgentActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrowserAgentAction
        fields = [
            "id",
            "step_index",
            "operation",
            "target_index",
            "target_label",
            "target_role",
            "input_text",
            "is_mutation",
            "elapsed_ms",
            "page_changed",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BrowserAgentRunSerializer(serializers.ModelSerializer):
    actions = BrowserAgentActionSerializer(many=True, read_only=True)

    class Meta:
        model = BrowserAgentRun
        fields = [
            "id",
            "task",
            "started_at",
            "completed_at",
            "duration_ms",
            "steps_count",
            "status",
            "provider_latency_ms",
            "text_helper_latency_ms",
            "model_calls_count",
            "metadata",
            "actions",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BrowserVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrowserVerification
        fields = [
            "id",
            "task",
            "status",
            "rules_applied",
            "checks_passed",
            "evidence",
            "verified_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BrowserAgentTaskSerializer(serializers.ModelSerializer):
    requested_by_email = serializers.EmailField(source="requested_by.email", read_only=True)
    approved_by_email = serializers.EmailField(source="approved_by.email", read_only=True, default=None)
    runs = BrowserAgentRunSerializer(many=True, read_only=True)
    verification_record = BrowserVerificationSerializer(read_only=True)

    class Meta:
        model = BrowserAgentTask
        fields = [
            "id",
            "requested_by",
            "requested_by_email",
            "role",
            "goal",
            "destination_url",
            "destination_domain",
            "allowed_operations",
            "patient_context_reference",
            "sensitivity_classification",
            "approval_required",
            "environment",
            "risk_level",
            "phi_classification",
            "approval_status",
            "approved_by",
            "approved_by_email",
            "approved_at",
            "rejection_reason",
            "execution_status",
            "provider",
            "provider_version",
            "browser_session_reference",
            "verification_status",
            "failure_reason",
            "audit_reference",
            "independent_verification_rules",
            "steps_log",
            "artifacts",
            "runs",
            "verification_record",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "requested_by",
            "requested_by_email",
            "destination_domain",
            "approval_status",
            "approved_by",
            "approved_by_email",
            "approved_at",
            "rejection_reason",
            "execution_status",
            "verification_status",
            "failure_reason",
            "audit_reference",
            "steps_log",
            "artifacts",
            "runs",
            "verification_record",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
        ]


class BrowserAgentTaskCreateSerializer(serializers.Serializer):
    goal = serializers.CharField(max_length=2000, required=True)
    destination_url = serializers.URLField(max_length=1000, required=True)
    provider = serializers.CharField(max_length=50, required=False, default="jev-ultrafast")
    allowed_operations = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=lambda: ["CLICK", "TYPE_TEXT", "SELECT", "SCROLL_UP", "SCROLL_DOWN", "WAIT", "DONE", "BLOCKED"],
    )
    phi_classification = serializers.ChoiceField(
        choices=DataClassification.choices,
        default=DataClassification.PUBLIC,
    )
    patient_context_reference = serializers.CharField(max_length=100, required=False, allow_null=True, default=None)
    environment = serializers.CharField(max_length=50, default="PRODUCTION")
    independent_verification_rules = serializers.DictField(required=False, default=dict)


class AgentKillSwitchSerializer(serializers.ModelSerializer):
    activated_by_email = serializers.EmailField(source="activated_by.email", read_only=True, default=None)

    class Meta:
        model = AgentKillSwitchState
        fields = [
            "id",
            "is_active",
            "activated_by",
            "activated_by_email",
            "reason",
            "activated_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "activated_by", "activated_by_email", "activated_at", "created_at", "updated_at"]
