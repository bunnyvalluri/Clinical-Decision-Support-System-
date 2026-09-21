"""
Encounter FHIR R4 Mapper — BPY-CSE-2666.
Bi-directional translation between internal ClinicalRecord / TriageRecord encounters and FHIR R4 Encounter.
"""
from typing import Any, Dict, Optional

from apps.clinical.models import ClinicalRecord, EncounterType, TriageRecord
from .base import BaseFHIRMapper


class EncounterFHIRMapper(BaseFHIRMapper):
    """
    Translates between ClinicalRecord/TriageRecord and FHIR R4 Encounter resources.
    """

    CLASS_MAP_INTERNAL_TO_FHIR = {
        EncounterType.ROUTINE: {"code": "AMB", "display": "ambulatory", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"},
        EncounterType.OUTPATIENT: {"code": "AMB", "display": "ambulatory", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"},
        EncounterType.INPATIENT: {"code": "IMP", "display": "inpatient encounter", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"},
        EncounterType.EMERGENCY: {"code": "EMER", "display": "emergency", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"},
        EncounterType.ICU: {"code": "ACUTE", "display": "inpatient acute", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"},
    }

    CLASS_MAP_FHIR_TO_INTERNAL = {
        "AMB": EncounterType.OUTPATIENT,
        "IMP": EncounterType.INPATIENT,
        "EMER": EncounterType.EMERGENCY,
        "ACUTE": EncounterType.ICU,
    }

    @classmethod
    def to_fhir(cls, record: ClinicalRecord) -> Dict[str, Any]:
        """Convert ClinicalRecord encounter into a FHIR R4 Encounter resource."""
        act_class = cls.CLASS_MAP_INTERNAL_TO_FHIR.get(
            record.encounter_type,
            {"code": "AMB", "display": "ambulatory", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}
        )

        participants = []
        if record.recorded_by_id:
            participants.append({
                "type": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", "code": "PPRF", "display": "primary performer"}]}],
                "individual": {
                    "reference": f"Practitioner/{record.recorded_by_id}",
                    "display": record.recorded_by.get_full_name() if record.recorded_by else None,
                },
            })

        fhir_encounter: Dict[str, Any] = {
            "resourceType": "Encounter",
            "id": f"enc-{record.id}",
            "status": "finished",
            "class": act_class,
            "subject": {"reference": f"Patient/{record.patient_id}"},
            "period": {
                "start": record.recorded_at.isoformat() if record.recorded_at else None,
            },
            "participant": participants,
        }

        if record.symptoms:
            fhir_encounter["reasonCode"] = [{"text": record.symptoms}]

        return fhir_encounter

    @classmethod
    def to_internal(cls, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """Parse FHIR Encounter into dictionary for ClinicalRecord or TriageRecord."""
        patient_ref_id = cls.extract_reference_id(fhir_resource.get("subject"))
        
        # Determine encounter class
        act_code = "AMB"
        class_obj = fhir_resource.get("class", {})
        if isinstance(class_obj, dict):
            act_code = class_obj.get("code", "AMB")
        elif isinstance(class_obj, str):
            act_code = class_obj

        internal_encounter_type = cls.CLASS_MAP_FHIR_TO_INTERNAL.get(act_code, EncounterType.OUTPATIENT)

        # Period start
        period = fhir_resource.get("period", {})
        start_time = cls.parse_datetime(period.get("start"))

        # Reason code / symptoms
        symptoms = ""
        reasons = fhir_resource.get("reasonCode", [])
        if reasons and isinstance(reasons, list):
            symptoms = reasons[0].get("text") or reasons[0].get("coding", [{}])[0].get("display", "")

        return {
            "patient_id": patient_ref_id,
            "encounter_type": internal_encounter_type,
            "recorded_at": start_time,
            "symptoms": symptoms.strip(),
        }
