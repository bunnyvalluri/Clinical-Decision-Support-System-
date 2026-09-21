"""
Neon PostgreSQL Interoperability Models — BPY-CSE-2666.

Neon PostgreSQL remains the SOLE authoritative application/clinical source of truth.
FHIR resources are NOT the primary database model; these models manage the
controlled integration subsystem, endpoints, sync jobs, provenance, conflicts,
and immutable audit logs.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel, SoftDeleteModel
from .domain.enums import (
    ConflictStatus,
    ConflictType,
    ResolutionAction,
    SyncDirection,
    SyncStatus,
    TrustLevel,
)


class IntegrationHealthStatus(models.TextChoices):
    CONNECTED = "CONNECTED", "Connected (Verified)"
    DEGRADED = "DEGRADED", "Degraded (High Latency / Partial Failures)"
    OFFLINE = "OFFLINE", "Offline (Unreachable)"
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED", "Authentication Failed"
    VALIDATION_FAILED = "VALIDATION_FAILED", "Validation Failed"
    CONFIGURATION_REQUIRED = "CONFIGURATION_REQUIRED", "Configuration Required"
    NOT_CONFIGURED = "NOT_CONFIGURED", "Not Configured"
    UNKNOWN = "UNKNOWN", "Unknown (Pending Verification)"


class ExternalSystem(SoftDeleteModel):
    """
    Authoritative registry for external healthcare institutions, EHR vendors, and health information exchanges (HIEs).
    """

    class SystemType(models.TextChoices):
        EHR_EMR = "EHR_EMR", "Electronic Health Record (Epic, Cerner, etc.)"
        HIE = "HIE", "Health Information Exchange"
        LAB_SYSTEM = "LAB_SYSTEM", "Laboratory Information System (LIS)"
        IMAGING_PACS = "IMAGING_PACS", "Radiology / PACS"
        PUBLIC_HEALTH = "PUBLIC_HEALTH", "Public Health Agency / CDC"
        RESEARCH_REGISTRY = "RESEARCH_REGISTRY", "Research / Clinical Trial Registry"

    name = models.CharField(max_length=255, unique=True, db_index=True)
    system_type = models.CharField(max_length=50, choices=SystemType.choices, default=SystemType.EHR_EMR)
    organization_oid = models.CharField(max_length=100, blank=True, help_text="HL7 OID (e.g. 2.16.840.1.113883...)")
    contact_email = models.EmailField(blank=True)
    technical_contact = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "interop_external_systems"
        verbose_name = "External Healthcare System"
        verbose_name_plural = "External Healthcare Systems"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} [{self.system_type}]"


class IntegrationConnection(SoftDeleteModel):
    """
    Physical connection and security gateway to an external healthcare endpoint.
    Manages URLs, credentials, mTLS configs, and verified health states.
    """

    class AuthType(models.TextChoices):
        NONE = "NONE", "No Authentication (Sandbox)"
        API_KEY = "API_KEY", "API Key / Header Token"
        BEARER = "BEARER", "Bearer JWT Token"
        SMART_ON_FHIR = "SMART_ON_FHIR", "SMART on FHIR (OAuth2)"
        MUTUAL_TLS = "MUTUAL_TLS", "Mutual TLS (mTLS)"

    external_system = models.ForeignKey(
        ExternalSystem,
        on_delete=models.CASCADE,
        related_name="connections",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255, unique=True, db_index=True)
    base_url = models.URLField(max_length=500, help_text="FHIR R4 base URL (e.g. https://ehr.hospital.org/fhir/r4).")
    fhir_version = models.CharField(max_length=20, default="4.0.1")
    auth_type = models.CharField(max_length=30, choices=AuthType.choices, default=AuthType.BEARER)
    auth_config = models.JSONField(default=dict, blank=True, help_text="Sanitized credentials (client_id, tokens).")
    trust_level = models.CharField(max_length=30, choices=TrustLevel.choices, default=TrustLevel.REVIEWED, db_index=True)
    health_status = models.CharField(
        max_length=50,
        choices=IntegrationHealthStatus.choices,
        default=IntegrationHealthStatus.NOT_CONFIGURED,
        db_index=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    allowed_direction = models.CharField(max_length=30, choices=SyncDirection.choices, default=SyncDirection.BI_DIRECTIONAL)
    sync_schedule_cron = models.CharField(max_length=50, blank=True, default="0 */6 * * *")
    rate_limit_per_minute = models.PositiveIntegerField(default=120)
    timeout_seconds = models.PositiveIntegerField(default=15)
    last_verified_at = models.DateTimeField(null=True, blank=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    latency_ms = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)
    health_details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "interop_connections"
        verbose_name = "Integration Connection"
        verbose_name_plural = "Integration Connections"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} [{self.health_status}] ({self.base_url})"


# Backward compatibility alias for FHIREndpoint
FHIREndpoint = IntegrationConnection


class FHIRImportJob(BaseModel):
    """
    Execution and audit record for an inbound FHIR synchronization or batch ingestion job.
    """

    connection = models.ForeignKey(
        IntegrationConnection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="import_jobs",
    )
    status = models.CharField(max_length=30, choices=SyncStatus.choices, default=SyncStatus.PENDING, db_index=True)
    resources_requested = models.JSONField(default=list)
    total_records = models.PositiveIntegerField(default=0)
    imported_records = models.PositiveIntegerField(default=0)
    conflicts_generated = models.PositiveIntegerField(default=0)
    failed_records = models.PositiveIntegerField(default=0)
    duration_ms = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    error_log = models.TextField(blank=True)
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_fhir_imports",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "interop_import_jobs"
        verbose_name = "FHIR Import Job"
        verbose_name_plural = "FHIR Import Jobs"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"ImportJob [{self.status}] {self.id} ({self.total_records} records)"


# Backward compatibility alias
FHIRSyncJob = FHIRImportJob


class FHIRExportJob(BaseModel):
    """
    Execution and audit record for an outbound FHIR export or batch transfer job.
    """

    connection = models.ForeignKey(
        IntegrationConnection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="export_jobs",
    )
    status = models.CharField(max_length=30, choices=SyncStatus.choices, default=SyncStatus.PENDING, db_index=True)
    resource_type = models.CharField(max_length=50, db_index=True)
    total_records = models.PositiveIntegerField(default=0)
    exported_records = models.PositiveIntegerField(default=0)
    failed_records = models.PositiveIntegerField(default=0)
    duration_ms = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    error_log = models.TextField(blank=True)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fhir_exports",
    )
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_fhir_exports",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "interop_export_jobs"
        verbose_name = "FHIR Export Job"
        verbose_name_plural = "FHIR Export Jobs"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"ExportJob [{self.status}] {self.resource_type} ({self.exported_records} records)"


class FHIRResourceRecord(BaseModel):
    """
    Controlled raw-resource archive separating external source representation from normalized internal domain data.
    Guarantees that raw FHIR JSON is preserved without polluting normalized relational models.
    """

    connection = models.ForeignKey(
        IntegrationConnection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resource_records",
    )
    resource_type = models.CharField(max_length=50, db_index=True)
    external_id = models.CharField(max_length=255, db_index=True)
    version_id = models.CharField(max_length=50, blank=True)
    payload_sha256 = models.CharField(max_length=64, db_index=True)
    raw_payload = models.JSONField(help_text="Exact raw external FHIR JSON representation.")
    normalized_entity_type = models.CharField(max_length=100, blank=True, db_index=True)
    normalized_entity_id = models.CharField(max_length=100, blank=True, db_index=True)
    is_valid = models.BooleanField(default=True, db_index=True)
    validation_notes = models.TextField(blank=True)

    class Meta:
        db_table = "interop_resource_records"
        verbose_name = "FHIR Resource Record"
        verbose_name_plural = "FHIR Resource Records"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["resource_type", "external_id"]),
            models.Index(fields=["payload_sha256"]),
            models.Index(fields=["normalized_entity_type", "normalized_entity_id"]),
        ]

    def __str__(self) -> str:
        return f"FHIRResource [{self.resource_type}] {self.external_id} (SHA: {self.payload_sha256[:8]}...)"


class FHIRMappingVersion(BaseModel):
    """
    Versioned registry of clinical field transformation logic and mapping rules.
    """

    resource_type = models.CharField(max_length=50, db_index=True)
    version = models.CharField(max_length=30, default="1.0.0", db_index=True)
    mapping_rules = models.JSONField(default=dict, help_text="Declarative JSON mapping rules.")
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    change_summary = models.TextField(blank=True)

    class Meta:
        db_table = "interop_mapping_versions"
        verbose_name = "FHIR Mapping Version"
        verbose_name_plural = "FHIR Mapping Versions"
        unique_together = ("resource_type", "version")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Mapping [{self.resource_type}] v{self.version} ({'Active' if self.is_active else 'Inactive'})"


class FHIRValidationResult(BaseModel):
    """
    Detailed validation failure log tracking structural, terminology, and physiological issues.
    """

    class Severity(models.TextChoices):
        FATAL = "FATAL", "Fatal (Rejected)"
        ERROR = "ERROR", "Error (Conflict Created)"
        WARNING = "WARNING", "Warning (Accepted with Caution)"
        INFO = "INFO", "Informational"

    resource_type = models.CharField(max_length=50, db_index=True)
    external_id = models.CharField(max_length=255, blank=True)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.ERROR, db_index=True)
    rule_code = models.CharField(max_length=100, db_index=True)
    error_message = models.TextField()
    field_path = models.CharField(max_length=255, blank=True)
    observed_value = models.TextField(blank=True)
    import_job = models.ForeignKey(
        FHIRImportJob,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="validation_results",
    )

    class Meta:
        db_table = "interop_validation_results"
        verbose_name = "FHIR Validation Result"
        verbose_name_plural = "FHIR Validation Results"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Validation [{self.severity}] {self.resource_type}: {self.rule_code}"


class PatientIdentityLink(BaseModel):
    """
    Cross-institutional patient identity linking.
    Binds an external system's patient identifier to HealthNova AI's authoritative Patient model.
    """

    class LinkStatus(models.TextChoices):
        CONFIRMED = "CONFIRMED", "Confirmed Match"
        PROBABLE = "PROBABLE", "Probable Match (Requires Review)"
        REJECTED = "REJECTED", "Rejected Match (Distinct Patient)"
        MERGED = "MERGED", "Merged Identity"

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="external_identity_links",
    )
    connection = models.ForeignKey(
        IntegrationConnection,
        on_delete=models.CASCADE,
        related_name="patient_links",
    )
    external_patient_id = models.CharField(max_length=255, db_index=True)
    external_mrn = models.CharField(max_length=100, blank=True, db_index=True)
    link_status = models.CharField(max_length=30, choices=LinkStatus.choices, default=LinkStatus.CONFIRMED, db_index=True)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=4, default=1.0)
    matched_criteria = models.JSONField(default=list)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "interop_patient_identity_links"
        verbose_name = "Patient Identity Link"
        verbose_name_plural = "Patient Identity Links"
        unique_together = ("connection", "external_patient_id")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"IdentityLink {self.patient.mrn} <-> {self.connection.name}:{self.external_patient_id} [{self.link_status}]"


class TerminologyMapping(BaseModel):
    """
    Standard healthcare terminology translation table (Local EHR Code -> Standard LOINC / SNOMED CT / ICD-10).
    """

    class StandardSystem(models.TextChoices):
        LOINC = "LOINC", "Logical Observation Identifiers Names and Codes (LOINC)"
        SNOMED_CT = "SNOMED_CT", "SNOMED Clinical Terms"
        ICD10 = "ICD10", "ICD-10-CM"
        UCUM = "UCUM", "Unified Code for Units of Measure (UCUM)"
        RXNORM = "RXNORM", "RxNorm"

    connection = models.ForeignKey(
        IntegrationConnection,
        on_delete=models.CASCADE,
        related_name="terminology_mappings",
        null=True,
        blank=True,
        help_text="Specific to this connection if not a global mapping.",
    )
    source_system = models.CharField(max_length=255, db_index=True)
    source_code = models.CharField(max_length=100, db_index=True)
    source_display = models.CharField(max_length=255, blank=True)
    target_system = models.CharField(max_length=50, choices=StandardSystem.choices, default=StandardSystem.LOINC, db_index=True)
    target_code = models.CharField(max_length=100, db_index=True)
    target_display = models.CharField(max_length=255)
    internal_field = models.CharField(max_length=100, blank=True, help_text="Mapped ClinicalRecord field (e.g. systolic_bp).")
    is_verified = models.BooleanField(default=True, db_index=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "interop_terminology_mappings"
        verbose_name = "Terminology Mapping"
        verbose_name_plural = "Terminology Mappings"
        unique_together = ("source_system", "source_code", "target_system")
        ordering = ["source_code"]

    def __str__(self) -> str:
        return f"{self.source_code} ({self.source_system}) -> {self.target_code} ({self.target_system})"


class FHIRProvenanceRecord(models.Model):
    """
    Cryptographically verifiable and immutable provenance record for clinical data exchange.
    Guarantees full clinical data lineage and traceability back to originating external systems.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entity_type = models.CharField(max_length=100, db_index=True)
    entity_id = models.CharField(max_length=100, db_index=True)
    external_system = models.ForeignKey(
        IntegrationConnection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="provenance_records",
    )
    external_system_name = models.CharField(max_length=255, db_index=True)
    external_resource_id = models.CharField(max_length=255, db_index=True)
    external_version_id = models.CharField(max_length=50, blank=True)
    fhir_resource_type = models.CharField(max_length=50, db_index=True)
    payload_sha256 = models.CharField(max_length=64, db_index=True)
    raw_payload_snapshot = models.JSONField(default=dict)
    direction = models.CharField(max_length=30, choices=SyncDirection.choices, default=SyncDirection.INBOUND_IMPORT)
    actor_reference = models.CharField(max_length=255, blank=True)
    sync_job = models.ForeignKey(
        FHIRImportJob,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="provenance_records",
    )
    recorded_at = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fhir_provenance_records"
        verbose_name = "FHIR Provenance Record"
        verbose_name_plural = "FHIR Provenance Records"
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
            models.Index(fields=["external_system_name", "external_resource_id"]),
            models.Index(fields=["payload_sha256"]),
        ]

    def __str__(self) -> str:
        return f"Provenance [{self.fhir_resource_type}] {self.entity_type}:{self.entity_id} from {self.external_system_name}"


