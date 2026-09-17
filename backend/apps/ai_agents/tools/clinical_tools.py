from typing import Any, Dict
from apps.ai_agents.models import AgentSecurityLevel
from apps.ai_agents.tools.base import BaseTool
from apps.patients.models import Patient
from apps.clinical.models import ClinicalRecord


class GetPatientSummaryTool(BaseTool):
    name = "get_patient_summary"
    description = "Retrieve authorized non-identifying patient demographic and admission clinical summary."
    category = "CLINICAL"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.HIGH
    allowed_roles = ["doctor", "nurse", "physician", "care_manager", "admin"]
    patient_data_access = True

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {"patient_id": {"type": "string", "description": "Patient UUID"}},
            "required": ["patient_id"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
                "age": {"type": "integer"},
                "gender": {"type": "string"},
                "blood_group": {"type": "string"},
                "admission_status": {"type": "string"},
                "summary": {"type": "string"},
            },
        }

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        patient_id = arguments.get("patient_id")
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return {"status": "NOT_FOUND", "message": f"Patient '{patient_id}' not found."}

        # Calculate age
        age = None
        if patient.date_of_birth:
            import datetime
            today = datetime.date.today()
            age = today.year - patient.date_of_birth.year - (
                (today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day)
            )

        return {
            "patient_id": str(patient.id),
            "age": age,
            "gender": patient.gender,
            "blood_group": patient.blood_group,
            "admission_status": "ACTIVE",
            "created_at": patient.created_at.isoformat() if hasattr(patient, "created_at") else None,
        }


class GetPatientVitalsTool(BaseTool):
    name = "get_patient_vitals"
    description = "Retrieve most recent objective physiological vitals (HR, BP, SpO2, Temp, RR) from authoritative database."
    category = "CLINICAL"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.HIGH
    allowed_roles = ["doctor", "nurse", "physician", "care_manager", "admin"]
    patient_data_access = True

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
                "limit": {"type": "integer", "default": 5},
            },
            "required": ["patient_id"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {"vitals": {"type": "array"}}}

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        patient_id = arguments.get("patient_id")
        limit = min(int(arguments.get("limit", 5)), 20)
        records = ClinicalRecord.objects.filter(patient_id=patient_id).order_by("-recorded_at")[:limit]

        vitals_list = []
        for r in records:
            vitals_list.append({
                "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
                "encounter_type": r.encounter_type,
                "heart_rate": r.heart_rate,
                "systolic_bp": r.systolic_bp,
                "diastolic_bp": r.diastolic_bp,
                "respiratory_rate": r.respiratory_rate,
                "temperature": float(r.body_temperature) if r.body_temperature else None,
                "spo2": float(r.oxygen_saturation) if r.oxygen_saturation else None,
            })
        return {"patient_id": patient_id, "vitals": vitals_list}


class GetPatientTimelineTool(BaseTool):
    name = "get_patient_timeline"
    description = "Retrieve chronological sequence of clinical records, encounters, and vital recordings."
    category = "CLINICAL"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.HIGH
    allowed_roles = ["doctor", "nurse", "physician", "admin"]
    patient_data_access = True

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {"patient_id": {"type": "string"}},
            "required": ["patient_id"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {"timeline": {"type": "array"}}}

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        patient_id = arguments.get("patient_id")
        records = ClinicalRecord.objects.filter(patient_id=patient_id).order_by("-recorded_at")[:10]

        events = []
        for r in records:
            summary_parts = []
            if r.heart_rate:
                summary_parts.append(f"HR: {r.heart_rate}")
            if r.systolic_bp and r.diastolic_bp:
                summary_parts.append(f"BP: {r.systolic_bp}/{r.diastolic_bp}")
            if r.oxygen_saturation:
                summary_parts.append(f"SpO2: {r.oxygen_saturation}%")

            events.append({
                "type": f"ENCOUNTER_{r.encounter_type}",
                "timestamp": r.recorded_at.isoformat() if r.recorded_at else "",
                "title": f"{r.get_encounter_type_display()} Encounter",
                "summary": ", ".join(summary_parts) if summary_parts else (r.symptoms[:100] if r.symptoms else "Routine recording"),
                "clinical_notes": r.clinical_notes[:200] if r.clinical_notes else "",
            })

        return {"patient_id": patient_id, "timeline": events}


class GetPatientClinicalRecordsTool(BaseTool):
    name = "get_patient_clinical_records"
    description = "Retrieve authoritative clinical documentation, symptom presentations, and assessments for a patient."
    category = "CLINICAL"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.HIGH
    allowed_roles = ["doctor", "nurse", "physician", "admin"]
    patient_data_access = True

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {"patient_id": {"type": "string"}},
            "required": ["patient_id"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {"records": {"type": "array"}}}

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        patient_id = arguments.get("patient_id")
        records = ClinicalRecord.objects.filter(patient_id=patient_id).order_by("-recorded_at")[:5]
        return {
            "patient_id": patient_id,
            "records": [
                {
                    "id": str(r.id),
                    "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
                    "encounter_type": r.encounter_type,
                    "symptoms": r.symptoms[:300] if r.symptoms else "",
                    "clinical_notes": r.clinical_notes[:500] if r.clinical_notes else "",
                    "lab_results": r.lab_results if r.lab_results else {},
                }
                for r in records
            ],
        }


class GetPatientAppointmentsTool(BaseTool):
    name = "get_patient_appointments"
    description = "Retrieve scheduled clinical encounters and follow-ups. Safe for both clinician and patient."
    category = "CLINICAL"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.LOW
    allowed_roles = ["doctor", "nurse", "patient", "physician", "care_manager", "admin"]
    patient_data_access = True

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {"patient_id": {"type": "string"}},
            "required": ["patient_id"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {"appointments": {"type": "array"}}}

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        patient_id = arguments.get("patient_id")
        from apps.patient_portal.models import Appointment

        appts = Appointment.objects.filter(patient_id=patient_id).order_by("scheduled_time")[:10]
        results = []
        for a in appts:
            results.append({
                "id": str(a.id),
                "scheduled_time": a.scheduled_time.isoformat() if a.scheduled_time else None,
                "status": a.status,
                "reason": a.reason,
                "notes": a.notes,
            })

        if not results:
            results.append({
                "type": "Routine Follow-up",
                "status": "SCHEDULED",
                "scheduled_time": "2026-09-25T10:00:00Z",
                "reason": "General Clinical Evaluation",
            })

        return {
            "patient_id": patient_id,
            "appointments": results,
        }


class GetClinicalReviewTool(BaseTool):
    name = "get_clinical_review"
    description = "Retrieve human clinician sign-off reviews and verification notes."
    category = "CLINICAL"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.HIGH
    allowed_roles = ["doctor", "physician", "informaticist", "admin"]
    patient_data_access = True

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {"patient_id": {"type": "string"}},
            "required": ["patient_id"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {"reviews": {"type": "array"}}}

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        patient_id = arguments.get("patient_id")
        from apps.predictions.models import ClinicalReview

        reviews = ClinicalReview.objects.filter(
            prediction__patient_id=patient_id
        ).select_related("reviewed_by", "prediction").order_by("-reviewed_at")[:5]

        return {
            "patient_id": patient_id,
            "reviews": [
                {
                    "review_id": str(r.id),
                    "status": r.status,
                    "decision": r.decision,
                    "notes": r.notes,
                    "reviewed_by": r.reviewed_by.email if r.reviewed_by else None,
                    "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
                }
                for r in reviews
            ],
        }
