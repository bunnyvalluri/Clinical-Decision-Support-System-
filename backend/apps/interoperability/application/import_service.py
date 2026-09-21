"""
Inbound Clinical Record Import Service — BPY-CSE-2666.
Orchestrates the complete inbound interoperability pipeline:
Security Scan -> FHIR Validation -> Normalization -> Duplicate Detection ->
Clinical Bounds -> Overwrite Protection -> Neon PostgreSQL Persistence -> Provenance & Audit.
"""
from typing import Any, Dict, List, Optional, Tuple
from django.db import transaction

from apps.clinical.models import ClinicalRecord
from apps.interoperability.audit.fhir_audit_logger import FHIRAuditLogger
from apps.interoperability.domain.enums import ConflictType
from apps.interoperability.domain.exceptions import (
    ClinicalBoundsViolationError,
    FHIRMappingError,
    FHIRSecurityError,
    FHIRValidationError,
    OverwriteProtectionError,
)
from apps.interoperability.mappings import (
    EncounterFHIRMapper,
    ObservationFHIRMapper,
    PatientFHIRMapper,
)
from apps.interoperability.models import FHIREndpoint, FHIRSyncJob
from apps.interoperability.provenance.provenance_tracker import ProvenanceTracker
from apps.interoperability.validators import (
    ClinicalBoundsValidator,
    FHIRR4Validator,
    SecuritySanitizer,
)
from apps.patients.models import Patient
from .conflict_service import ConflictService
from .reconciliation_service import ReconciliationService


