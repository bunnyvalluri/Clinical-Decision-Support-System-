"""
Human Review & Conflict Resolution Service — BPY-CSE-2666.
Enforces Invariant #13 (Never overwrite authoritative internal clinical records without explicit rules)
and Invariant #14 (Support human review for ambiguous mappings).
"""
from typing import Any, Dict, List, Optional
from django.utils import timezone

from apps.interoperability.audit.fhir_audit_logger import FHIRAuditLogger
from apps.interoperability.domain.enums import ConflictStatus, ConflictType, ResolutionAction
from apps.interoperability.domain.exceptions import InteroperabilityError
from apps.interoperability.models import FHIREndpoint, FHIRMappingConflict
from apps.patients.models import Patient


class ConflictService:
    """
    Manages the Human Review Queue for clinical data integration conflicts.
    """

    @classmethod
    def create_conflict(
        cls,
        conflict_type: str,
        resource_type: str,
        incoming_payload: Dict[str, Any],
        endpoint: Optional[FHIREndpoint] = None,
        existing_entity_type: str = "",
        existing_entity_id: str = "",
        discrepancy_details: Optional[Dict[str, Any]] = None,
        confidence_score: Optional[float] = None,
    ) -> FHIRMappingConflict:
        """Create a pending conflict record in the Human Review Queue."""
        return FHIRMappingConflict.objects.create(
            conflict_type=conflict_type,
            status=ConflictStatus.PENDING_REVIEW,
            resource_type=resource_type,
            external_system=endpoint,
            incoming_payload=incoming_payload,
            existing_entity_type=existing_entity_type,
            existing_entity_id=str(existing_entity_id),
            discrepancy_details=discrepancy_details or {},
            confidence_score=confidence_score,
        )

    @classmethod
    def resolve_conflict(
        cls,
        conflict_id: str,
        action: str,
        reviewer_user: Any,
        resolution_notes: str = "",
    ) -> FHIRMappingConflict:
        """
        Execute human resolution on a pending conflict.
        Applies changes to Neon PostgreSQL authoritative models if approved.
        """
        try:
            conflict = FHIRMappingConflict.objects.get(id=conflict_id)
        except FHIRMappingConflict.DoesNotExist:
            raise InteroperabilityError(f"Conflict with ID {conflict_id} not found.")

        if conflict.status in (ConflictStatus.APPROVED_APPLY, ConflictStatus.REJECTED):
            raise InteroperabilityError(f"Conflict {conflict_id} is already resolved ({conflict.status}).")

        # Execute selected resolution action
        if action == ResolutionAction.OVERWRITE_EXISTING:
            cls._apply_overwrite(conflict)
            conflict.status = ConflictStatus.APPROVED_APPLY
        elif action == ResolutionAction.MERGE_RECORDS:
            cls._apply_merge(conflict)
            conflict.status = ConflictStatus.APPROVED_APPLY
        elif action == ResolutionAction.CREATE_NEW_RECORD:
            cls._apply_create_new(conflict)
            conflict.status = ConflictStatus.APPROVED_APPLY
        elif action == ResolutionAction.REJECT_INCOMING:
            conflict.status = ConflictStatus.REJECTED
        else:
            raise InteroperabilityError(f"Unsupported resolution action '{action}'.")

        conflict.resolution_action = action
        conflict.resolution_notes = resolution_notes
        conflict.resolved_by = reviewer_user
        conflict.resolved_at = timezone.now()
        conflict.save()

        # Audit log the resolution
        FHIRAuditLogger.log_transaction(
            direction="INBOUND",
            operation=f"RESOLVE_CONFLICT:{action}",
            status_code=200,
            is_success=True,
            resource_type=conflict.resource_type,
            endpoint=conflict.external_system,
            user=reviewer_user,
            details={
                "conflict_id": str(conflict.id),
                "action": action,
                "notes": resolution_notes,
            },
        )

        return conflict

    @classmethod
    def _apply_overwrite(cls, conflict: FHIRMappingConflict) -> None:
        """Apply incoming attributes directly over existing internal record."""
        if conflict.existing_entity_type == "Patient" and conflict.existing_entity_id:
            try:
                patient = Patient.objects.get(id=conflict.existing_entity_id)
                incoming = conflict.incoming_payload
                from apps.interoperability.mappings.patient_mapper import PatientFHIRMapper
                parsed = PatientFHIRMapper.to_internal(incoming)

                # Update allowed fields
                for field in ("first_name", "last_name", "date_of_birth", "gender", "phone_number", "email", "address"):
                    if field in parsed and parsed[field]:
                        setattr(patient, field, parsed[field])
                patient.save()
            except Patient.DoesNotExist:
                raise InteroperabilityError(f"Patient {conflict.existing_entity_id} not found for overwrite.")

    @classmethod
    def _apply_merge(cls, conflict: FHIRMappingConflict) -> None:
        """Fill only missing/blank fields on internal record without overwriting populated values."""
        if conflict.existing_entity_type == "Patient" and conflict.existing_entity_id:
            try:
                patient = Patient.objects.get(id=conflict.existing_entity_id)
                incoming = conflict.incoming_payload
                from apps.interoperability.mappings.patient_mapper import PatientFHIRMapper
                parsed = PatientFHIRMapper.to_internal(incoming)

                for field in ("phone_number", "email", "address", "emergency_contact_name", "emergency_contact_phone"):
                    curr_val = getattr(patient, field, None)
                    new_val = parsed.get(field)
                    if not curr_val and new_val:
                        setattr(patient, field, new_val)
                patient.save()
            except Patient.DoesNotExist:
                raise InteroperabilityError(f"Patient {conflict.existing_entity_id} not found for merge.")

    @classmethod
    def _apply_create_new(cls, conflict: FHIRMappingConflict) -> None:
        """Create a new distinct record in Neon PostgreSQL."""
        if conflict.resource_type == "Patient":
            from apps.interoperability.mappings.patient_mapper import PatientFHIRMapper
            parsed = PatientFHIRMapper.to_internal(conflict.incoming_payload)
            # Ensure unique MRN if collision exists
            orig_mrn = parsed.get("mrn") or "EXT-PATIENT"
            new_mrn = orig_mrn
            counter = 1
            while Patient.objects.filter(mrn=new_mrn).exists():
                new_mrn = f"{orig_mrn}-EXT{counter}"
                counter += 1
            parsed["mrn"] = new_mrn

            new_patient = Patient.objects.create(**parsed)
            conflict.existing_entity_id = str(new_patient.id)
            conflict.existing_entity_type = "Patient"
            conflict.save(update_fields=["existing_entity_id", "existing_entity_type"])
