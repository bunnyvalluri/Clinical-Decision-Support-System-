"""
Serializers for Browser Agent Tasks, Approved Destinations, and Kill Switch.
"""
from rest_framework import serializers

from apps.ai_agents.models import (
    AgentKillSwitchState,
    ApprovedDestination,
    BrowserAgentTask,
    BrowserTaskState,
    DataClassification,
    ToolRiskLevel,
    VerificationStatus,
)


class ApprovedDestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovedDestination
        fields = [
            "id",
            "domain",
            "purpose",
            "environment",
            "owner",
            "allowed_operations",
            "phi_allowed",
            "authentication_required",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BrowserAgentTaskSerializer(serializers.ModelSerializer):
    requested_by_email = serializers.EmailField(source="requested_by.email", read_only=True)
    approved_by_email = serializers.EmailField(source="approved_by.email", read_only=True, default=None)

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
            "environment",
            "risk_level",
            "phi_classification",
            "approval_status",
            "approved_by",
            "approved_by_email",
            "approved_at",
            "rejection_reason",
            "execution_status",
            "verification_status",
            "failure_reason",
            "audit_reference",
            "independent_verification_rules",
            "steps_log",
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
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
        ]


class BrowserAgentTaskCreateSerializer(serializers.Serializer):
    goal = serializers.CharField(max_length=2000, required=True)
    destination_url = serializers.URLField(max_length=1000, required=True)
    phi_classification = serializers.ChoiceField(
        choices=DataClassification.choices,
        default=DataClassification.PUBLIC,
    )
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