# Alias for DataProvenance
DataProvenance = FHIRProvenanceRecord


class FHIRMappingConflict(BaseModel):
    """
    Human Review Queue for ambiguous mappings, duplicate patient matches,
    and authoritative overwrite protection events.
    """

    conflict_type = models.CharField(max_length=50, choices=ConflictType.choices, default=ConflictType.OVERWRITE_PROTECTION_TRIGGERED, db_index=True)
    status = models.CharField(max_length=30, choices=ConflictStatus.choices, default=ConflictStatus.PENDING_REVIEW, db_index=True)
    resource_type = models.CharField(max_length=50, db_index=True)
    external_system = models.ForeignKey(
        IntegrationConnection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conflicts",
    )
    incoming_payload = models.JSONField()
    existing_entity_type = models.CharField(max_length=100, blank=True)
    existing_entity_id = models.CharField(max_length=100, blank=True)
    discrepancy_details = models.JSONField(default=dict)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_fhir_conflicts",
    )
    resolution_action = models.CharField(max_length=50, choices=ResolutionAction.choices, blank=True, null=True)
    resolution_notes = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_fhir_conflicts",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "fhir_mapping_conflicts"
        verbose_name = "FHIR Mapping Conflict"
        verbose_name_plural = "FHIR Mapping Conflicts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "conflict_type"]),
            models.Index(fields=["resource_type", "status"]),
        ]

    def __str__(self) -> str:
        return f"Conflict [{self.conflict_type}] {self.resource_type} ({self.status})"


