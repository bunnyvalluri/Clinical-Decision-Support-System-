from django.db import models


class SyncDirection(models.TextChoices):
    INBOUND_IMPORT = "INBOUND_IMPORT", "Inbound Import (External -> HealthNova)"
    OUTBOUND_EXPORT = "OUTBOUND_EXPORT", "Outbound Export (HealthNova -> External)"
    BI_DIRECTIONAL = "BI_DIRECTIONAL", "Bi-directional Synchronization"


class SyncStatus(models.TextChoices):
    PENDING = "PENDING", "Pending / Queued"
    RUNNING = "RUNNING", "Running"
    COMPLETED = "COMPLETED", "Completed Successfully"
    PARTIAL_SUCCESS = "PARTIAL_SUCCESS", "Completed with Partial Failures"
    FAILED = "FAILED", "Failed"
    CANCELLED = "CANCELLED", "Cancelled"


class ConflictType(models.TextChoices):
    DUPLICATE_PATIENT_MATCH = "DUPLICATE_PATIENT_MATCH", "Probabilistic Duplicate Patient Match"
    AMBIGUOUS_MAPPING = "AMBIGUOUS_MAPPING", "Ambiguous Clinical Field Mapping"
    VALUE_OUT_OF_BOUNDS = "VALUE_OUT_OF_BOUNDS", "Physiologically Invalid / Out of Bounds"
    OVERWRITE_PROTECTION_TRIGGERED = "OVERWRITE_PROTECTION_TRIGGERED", "Authoritative Overwrite Protection Triggered"
    UNRECOGNIZED_CODE = "UNRECOGNIZED_CODE", "Unrecognized Terminology / Code System"
    INTEGRITY_VIOLATION = "INTEGRITY_VIOLATION", "Cryptographic or Provenance Integrity Violation"


class ConflictStatus(models.TextChoices):
    PENDING_REVIEW = "PENDING_REVIEW", "Pending Human Clinician / Informaticist Review"
    IN_REVIEW = "IN_REVIEW", "Under Active Investigation"
    APPROVED_APPLY = "APPROVED_APPLY", "Approved & Applied to Authoritative Store"
    REJECTED = "REJECTED", "Rejected by Reviewer"
    DISMISSED = "DISMISSED", "Dismissed (Benign / Irrelevant)"


class ResolutionAction(models.TextChoices):
    OVERWRITE_EXISTING = "OVERWRITE_EXISTING", "Overwrite Authoritative Internal Record"
    MERGE_RECORDS = "MERGE_RECORDS", "Merge Non-Conflicting Attributes"
    CREATE_NEW_RECORD = "CREATE_NEW_RECORD", "Create Disjoint Internal Record"
    REJECT_INCOMING = "REJECT_INCOMING", "Reject Incoming Payload Without Modification"


class TrustLevel(models.TextChoices):
    UNTRUSTED = "UNTRUSTED", "Untrusted / Sandbox"
    REVIEWED = "REVIEWED", "Reviewed Partner System"
    APPROVED_RESTRICTED = "APPROVED_RESTRICTED", "Approved (Read Only / Restricted)"
    AUTHORITATIVE_PARTNER = "AUTHORITATIVE_PARTNER", "Authoritative Clinical Partner (EHR/HIE)"


class FHIRResourceStatus(models.TextChoices):
    SUPPORTED = "SUPPORTED", "Fully Supported"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED", "Partially Supported"
    NOT_SUPPORTED = "NOT_SUPPORTED", "Not Supported"
    PLANNED = "PLANNED", "Planned for Future Release"
