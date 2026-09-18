"""
DRF Serializers for Google Jules Engineering Automation endpoints.
"""
from rest_framework import serializers
from integrations.jules.models import (
    JulesSource,
    JulesSession,
    JulesActivity,
    JulesArtifact,
    JulesRemediationJob,
    JulesApproval,
)


class JulesSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = JulesSource
        fields = [
            "id",
            "external_name",
            "source_id",
            "provider",
            "github_owner",
            "github_repository",
            "is_private",
            "default_branch",
            "available_branches",
            "enabled",
            "last_synced_at",
            "created_at",
        ]


class JulesActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = JulesActivity
        fields = [
            "id",
            "external_activity_id",
            "activity_type",
            "originator",
            "description",
            "metadata",
            "created_at",
        ]


class JulesArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = JulesArtifact
        fields = [
            "id",
            "artifact_type",
            "path",
            "metadata",
            "created_at",
        ]


class JulesSessionSerializer(serializers.ModelSerializer):
    activities = JulesActivitySerializer(many=True, read_only=True)
    artifacts = JulesArtifactSerializer(many=True, read_only=True)

    class Meta:
        model = JulesSession
        fields = [
            "id",
            "external_session_id",
            "title",
            "prompt",
            "repository",
            "branch",
            "state",
            "automation_mode",
            "require_plan_approval",
            "started_at",
            "completed_at",
            "failed_at",
            "created_at",
            "activities",
            "artifacts",
        ]


class JulesApprovalSerializer(serializers.ModelSerializer):
    approver_email = serializers.EmailField(source="approved_by.email", read_only=True)
    requester_email = serializers.EmailField(source="requested_by.email", read_only=True)

    class Meta:
        model = JulesApproval
        fields = [
            "id",
            "remediation_job",
            "approval_type",
            "requested_by",
            "requester_email",
            "approved_by",
            "approver_email",
            "status",
            "reason",
            "expires_at",
            "created_at",
        ]


class JulesRemediationJobSerializer(serializers.ModelSerializer):
    session = JulesSessionSerializer(read_only=True)
    approvals = JulesApprovalSerializer(many=True, read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    approved_by_email = serializers.EmailField(source="approved_by.email", read_only=True)

    class Meta:
        model = JulesRemediationJob
        fields = [
            "id",
            "correlation_id",
            "repository",
            "branch",
            "trigger_type",
            "issue_category",
            "issue_reference",
            "title",
            "description",
            "severity",
            "status",
            "created_by",
            "created_by_email",
            "approved_by",
            "approved_by_email",
            "validation_status",
            "validation_output",
            "pr_url",
            "pr_number",
            "prompt_version",
            "remediation_attempts",
            "completed_at",
            "created_at",
            "updated_at",
            "session",
            "approvals",
        ]


class JulesRemediationCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    issue_category = serializers.CharField(max_length=50)
    description = serializers.CharField()
    repository = serializers.CharField(max_length=200, default="HealthNova-AI")
    branch = serializers.CharField(max_length=100, default="develop")
    trigger_type = serializers.CharField(max_length=40, default="MANUAL")
    severity = serializers.CharField(max_length=20, default="MEDIUM")
    issue_reference = serializers.CharField(max_length=255, required=False, allow_blank=True)
    affected_files = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    error_log = serializers.CharField(required=False, allow_blank=True, default="")


class JulesApprovePlanSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class JulesSendMessageSerializer(serializers.Serializer):
    message = serializers.CharField(min_length=1)