# Alias for ReconciliationReview
ReconciliationReview = FHIRMappingConflict


class IntegrationAuditEvent(models.Model):
    """
    Immutable audit ledger capturing every integration event:
    creation, modification, imports, exports, reviews, and terminology changes.
    """

    class Action(models.TextChoices):
        INTEGRATION_CREATED = "integration.created", "Integration Created"
        INTEGRATION_MODIFIED = "integration.modified", "Integration Modified"
        INTEGRATION_DISABLED = "integration.disabled", "Integration Disabled"
        IMPORT_STARTED = "import.started", "Import Started"
        IMPORT_COMPLETED = "import.completed", "Import Completed"
        IMPORT_FAILED = "import.failed", "Import Failed"
        RESOURCE_VIEWED = "resource.viewed", "Resource Viewed"
        MAPPING_MODIFIED = "mapping.modified", "Mapping Modified"
        PATIENT_MATCH_CONFIRMED = "patient_match.confirmed", "Patient Match Confirmed"
        PATIENT_MATCH_REJECTED = "patient_match.rejected", "Patient Match Rejected"
        EXPORT_INITIATED = "export.initiated", "Export Initiated"
        EXPORT_COMPLETED = "export.completed", "Export Completed"
        EXPORT_REJECTED = "export.rejected", "Export Rejected"
        TERMINOLOGY_CHANGED = "terminology.changed", "Terminology Mapping Changed"
        RECONCILIATION_DECISION = "reconciliation.decision", "Reconciliation Decision Made"

    id = models.BigAutoField(primary_key=True)
    connection = models.ForeignKey(
        IntegrationConnection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="interop_audit_events",
    )
    actor_username = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=50, choices=Action.choices, db_index=True)
    resource = models.CharField(max_length=100, db_index=True)
    source = models.CharField(max_length=255, default="HealthNova_FHIR_Hub")
    result = models.CharField(max_length=50, default="SUCCESS", db_index=True)
    correlation_id = models.CharField(max_length=64, blank=True, db_index=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "interop_audit_events"
        verbose_name = "Integration Audit Event"
        verbose_name_plural = "Integration Audit Events"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["action", "timestamp"]),
            models.Index(fields=["correlation_id"]),
            models.Index(fields=["resource", "result"]),
        ]

    def __str__(self) -> str:
        return f"AuditEvent [{self.action}] on {self.resource} by {self.actor_username or 'System'} ({self.result})"

    @property
    def direction(self) -> str:
        return self.details.get("direction", "INBOUND")

    @property
    def operation(self) -> str:
        return self.details.get("operation", "")

    @property
    def status_code(self) -> int:
        return int(self.details.get("status_code", 200))

    @property
    def is_success(self) -> bool:
        return bool(self.details.get("is_success", self.result == "SUCCESS"))

    @property
    def user(self):
        return self.actor

    @property
    def endpoint(self):
        return self.connection

    @property
    def user_agent(self) -> str:
        return self.details.get("user_agent", "")

    @property
    def duration_ms(self) -> float:
        return float(self.details.get("duration_ms", 0.0))


# Backward compatibility alias
FHIRAuditLog = IntegrationAuditEvent

