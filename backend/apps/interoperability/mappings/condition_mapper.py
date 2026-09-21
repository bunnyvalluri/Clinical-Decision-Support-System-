"""
Condition FHIR R4 Mapper — BPY-CSE-2666 (Partially Supported).
Extracts external diagnoses/conditions into clinical notes and exports active problem summaries.
"""
from typing import Any, Dict

from apps.clinical.models import ClinicalRecord
from .base import BaseFHIRMapper


class ConditionFHIRMapper(BaseFHIRMapper):
    """
    Translates between ClinicalRecord symptoms/notes and FHIR R4 Condition.
    """

    @classmethod
    def to_fhir(cls, record: ClinicalRecord) -> Dict[str, Any]:
        """Export clinical symptoms/conditions as a FHIR R4 Condition resource."""
        text_summary = record.symptoms or record.clinical_notes or "Clinical observation recorded"
        return {
            "resourceType": "Condition",
            "id": f"cond-{record.id}",
            "clinicalStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": "active",
                        "display": "Active",
                    }
                ]
            },
            "verificationStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                        "code": "confirmed",
                        "display": "Confirmed",
                    }
                ]
            },
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                            "code": "encounter-diagnosis",
                            "display": "Encounter Diagnosis",
                        }
                    ]
                }
            ],
            "code": {
                "text": text_summary,
            },
            "subject": {"reference": f"Patient/{record.patient_id}"},
            "recordedDate": record.recorded_at.isoformat() if record.recorded_at else None,
        }

    @classmethod
    def to_internal(cls, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """Extract condition description for clinical records."""
        patient_ref_id = cls.extract_reference_id(fhir_resource.get("subject"))
        code_obj = fhir_resource.get("code", {})
        condition_text = code_obj.get("text", "")
        if not condition_text:
            codings = code_obj.get("coding", [])
            if codings and isinstance(codings, list):
                condition_text = codings[0].get("display") or codings[0].get("code", "")

        return {
            "patient_id": patient_ref_id,
            "symptoms": condition_text.strip(),
            "recorded_at": cls.parse_datetime(fhir_resource.get("recordedDate")),
        }
