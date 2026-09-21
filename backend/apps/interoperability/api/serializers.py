"""
Interoperability DRF Serializers — BPY-CSE-2666 (Sections 21, 28).
"""
from rest_framework import serializers

from apps.interoperability.domain.enums import (
    ConflictStatus,
    ConflictType,
    ResolutionAction,
    SyncDirection,
    SyncStatus,
    TrustLevel,
)
from apps.interoperability.models import (
    ExternalSystem,
    FHIRExportJob,
    FHIRImportJob,
    FHIRMappingConflict,
    FHIRMappingVersion,
    FHIRProvenanceRecord,
    FHIRResourceRecord,
    FHIRValidationResult,
    IntegrationAuditEvent,
    IntegrationConnection,
    IntegrationHealthStatus,
    PatientIdentityLink,
    TerminologyMapping,
)


class ExternalSystemSerializer(serializers.ModelSerializer):
    connections_count = serializers.IntegerField(source="connections.count", read_only=True)

    class Meta:
        model = ExternalSystem
        fields = [
            "id",
            "name",
            "system_type",
            "organization_oid",
            "contact_email",
            "technical_contact",
            "description",
            "is_active",
            "connections_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class IntegrationConnectionSerializer(serializers.ModelSerializer):
    external_system_name = serializers.CharField(source="external_system.name", read_only=True)
    import_jobs_count = serializers.IntegerField(source="import_jobs.count", read_only=True)
    export_jobs_count = serializers.IntegerField(source="export_jobs.count", read_only=True)

    class Meta:
        model = IntegrationConnection
        fields = [
            "id",
            "external_system",
            "external_system_name",
            "name",
            "base_url",
            "fhir_version",
            "auth_type",
            "auth_config",
            "trust_level",
            "health_status",
            "is_active",
            "allowed_direction",
            "sync_schedule_cron",
            "rate_limit_per_minute",
            "timeout_seconds",
            "last_verified_at",
            "last_sync_at",
            "latency_ms",
            "health_details",
            "import_jobs_count",
            "export_jobs_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "last_verified_at", "last_sync_at", "latency_ms"]


# Backward-compatibility alias
FHIREndpointSerializer = IntegrationConnectionSerializer


class FHIRImportJobSerializer(serializers.ModelSerializer):
    connection_name = serializers.CharField(source="connection.name", read_only=True)
    triggered_by_username = serializers.CharField(source="triggered_by.username", read_only=True)

    class Meta:
        model = FHIRImportJob
        fields = [
            "id",
            "connection",
            "connection_name",
            "status",
            "resources_requested",
            "total_records",
            "imported_records",
            "conflicts_generated",
            "failed_records",
            "duration_ms",
            "error_log",
            "triggered_by",
            "triggered_by_username",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


FHIRSyncJobSerializer = FHIRImportJobSerializer


class FHIRExportJobSerializer(serializers.ModelSerializer):
    connection_name = serializers.CharField(source="connection.name", read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    triggered_by_username = serializers.CharField(source="triggered_by.username", read_only=True)

    class Meta:
        model = FHIRExportJob
        fields = [
            "id",
            "connection",
            "connection_name",
            "status",
            "resource_type",
            "total_records",
            "exported_records",
            "failed_records",
            "duration_ms",
            "error_log",
            "patient",
            "patient_mrn",
            "triggered_by",
            "triggered_by_username",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class FHIRResourceRecordSerializer(serializers.ModelSerializer):
    connection_name = serializers.CharField(source="connection.name", read_only=True)

    class Meta:
        model = FHIRResourceRecord
        fields = [
            "id",
            "connection",
            "connection_name",
            "resource_type",
            "external_id",
            "version_id",
            "payload_sha256",
            "raw_payload",
            "normalized_entity_type",
            "normalized_entity_id",
            "is_valid",
            "validation_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class FHIRMappingVersionSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = FHIRMappingVersion
        fields = [
            "id",
            "resource_type",
            "version",
            "mapping_rules",
            "is_active",
            "created_by",
            "created_by_username",
            "change_summary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class FHIRValidationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = FHIRValidationResult
        fields = [
            "id",
            "resource_type",
            "external_id",
            "severity",
            "rule_code",
            "error_message",
            "field_path",
            "observed_value",
            "import_job",
            "created_at",
        ]
        read_only_fields = fields


class PatientIdentityLinkSerializer(serializers.ModelSerializer):
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    connection_name = serializers.CharField(source="connection.name", read_only=True)

    class Meta:
        model = PatientIdentityLink
        fields = [
            "id",
            "patient",
            "patient_mrn",
            "patient_name",
            "connection",
            "connection_name",
            "external_patient_id",
            "external_mrn",
            "link_status",
            "confidence_score",
            "matched_criteria",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TerminologyMappingSerializer(serializers.ModelSerializer):
    connection_name = serializers.CharField(source="connection.name", read_only=True)
    verified_by_username = serializers.CharField(source="verified_by.username", read_only=True)

    class Meta:
        model = TerminologyMapping
        fields = [
            "id",
            "connection",
            "connection_name",
            "source_system",
            "source_code",
            "source_display",
            "target_system",
            "target_code",
            "target_display",
            "internal_field",
            "is_verified",
            "verified_by",
            "verified_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class FHIRProvenanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FHIRProvenanceRecord
        fields = [
            "id",
            "entity_type",
            "entity_id",
            "external_system",
            "external_system_name",
            "external_resource_id",
            "external_version_id",
            "fhir_resource_type",
            "payload_sha256",
            "raw_payload_snapshot",
            "direction",
            "actor_reference",
            "sync_job",
            "recorded_at",
            "created_at",
        ]
        read_only_fields = fields


class FHIRMappingConflictSerializer(serializers.ModelSerializer):
    external_system_name = serializers.CharField(source="external_system.name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.get_full_name", read_only=True)
    resolved_by_name = serializers.CharField(source="resolved_by.get_full_name", read_only=True)

    class Meta:
        model = FHIRMappingConflict
        fields = [
            "id",
            "conflict_type",
            "status",
            "resource_type",
            "external_system",
            "external_system_name",
            "incoming_payload",
            "existing_entity_type",
            "existing_entity_id",
            "discrepancy_details",
            "confidence_score",
            "assigned_to",
            "assigned_to_name",
            "resolution_action",
            "resolution_notes",
            "resolved_by",
            "resolved_by_name",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "resolved_at",
            "resolved_by",
        ]


class ConflictResolutionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=ResolutionAction.choices)
    resolution_notes = serializers.CharField(required=False, allow_blank=True, default="")


class IntegrationAuditEventSerializer(serializers.ModelSerializer):
    connection_name = serializers.CharField(source="connection.name", read_only=True)

    class Meta:
        model = IntegrationAuditEvent
        fields = [
            "id",
            "connection",
            "connection_name",
            "actor",
            "actor_username",
            "action",
            "resource",
            "source",
            "result",
            "correlation_id",
            "details",
            "ip_address",
            "timestamp",
        ]
        read_only_fields = fields


FHIRAuditLogSerializer = IntegrationAuditEventSerializer


class SyncTriggerSerializer(serializers.Serializer):
    connection_id = serializers.UUIDField(required=True)
    resources = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=lambda: ["Patient", "Observation"],
    )


class ExportTriggerSerializer(serializers.Serializer):
    connection_id = serializers.UUIDField(required=True)
    resource_type = serializers.CharField(required=True)
    patient_id = serializers.UUIDField(required=False, allow_null=True)
