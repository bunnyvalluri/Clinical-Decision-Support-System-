"""
Serializers for Security Testing & DevSecOps API.
"""
from rest_framework import serializers
from apps.security_testing.models import (
    SecurityTarget,
    SecurityScan,
    SecurityFinding,
    SecurityEvidence,
    SecurityValidation,
    SecurityReport,
    SecurityAuditEvent,
    SecurityRetest,
    SecurityToolExecution,
    ReconSession,
    ReconEndpoint,
)


class SecurityTargetSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(source="approved_by.get_full_name", read_only=True)

    class Meta:
        model = SecurityTarget
        fields = [
            "id",
            "name",
            "environment",
            "target_type",
            "hostname",
            "port",
            "protocol",
            "scope",
            "owner",
            "approved_by",
            "approved_by_name",
            "approval_status",
            "approval_expires_at",
            "allowed_tests",
            "forbidden_tests",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SecurityEvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityEvidence
        fields = [
            "id",
            "evidence_type",
            "sanitized_request",
            "sanitized_response",
            "reproduction_steps",
            "evidence_hash",
            "captured_at",
        ]
        read_only_fields = ["id", "evidence_hash", "captured_at"]


class SecurityValidationSerializer(serializers.ModelSerializer):
    validated_by_name = serializers.CharField(source="validated_by.get_full_name", read_only=True)

    class Meta:
        model = SecurityValidation
        fields = [
            "id",
            "validated_by",
            "validated_by_name",
            "is_target_authorized",
            "is_vulnerable",
            "is_reproducible",
            "is_exploitable",
            "has_meaningful_impact",
            "is_evidence_sufficient",
            "is_reportable",
            "validation_notes",
            "decision",
            "validated_at",
        ]
        read_only_fields = ["id", "validated_at"]


class SecurityFindingSerializer(serializers.ModelSerializer):
    target_name = serializers.CharField(source="target.name", read_only=True)
    evidences = SecurityEvidenceSerializer(many=True, read_only=True)
    validation = SecurityValidationSerializer(read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.get_full_name", read_only=True)

    class Meta:
        model = SecurityFinding
        fields = [
            "id",
            "scan",
            "target",
            "target_name",
            "title",
            "vulnerability_type",
            "severity",
            "state",
            "confidence",
            "affected_component",
            "affected_endpoint",
            "description",
            "impact",
            "root_cause",
            "remediation_guidance",
            "cwe_id",
            "cvss_score",
            "discovered_by",
            "assigned_to",
            "assigned_to_name",
            "evidences",
            "validation",
            "validated_at",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SecurityScanSerializer(serializers.ModelSerializer):
    target_name = serializers.CharField(source="target.name", read_only=True)
    target_environment = serializers.CharField(source="target.environment", read_only=True)
    initiated_by_name = serializers.CharField(source="initiated_by.get_full_name", read_only=True)
    findings_count = serializers.IntegerField(source="findings.count", read_only=True)

    class Meta:
        model = SecurityScan
        fields = [
            "id",
            "target",
            "target_name",
            "target_environment",
            "scan_type",
            "status",
            "initiated_by",
            "initiated_by_name",
            "approved_by",
            "started_at",
            "completed_at",
            "error_message",
            "max_requests",
            "rate_limit_rps",
            "timeout_seconds",
            "tools_used",
            "findings_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "started_at", "completed_at", "created_at", "updated_at"]


class SecurityReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source="generated_by.get_full_name", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.get_full_name", read_only=True)

    class Meta:
        model = SecurityReport
        fields = [
            "id",
            "scan",
            "title",
            "summary",
            "report_type",
            "findings_summary",
            "generated_by",
            "generated_by_name",
            "reviewed_by",
            "reviewed_by_name",
            "is_approved",
            "approved_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class SecurityAuditEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.get_full_name", read_only=True)

    class Meta:
        model = SecurityAuditEvent
        fields = [
            "id",
            "event_type",
            "actor",
            "actor_name",
            "target_name",
            "details",
            "ip_address",
            "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]


class SecurityRetestSerializer(serializers.ModelSerializer):
    executed_by_name = serializers.CharField(source="executed_by.get_full_name", read_only=True)

    class Meta:
        model = SecurityRetest
        fields = [
            "id",
            "finding",
            "executed_by",
            "executed_by_name",
            "passed",
            "test_output",
            "executed_at",
        ]
        read_only_fields = ["id", "executed_at"]


class SecurityToolExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityToolExecution
        fields = [
            "id",
            "scan",
            "tool_name",
            "tool_version",
            "execution_time_seconds",
            "exit_code",
            "stdout_sanitized",
            "stderr_sanitized",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ReconEndpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReconEndpoint
        fields = ["id", "path", "http_method", "auth_required", "role_required", "is_discovered_dynamically"]


class ReconSessionSerializer(serializers.ModelSerializer):
    endpoints = ReconEndpointSerializer(many=True, read_only=True)

    class Meta:
        model = ReconSession
        fields = ["id", "target", "status", "started_at", "completed_at", "total_endpoints_discovered", "endpoints"]