class InboundImportService:
    """
    Controlled inbound pipeline for ingesting external FHIR R4 clinical data into HealthNova AI.
    """

    @classmethod
    def import_resource(
        cls,
        payload: Dict[str, Any],
        endpoint: Optional[FHIREndpoint] = None,
        sync_job: Optional[FHIRSyncJob] = None,
        user: Any = None,
        allow_force_overwrite: bool = False,
    ) -> Dict[str, Any]:
        """
        Execute the inbound ingestion pipeline for a single FHIR R4 resource or bundle.
        Returns a summary dict with status, entity_id, conflict_id, or errors.
        """
        # Step 1: Security & Injection Scan
        sanitized_payload = SecuritySanitizer.sanitize_payload(payload)

        # Step 2: FHIR R4 Structural & Schema Validation
        FHIRR4Validator.validate_resource(sanitized_payload)

        resource_type = sanitized_payload.get("resourceType")

        if resource_type == "Bundle":
            return cls._import_bundle(sanitized_payload, endpoint, sync_job, user)
        elif resource_type == "Patient":
            return cls._import_patient(sanitized_payload, endpoint, sync_job, user, allow_force_overwrite)
        elif resource_type == "Observation":
            return cls._import_observation(sanitized_payload, endpoint, sync_job, user)
        elif resource_type == "Encounter":
            return cls._import_encounter(sanitized_payload, endpoint, sync_job, user)
        else:
            raise FHIRMappingError(f"Resource type '{resource_type}' is not yet supported for direct inbound import.")

    @classmethod
    def _import_patient(
        cls,
        fhir_patient: Dict[str, Any],
        endpoint: Optional[FHIREndpoint],
        sync_job: Optional[FHIRSyncJob],
        user: Any,
        allow_force_overwrite: bool,
    ) -> Dict[str, Any]:
        """Import FHIR Patient resource into Neon PostgreSQL."""
        # 1. Map to internal dictionary
        parsed_data = PatientFHIRMapper.to_internal(fhir_patient)
        mrn = parsed_data.get("mrn")

        if not mrn:
            # Generate deterministic fallback MRN for incoming external patient
            ext_id = fhir_patient.get("id") or "UNSPECIFIED"
            parsed_data["mrn"] = f"EXT-{ext_id[:20]}"

        # 2. Duplicate Detection & Patient Reconciliation
        match_score = ReconciliationService.match_patient(parsed_data)

        if match_score.match_tier in ("EXACT", "EXACT_DEMOGRAPHIC"):
            existing_patient = Patient.objects.get(id=match_score.matched_patient_id)
            discrepancies = ReconciliationService.calculate_field_discrepancies(existing_patient, parsed_data)

            if discrepancies and not allow_force_overwrite:
                # Overwrite Protection Triggered -> Route to Human Review Queue
                conflict = ConflictService.create_conflict(
                    conflict_type=ConflictType.OVERWRITE_PROTECTION_TRIGGERED,
                    resource_type="Patient",
                    incoming_payload=fhir_patient,
                    endpoint=endpoint,
                    existing_entity_type="Patient",
                    existing_entity_id=str(existing_patient.id),
                    discrepancy_details=discrepancies,
                    confidence_score=match_score.confidence_score,
                )
                FHIRAuditLogger.log_transaction(
                    direction="INBOUND",
                    operation="IMPORT_PATIENT:CONFLICT",
                    status_code=409,
                    is_success=False,
                    resource_type="Patient",
                    endpoint=endpoint,
                    user=user,
                    details={"conflict_id": str(conflict.id), "discrepancies": discrepancies},
                )
                return {
                    "status": "CONFLICT",
                    "conflict_id": str(conflict.id),
                    "matched_patient_id": str(existing_patient.id),
                    "message": "Authoritative overwrite protection triggered. Queued for human review.",
                }
            elif discrepancies and allow_force_overwrite:
                # Explicitly approved overwrite
                for k, v in parsed_data.items():
                    if v is not None:
                        setattr(existing_patient, k, v)
                existing_patient.save()
                prov = ProvenanceTracker.record_inbound_provenance(
                    entity_type="Patient",
                    entity_id=str(existing_patient.id),
                    fhir_resource=fhir_patient,
                    endpoint=endpoint,
                    sync_job=sync_job,
                    patient_id=str(existing_patient.id),
                )
                return {"status": "UPDATED", "patient_id": str(existing_patient.id), "provenance_id": str(prov.id)}
            else:
                # No discrepancies; record provenance and return existing
                prov = ProvenanceTracker.record_inbound_provenance(
                    entity_type="Patient",
                    entity_id=str(existing_patient.id),
                    fhir_resource=fhir_patient,
                    endpoint=endpoint,
                    sync_job=sync_job,
                    patient_id=str(existing_patient.id),
                )
                return {"status": "EXISTING_MATCH", "patient_id": str(existing_patient.id), "provenance_id": str(prov.id)}

        elif match_score.match_tier in ("PROBABLE", "POSSIBLE"):
            # Probabilistic match -> Ambiguous duplicate match, route to human review
            conflict = ConflictService.create_conflict(
                conflict_type=ConflictType.DUPLICATE_PATIENT_MATCH,
                resource_type="Patient",
                incoming_payload=fhir_patient,
                endpoint=endpoint,
                existing_entity_type="Patient",
                existing_entity_id=str(match_score.matched_patient_id),
                discrepancy_details={"matched_fields": list(match_score.matched_fields)},
                confidence_score=match_score.confidence_score,
            )
            return {
                "status": "CONFLICT",
                "conflict_id": str(conflict.id),
                "matched_patient_id": match_score.matched_patient_id,
                "message": f"Probabilistic duplicate detected ({match_score.confidence_score:.2%}). Queued for human review.",
            }

        # 3. Clean New Patient Record -> Persist to Neon PostgreSQL
        with transaction.atomic():
            new_patient = Patient.objects.create(**parsed_data)
            prov = ProvenanceTracker.record_inbound_provenance(
                entity_type="Patient",
                entity_id=str(new_patient.id),
                fhir_resource=fhir_patient,
                endpoint=endpoint,
                sync_job=sync_job,
                patient_id=str(new_patient.id),
            )

        FHIRAuditLogger.log_transaction(
            direction="INBOUND",
            operation="IMPORT_PATIENT:CREATE",
            status_code=201,
            is_success=True,
            resource_type="Patient",
            endpoint=endpoint,
            user=user,
            details={"patient_id": str(new_patient.id), "mrn": new_patient.mrn},
        )

        return {
            "status": "CREATED",
            "patient_id": str(new_patient.id),
            "mrn": new_patient.mrn,
            "provenance_id": str(prov.id),
        }

    @classmethod
    def _import_observation(
        cls,
        fhir_observation: Dict[str, Any],
        endpoint: Optional[FHIREndpoint],
        sync_job: Optional[FHIRSyncJob],
        user: Any,
    ) -> Dict[str, Any]:
        """Import FHIR Observation into internal ClinicalRecord."""
        parsed_data = ObservationFHIRMapper.to_internal(fhir_observation)
        patient_id = parsed_data.pop("patient_id", None)

        if not patient_id:
            raise FHIRMappingError("Observation is missing valid subject/patient reference.")

        # Verify patient exists in authoritative store
        patient = Patient.objects.filter(id=patient_id).first()
        if not patient:
            # Check by MRN if ID was external MRN
            patient = Patient.objects.filter(mrn=patient_id).first()
            if not patient:
                raise FHIRMappingError(f"Referenced Patient '{patient_id}' does not exist in HealthNova AI.")

        # Clinical Bounds & Safety Validation
        violations = ClinicalBoundsValidator.validate_clinical_dict(parsed_data, raise_exception=False)
        if violations:
            conflict = ConflictService.create_conflict(
                conflict_type=ConflictType.VALUE_OUT_OF_BOUNDS,
                resource_type="Observation",
                incoming_payload=fhir_observation,
                endpoint=endpoint,
                existing_entity_type="Patient",
                existing_entity_id=str(patient.id),
                discrepancy_details={"violations": violations},
            )
            return {
                "status": "CONFLICT",
                "conflict_id": str(conflict.id),
                "message": f"Physiological bounds violation ({len(violations)} field(s)). Queued for human review.",
            }

        # Persist as a verified ClinicalRecord in Neon PostgreSQL
        with transaction.atomic():
            clinical_rec = ClinicalRecord.objects.create(
                patient=patient,
                recorded_by=user if getattr(user, "is_authenticated", False) else None,
                **parsed_data,
            )
            prov = ProvenanceTracker.record_inbound_provenance(
                entity_type="ClinicalRecord",
                entity_id=str(clinical_rec.id),
                fhir_resource=fhir_observation,
                endpoint=endpoint,
                sync_job=sync_job,
                patient_id=str(patient.id),
            )

        FHIRAuditLogger.log_transaction(
            direction="INBOUND",
            operation="IMPORT_OBSERVATION:CREATE",
            status_code=201,
            is_success=True,
            resource_type="Observation",
            endpoint=endpoint,
            user=user,
            details={"clinical_record_id": str(clinical_rec.id), "patient_id": str(patient.id)},
        )

        return {
            "status": "CREATED",
            "clinical_record_id": str(clinical_rec.id),
            "patient_id": str(patient.id),
            "provenance_id": str(prov.id),
        }

    @classmethod
    def _import_encounter(
        cls,
        fhir_encounter: Dict[str, Any],
        endpoint: Optional[FHIREndpoint],
        sync_job: Optional[FHIRSyncJob],
        user: Any,
    ) -> Dict[str, Any]:
        """Import FHIR Encounter into internal ClinicalRecord."""
        parsed_data = EncounterFHIRMapper.to_internal(fhir_encounter)
        patient_id = parsed_data.pop("patient_id", None)

        if not patient_id:
            raise FHIRMappingError("Encounter is missing valid subject/patient reference.")

        patient = Patient.objects.filter(id=patient_id).first()
        if not patient:
            patient = Patient.objects.filter(mrn=patient_id).first()
            if not patient:
                raise FHIRMappingError(f"Referenced Patient '{patient_id}' does not exist.")

        with transaction.atomic():
            clinical_rec = ClinicalRecord.objects.create(
                patient=patient,
                recorded_by=user if getattr(user, "is_authenticated", False) else None,
                **parsed_data,
            )
            prov = ProvenanceTracker.record_inbound_provenance(
                entity_type="ClinicalRecord",
                entity_id=str(clinical_rec.id),
                fhir_resource=fhir_encounter,
                endpoint=endpoint,
                sync_job=sync_job,
                patient_id=str(patient.id),
            )

        return {
            "status": "CREATED",
            "clinical_record_id": str(clinical_rec.id),
            "patient_id": str(patient.id),
            "provenance_id": str(prov.id),
        }

    @classmethod
    def _import_bundle(
        cls,
        fhir_bundle: Dict[str, Any],
        endpoint: Optional[FHIREndpoint],
        sync_job: Optional[FHIRSyncJob],
        user: Any,
    ) -> Dict[str, Any]:
        """Process a multi-resource FHIR Bundle (e.g. Patient + Observations)."""
        entries = fhir_bundle.get("entry", [])
        results: List[Dict[str, Any]] = []
        created_count = 0
        conflict_count = 0
        error_count = 0

        # Sort entries so Patients are processed before Observations/Encounters
        sorted_entries = sorted(
            entries,
            key=lambda e: 0 if e.get("resource", {}).get("resourceType") == "Patient" else 1,
        )

        for entry in sorted_entries:
            res = entry.get("resource")
            if not res:
                continue
            try:
                outcome = cls.import_resource(res, endpoint, sync_job, user)
                results.append(outcome)
                if outcome.get("status") == "CREATED":
                    created_count += 1
                elif outcome.get("status") == "CONFLICT":
                    conflict_count += 1
            except Exception as e:
                error_count += 1
                results.append({"status": "ERROR", "error": str(e), "resourceType": res.get("resourceType")})

        return {
            "status": "BUNDLE_PROCESSED",
            "total_entries": len(entries),
            "created_count": created_count,
            "conflict_count": conflict_count,
            "error_count": error_count,
            "results": results,
        }
