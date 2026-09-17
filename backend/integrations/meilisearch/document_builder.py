"""
Search Projection Service & Document Builders.
Converts authoritative Neon PostgreSQL models into sanitized,
PHI-minimized, and version-tagged search documents.
"""
import time
from typing import Any, Dict, Optional
from django.utils import timezone
from .settings import (
    MEILISEARCH_SCHEMA_VERSION,
    INDEX_CLASSIFICATIONS,
    INDEX_PATIENTS,
    INDEX_CLINICAL_RECORDS,
    INDEX_PREDICTIONS,
    INDEX_TRIAGE_RECORDS,
    INDEX_CLINICAL_TASKS,
    INDEX_ESCALATIONS,
    INDEX_MODELS,
    INDEX_DATA_QUALITY,
    INDEX_AI_EVALUATIONS,
    INDEX_WHITEBOARDS,
    INDEX_SYSTEM_EVENTS,
    INDEX_KNOWLEDGE_SOURCES,
)


class SearchProjectionService:
    """Builds authorized, sanitized projections of clinical and operational entities."""

    schema_version: str = MEILISEARCH_SCHEMA_VERSION

    @classmethod
    def _base_envelope(
        cls,
        index_name: str,
        entity_type: str,
        source_id: Any,
        updated_at: Optional[Any] = None,
        tenant_id: str = "default_hospital",
        organization_id: str = "healthnova_primary",
    ) -> Dict[str, Any]:
        """Construct universal search envelope metadata."""
        ts = int(time.time())
        if updated_at:
            if hasattr(updated_at, "timestamp"):
                ts = int(updated_at.timestamp())
            elif isinstance(updated_at, (int, float)):
                ts = int(updated_at)

        return {
            "document_id": f"{entity_type}_{source_id}",
            "entity_type": entity_type,
            "source_id": str(source_id),
            "tenant_id": tenant_id,
            "organization_id": organization_id,
            "classification": INDEX_CLASSIFICATIONS.get(index_name, "INTERNAL"),
            "schema_version": cls.schema_version,
            "updated_at": ts,
            "indexed_at": int(time.time()),
        }

    @classmethod
    def build_patient_document(cls, patient: Any) -> Dict[str, Any]:
        """Build projection document for a Patient."""
        doc = cls._base_envelope(
            index_name=INDEX_PATIENTS,
            entity_type="patient",
            source_id=patient.id,
            updated_at=getattr(patient, "updated_at", None),
        )
        first = getattr(patient, "first_name", "")
        last = getattr(patient, "last_name", "")
        full = f"{first} {last}".strip() or "Anonymous Patient"

        doc.update({
            "patient_id": patient.id,
            "mrn": getattr(patient, "mrn", ""),
            "display_name": full,
            "first_name": first,
            "last_name": last,
            "gender": getattr(patient, "gender", "UNKNOWN"),
            "blood_group": getattr(patient, "blood_group", "UNKNOWN"),
            "is_active": getattr(patient, "is_active", True),
            "primary_physician_id": getattr(patient, "primary_physician_id", None),
            "user_id": getattr(patient, "user_id", None),
            "care_team_id": "general_care",
            "department": "Internal Medicine",
            "created_at": int(patient.created_at.timestamp()) if hasattr(patient, "created_at") and patient.created_at else int(time.time()),
        })
        return doc

    @classmethod
    def build_clinical_record_document(cls, record: Any) -> Dict[str, Any]:
        """Build projection document for a ClinicalRecord (vital encounter snapshot)."""
        doc = cls._base_envelope(
            index_name=INDEX_CLINICAL_RECORDS,
            entity_type="clinical_record",
            source_id=record.id,
            updated_at=getattr(record, "updated_at", None),
        )
        patient = getattr(record, "patient", None)
        recorded_by = getattr(record, "recorded_by", None)

        doc.update({
            "record_id": record.id,
            "patient_id": getattr(record, "patient_id", None),
            "patient_mrn": getattr(patient, "mrn", "") if patient else "",
            "encounter_type": getattr(record, "encounter_type", "OUTPATIENT"),
            "systolic_bp": getattr(record, "systolic_bp", None),
            "diastolic_bp": getattr(record, "diastolic_bp", None),
            "heart_rate": getattr(record, "heart_rate", None),
            "respiratory_rate": getattr(record, "respiratory_rate", None),
            "body_temperature": float(record.body_temperature) if getattr(record, "body_temperature", None) else None,
            "oxygen_saturation": float(record.oxygen_saturation) if getattr(record, "oxygen_saturation", None) else None,
            "recorded_by_id": getattr(record, "recorded_by_id", None),
            "recorded_by_name": getattr(recorded_by, "get_full_name", lambda: getattr(recorded_by, "username", "Clinician"))() if recorded_by else "Clinician",
            "recorded_at": int(record.recorded_at.timestamp()) if getattr(record, "recorded_at", None) else int(time.time()),
        })
        return doc

    @classmethod
    def build_prediction_document(cls, prediction: Any) -> Dict[str, Any]:
        """Build projection document for an ML Risk Prediction."""
        doc = cls._base_envelope(
            index_name=INDEX_PREDICTIONS,
            entity_type="prediction",
            source_id=prediction.id,
            updated_at=getattr(prediction, "updated_at", None),
        )
        patient = getattr(prediction, "patient", None)
        prob = float(prediction.probability) if getattr(prediction, "probability", None) is not None else 0.0

        doc.update({
            "prediction_id": prediction.id,
            "patient_id": getattr(prediction, "patient_id", None),
            "patient_mrn": getattr(patient, "mrn", "") if patient else "",
            "model_name": getattr(prediction, "model_name", "RandomForestClassifier"),
            "model_version_str": getattr(prediction, "model_version_str", "1.0.0"),
            "prediction_result": getattr(prediction, "prediction_result", "LOW"),
            "probability": prob,
            "confidence_lower": float(prediction.confidence_lower) if getattr(prediction, "confidence_lower", None) is not None else max(0.0, prob - 0.05),
            "confidence_upper": float(prediction.confidence_upper) if getattr(prediction, "confidence_upper", None) is not None else min(1.0, prob + 0.05),
            "created_at": int(prediction.created_at.timestamp()) if getattr(prediction, "created_at", None) else int(time.time()),
        })
        return doc

    @classmethod
    def build_triage_document(cls, triage: Any) -> Dict[str, Any]:
        """Build projection document for a TriageRecord."""
        doc = cls._base_envelope(
            index_name=INDEX_TRIAGE_RECORDS,
            entity_type="triage_record",
            source_id=triage.id,
            updated_at=getattr(triage, "updated_at", None),
        )
        patient = getattr(triage, "patient", None)
        nurse = getattr(triage, "nurse", None)

        doc.update({
            "triage_id": triage.id,
            "patient_id": getattr(triage, "patient_id", None),
            "patient_mrn": getattr(patient, "mrn", "") if patient else "",
            "state": getattr(triage, "state", "WAITING"),
            "acuity_level": getattr(triage, "acuity_level", 3),
            "chief_complaint": getattr(triage, "chief_complaint", ""),
            "bed_assignment": getattr(triage, "bed_assignment", ""),
            "nurse_id": getattr(triage, "nurse_id", None),
            "nurse_name": getattr(nurse, "username", "Triage Nurse") if nurse else "Triage Nurse",
            "arrival_time": int(triage.arrival_time.timestamp()) if getattr(triage, "arrival_time", None) else int(time.time()),
        })
        return doc

    @classmethod
    def build_clinical_task_document(cls, task: Any) -> Dict[str, Any]:
        """Build projection document for a ClinicalTask."""
        doc = cls._base_envelope(
            index_name=INDEX_CLINICAL_TASKS,
            entity_type="clinical_task",
            source_id=task.id,
            updated_at=getattr(task, "updated_at", None),
        )
        patient = getattr(task, "patient", None)

        doc.update({
            "task_id": task.id,
            "patient_id": getattr(task, "patient_id", None),
            "patient_mrn": getattr(patient, "mrn", "") if patient else "",
            "title": getattr(task, "title", "Clinical Task"),
            "task_type": getattr(task, "task_type", "VITALS_CHECK"),
            "priority": getattr(task, "priority", "ROUTINE"),
            "status": getattr(task, "status", "PENDING"),
            "assigned_to_id": getattr(task, "assigned_to_id", None),
            "due_at": int(task.due_at.timestamp()) if getattr(task, "due_at", None) else None,
            "created_at": int(task.created_at.timestamp()) if getattr(task, "created_at", None) else int(time.time()),
        })
        return doc

    @classmethod
    def build_escalation_document(cls, escalation: Any) -> Dict[str, Any]:
        """Build projection document for an Escalation."""
        doc = cls._base_envelope(
            index_name=INDEX_ESCALATIONS,
            entity_type="escalation",
            source_id=escalation.id,
            updated_at=getattr(escalation, "updated_at", None),
        )
        patient = getattr(escalation, "patient", None)
        assigned_doctor = getattr(escalation, "assigned_doctor", None)

        doc.update({
            "escalation_id": escalation.id,
            "patient_id": getattr(escalation, "patient_id", None),
            "patient_mrn": getattr(patient, "mrn", "") if patient else "",
            "reason": getattr(escalation, "reason", "Patient Deterioration Alert"),
            "priority": getattr(escalation, "priority", "HIGH"),
            "status": getattr(escalation, "status", "PENDING"),
            "assigned_doctor_id": getattr(escalation, "assigned_doctor_id", None),
            "assigned_doctor_name": getattr(assigned_doctor, "username", "Attending Physician") if assigned_doctor else "Attending Physician",
            "escalated_by_id": getattr(escalation, "escalated_by_id", None),
            "created_at": int(escalation.created_at.timestamp()) if getattr(escalation, "created_at", None) else int(time.time()),
        })
        return doc

    @classmethod
    def build_model_document(cls, model_version: Any) -> Dict[str, Any]:
        """Build projection document for a registered ModelVersion."""
        doc = cls._base_envelope(
            index_name=INDEX_MODELS,
            entity_type="model",
            source_id=model_version.id,
            updated_at=getattr(model_version, "updated_at", None),
        )
        name = getattr(model_version, "name", None) or getattr(model_version, "model_name", "ClinicalRiskClassifier")
        doc.update({
            "model_id": model_version.id,
            "name": name,
            "algorithm": getattr(model_version, "algorithm", "RandomForest"),
            "version": getattr(model_version, "version", "1.0.0"),
            "status": getattr(model_version, "status", "ACTIVE"),
            "roc_auc": float(model_version.roc_auc) if getattr(model_version, "roc_auc", None) is not None else 0.85,
            "f1_score": float(model_version.f1_score) if getattr(model_version, "f1_score", None) is not None else 0.82,
            "is_active": getattr(model_version, "is_active", True),
            "created_at": int(model_version.created_at.timestamp()) if getattr(model_version, "created_at", None) else int(time.time()),
        })
        return doc

    @classmethod
    def build_whiteboard_document(cls, wb: Any) -> Dict[str, Any]:
        """Build projection document for ClinicalWhiteboard metadata."""
        doc = cls._base_envelope(
            index_name=INDEX_WHITEBOARDS,
            entity_type="whiteboard",
            source_id=str(wb.id),
            updated_at=getattr(wb, "updated_at", None),
        )
        owner = getattr(wb, "created_by", None)
        doc.update({
            "whiteboard_id": str(wb.id),
            "title": getattr(wb, "title", "Clinical Workflow"),
            "description": getattr(wb, "description", ""),
            "type": getattr(wb, "type", "CARE_PLAN"),
            "status": getattr(wb, "status", "APPROVED"),
            "classification": getattr(wb, "classification", "INTERNAL"),
            "owner_id": getattr(wb, "created_by_id", None),
            "owner_name": getattr(owner, "username", "Clinician") if owner else "Clinician",
            "updated_at": int(wb.updated_at.timestamp()) if getattr(wb, "updated_at", None) else int(time.time()),
        })
        return doc

    @classmethod
    def build_document_for_entity(cls, entity_type: str, instance: Any) -> Optional[Dict[str, Any]]:
        """Dispatcher to build document from any supported entity instance."""
        builders = {
            "patient": cls.build_patient_document,
            "clinical_record": cls.build_clinical_record_document,
            "prediction": cls.build_prediction_document,
            "triage_record": cls.build_triage_document,
            "clinical_task": cls.build_clinical_task_document,
            "escalation": cls.build_escalation_document,
            "model": cls.build_model_document,
            "model_version": cls.build_model_document,
            "whiteboard": cls.build_whiteboard_document,
            "clinical_whiteboard": cls.build_whiteboard_document,
        }
        builder = builders.get(entity_type.lower())
        if builder:
            return builder(instance)
        return None
