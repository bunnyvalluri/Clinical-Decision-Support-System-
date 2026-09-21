"""
Outbound Clinical Record Export Service — BPY-CSE-2666.
Orchestrates extracting authoritative internal data from Neon PostgreSQL,
mapping to FHIR R4 standard resources, validating, and recording provenance.
"""
from typing import Any, Dict, List, Optional
import uuid
from django.utils import timezone

from apps.clinical.models import ClinicalRecord, ClinicalTask
from apps.interoperability.audit.fhir_audit_logger import FHIRAuditLogger
from apps.interoperability.domain.exceptions import FHIRMappingError
from apps.interoperability.mappings import (
    EncounterFHIRMapper,
    ObservationFHIRMapper,
    PatientFHIRMapper,
    PractitionerFHIRMapper,
    RiskAssessmentFHIRMapper,
    ServiceRequestFHIRMapper,
)
from apps.interoperability.models import FHIREndpoint, FHIRSyncJob
from apps.interoperability.provenance.provenance_tracker import ProvenanceTracker
from apps.interoperability.validators import FHIRR4Validator
from apps.patients.models import Patient
from apps.predictions.models import Prediction


class OutboundExportService:
    """
    Controlled outbound pipeline for exporting HealthNova AI records as standards-based FHIR R4.
    """

    @classmethod
    def export_patient(
        cls,
        patient_id: str,
        endpoint: Optional[FHIREndpoint] = None,
        sync_job: Optional[FHIRSyncJob] = None,
        user: Any = None,
    ) -> Dict[str, Any]:
        """Export a Patient model instance as a FHIR R4 Patient resource."""
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            raise FHIRMappingError(f"Patient with ID '{patient_id}' not found.")

        fhir_patient = PatientFHIRMapper.to_fhir(patient)
        FHIRR4Validator.validate_resource(fhir_patient)

        # Record outbound provenance
        prov = ProvenanceTracker.record_outbound_provenance(
            entity_type="Patient",
            entity_id=str(patient.id),
            fhir_resource=fhir_patient,
            endpoint=endpoint,
            sync_job=sync_job,
        )

        FHIRAuditLogger.log_transaction(
            direction="OUTBOUND",
            operation=f"EXPORT_PATIENT:{patient.mrn}",
            status_code=200,
            is_success=True,
            resource_type="Patient",
            endpoint=endpoint,
            user=user,
            details={"patient_id": str(patient.id), "mrn": patient.mrn, "provenance_id": str(prov.id)},
        )

        return fhir_patient

    @classmethod
    def export_clinical_record_observations(
        cls,
        clinical_record_id: str,
        endpoint: Optional[FHIREndpoint] = None,
        sync_job: Optional[FHIRSyncJob] = None,
        user: Any = None,
    ) -> List[Dict[str, Any]]:
        """Export vitals/labs from a ClinicalRecord as a list of LOINC-coded FHIR R4 Observations."""
        try:
            record = ClinicalRecord.objects.get(id=clinical_record_id)
        except ClinicalRecord.DoesNotExist:
            raise FHIRMappingError(f"ClinicalRecord with ID '{clinical_record_id}' not found.")

        observations = ObservationFHIRMapper.to_fhir(record)
        for obs in observations:
            FHIRR4Validator.validate_resource(obs)
            ProvenanceTracker.record_outbound_provenance(
                entity_type="ClinicalRecord",
                entity_id=str(record.id),
                fhir_resource=obs,
                endpoint=endpoint,
                sync_job=sync_job,
            )

        FHIRAuditLogger.log_transaction(
            direction="OUTBOUND",
            operation=f"EXPORT_OBSERVATIONS:{record.id}",
            status_code=200,
            is_success=True,
            resource_type="Observation",
            endpoint=endpoint,
            user=user,
            details={"clinical_record_id": str(record.id), "observation_count": len(observations)},
        )

        return observations

    @classmethod
    def export_prediction_risk_assessment(
        cls,
        prediction_id: str,
        endpoint: Optional[FHIREndpoint] = None,
        sync_job: Optional[FHIRSyncJob] = None,
        user: Any = None,
    ) -> Dict[str, Any]:
        """Export ML risk prediction as a FHIR R4 RiskAssessment resource."""
        try:
            prediction = Prediction.objects.get(id=prediction_id)
        except Prediction.DoesNotExist:
            raise FHIRMappingError(f"Prediction with ID '{prediction_id}' not found.")

        fhir_ra = RiskAssessmentFHIRMapper.to_fhir(prediction)
        FHIRR4Validator.validate_resource(fhir_ra)

        prov = ProvenanceTracker.record_outbound_provenance(
            entity_type="Prediction",
            entity_id=str(prediction.id),
            fhir_resource=fhir_ra,
            endpoint=endpoint,
            sync_job=sync_job,
        )

        FHIRAuditLogger.log_transaction(
            direction="OUTBOUND",
            operation=f"EXPORT_RISK_ASSESSMENT:{prediction.id}",
            status_code=200,
            is_success=True,
            resource_type="RiskAssessment",
            endpoint=endpoint,
            user=user,
            details={"prediction_id": str(prediction.id), "risk_tier": prediction.prediction_result},
        )

        return fhir_ra

    @classmethod
    def export_patient_bundle(
        cls,
        patient_id: str,
        endpoint: Optional[FHIREndpoint] = None,
        sync_job: Optional[FHIRSyncJob] = None,
        user: Any = None,
    ) -> Dict[str, Any]:
        """
        Export a comprehensive FHIR R4 Bundle containing a patient's complete
        interoperable clinical chart (Patient + Encounters + Observations + RiskAssessments + Tasks).
        """
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            raise FHIRMappingError(f"Patient with ID '{patient_id}' not found.")

        entries: List[Dict[str, Any]] = []

        # 1. Patient
        fhir_patient = PatientFHIRMapper.to_fhir(patient)
        entries.append({
            "fullUrl": f"urn:uuid:{patient.id}",
            "resource": fhir_patient,
        })

        # 2. Encounters & Observations
        records = ClinicalRecord.objects.filter(patient=patient).order_by("-recorded_at")[:20]
        for rec in records:
            # Encounter
            enc = EncounterFHIRMapper.to_fhir(rec)
            entries.append({"fullUrl": f"urn:uuid:{enc['id']}", "resource": enc})

            # Observations
            obs_list = ObservationFHIRMapper.to_fhir(rec)
            for obs in obs_list:
                entries.append({"fullUrl": f"urn:uuid:{obs['id']}", "resource": obs})

        # 3. Risk Assessments
        predictions = Prediction.objects.filter(patient=patient).order_by("-prediction_timestamp")[:10]
        for pred in predictions:
            ra = RiskAssessmentFHIRMapper.to_fhir(pred)
            entries.append({"fullUrl": f"urn:uuid:{ra['id']}", "resource": ra})

        # 4. Tasks / Service Requests
        tasks = ClinicalTask.objects.filter(patient=patient).order_by("-created_at")[:10]
        for task in tasks:
            sr = ServiceRequestFHIRMapper.to_fhir(task)
            entries.append({"fullUrl": f"urn:uuid:{sr['id']}", "resource": sr})

        bundle: Dict[str, Any] = {
            "resourceType": "Bundle",
            "id": f"bundle-{patient.mrn}-{uuid.uuid4().hex[:8]}",
            "type": "collection",
            "timestamp": timezone.now().isoformat(),
            "total": len(entries),
            "entry": entries,
        }

        FHIRAuditLogger.log_transaction(
            direction="OUTBOUND",
            operation=f"EXPORT_BUNDLE:{patient.mrn}",
            status_code=200,
            is_success=True,
            resource_type="Bundle",
            endpoint=endpoint,
            user=user,
            details={"patient_id": str(patient.id), "mrn": patient.mrn, "total_resources": len(entries)},
        )

        return bundle
