"""
Observation FHIR R4 Mapper — BPY-CSE-2666.
Bi-directional translation between internal ClinicalRecord vitals/labs and LOINC-coded FHIR R4 Observations.
"""
from decimal import Decimal
from typing import Any, Dict, List, Optional

from apps.clinical.models import ClinicalRecord
from .base import BaseFHIRMapper


class ObservationFHIRMapper(BaseFHIRMapper):
    """
    Translates between ClinicalRecord vitals/labs and FHIR R4 Observation resources.
    Standardized with LOINC codes and UCUM units.
    """

    LOINC_MAP = {
        "systolic_bp": {"code": "8480-6", "display": "Systolic blood pressure", "unit": "mmHg", "ucum": "mm[Hg]"},
        "diastolic_bp": {"code": "8462-4", "display": "Diastolic blood pressure", "unit": "mmHg", "ucum": "mm[Hg]"},
        "heart_rate": {"code": "8867-4", "display": "Heart rate", "unit": "beats/minute", "ucum": "/min"},
        "respiratory_rate": {"code": "9279-1", "display": "Respiratory rate", "unit": "breaths/minute", "ucum": "/min"},
        "body_temperature": {"code": "8310-5", "display": "Body temperature", "unit": "°C", "ucum": "Cel"},
        "oxygen_saturation": {"code": "2708-6", "display": "Oxygen saturation in Arterial blood", "unit": "%", "ucum": "%"},
        "bmi": {"code": "39156-5", "display": "Body mass index (BMI)", "unit": "kg/m²", "ucum": "kg/m2"},
        "glucose_level": {"code": "2345-7", "display": "Glucose in Serum or Plasma", "unit": "mg/dL", "ucum": "mg/dL"},
        "cholesterol_total": {"code": "2093-3", "display": "Cholesterol in Serum or Plasma", "unit": "mg/dL", "ucum": "mg/dL"},
        "creatinine": {"code": "2160-0", "display": "Creatinine in Serum or Plasma", "unit": "mg/dL", "ucum": "mg/dL"},
        "sodium": {"code": "2951-2", "display": "Sodium in Serum or Plasma", "unit": "mmol/L", "ucum": "mmol/L"},
        "calcium": {"code": "17861-6", "display": "Calcium in Serum or Plasma", "unit": "mg/dL", "ucum": "mg/dL"},
        "lactic_acid": {"code": "2524-7", "display": "Lactate in Serum or Plasma", "unit": "mmol/L", "ucum": "mmol/L"},
    }

    # Reverse mapping: LOINC code -> internal field name
    CODE_TO_FIELD = {
        "8480-6": "systolic_bp",
        "8462-4": "diastolic_bp",
        "8867-4": "heart_rate",
        "9279-1": "respiratory_rate",
        "8310-5": "body_temperature",
        "2708-6": "oxygen_saturation",
        "39156-5": "bmi",
        "2345-7": "glucose_level",
        "2093-3": "cholesterol_total",
        "2160-0": "creatinine",
        "2951-2": "sodium",
        "17861-6": "calcium",
        "2524-7": "lactic_acid",
    }

    @classmethod
    def to_fhir(cls, record: ClinicalRecord) -> List[Dict[str, Any]]:
        """
        Convert a ClinicalRecord instance into a list of FHIR R4 Observation resources.
        Blood pressure is emitted as a standard compound panel (LOINC 85354-9).
        """
        observations: List[Dict[str, Any]] = []
        subject_ref = {"reference": f"Patient/{record.patient_id}"}
        effective_dt = record.recorded_at.isoformat() if record.recorded_at else None

        # 1. Blood Pressure Panel (LOINC 85354-9)
        if record.systolic_bp is not None or record.diastolic_bp is not None:
            bp_components = []
            if record.systolic_bp is not None:
                bp_components.append({
                    "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure"}]},
                    "valueQuantity": {"value": float(record.systolic_bp), "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"},
                })
            if record.diastolic_bp is not None:
                bp_components.append({
                    "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic blood pressure"}]},
                    "valueQuantity": {"value": float(record.diastolic_bp), "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"},
                })

            observations.append({
                "resourceType": "Observation",
                "id": f"bp-{record.id}",
                "status": "final",
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                "code": "vital-signs",
                                "display": "Vital Signs",
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "85354-9",
                            "display": "Blood pressure panel with all children optional",
                        }
                    ]
                },
                "subject": subject_ref,
                "effectiveDateTime": effective_dt,
                "component": bp_components,
            })

        # 2. Individual Vitals & Lab Biomarkers
        single_fields = [
            ("heart_rate", "vital-signs"),
            ("respiratory_rate", "vital-signs"),
            ("body_temperature", "vital-signs"),
            ("oxygen_saturation", "vital-signs"),
            ("bmi", "vital-signs"),
            ("glucose_level", "laboratory"),
            ("cholesterol_total", "laboratory"),
            ("creatinine", "laboratory"),
            ("sodium", "laboratory"),
            ("calcium", "laboratory"),
            ("lactic_acid", "laboratory"),
        ]

        for field_name, category_code in single_fields:
            val = getattr(record, field_name, None)
            if val is not None:
                meta = cls.LOINC_MAP[field_name]
                obs_dict: Dict[str, Any] = {
                    "resourceType": "Observation",
                    "id": f"{field_name}-{record.id}",
                    "status": "final",
                    "category": [
                        {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                    "code": category_code,
                                    "display": "Vital Signs" if category_code == "vital-signs" else "Laboratory",
                                }
                            ]
                        }
                    ],
                    "code": {
                        "coding": [
                            {
                                "system": "http://loinc.org",
                                "code": meta["code"],
                                "display": meta["display"],
                            }
                        ]
                    },
                    "subject": subject_ref,
                    "effectiveDateTime": effective_dt,
                    "valueQuantity": {
                        "value": float(val),
                        "unit": meta["unit"],
                        "system": "http://unitsofmeasure.org",
                        "code": meta["ucum"],
                    },
                }
                observations.append(obs_dict)

        return observations

    @classmethod
    def to_internal(cls, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract internal ClinicalRecord vitals/labs from a single FHIR Observation resource.
        Returns a dictionary containing matched clinical features and patient reference.
        """
        extracted: Dict[str, Any] = {}
        patient_ref_id = cls.extract_reference_id(fhir_resource.get("subject"))
        if patient_ref_id:
            extracted["patient_id"] = patient_ref_id

        recorded_at = cls.parse_datetime(fhir_resource.get("effectiveDateTime"))
        if recorded_at:
            extracted["recorded_at"] = recorded_at

        # Check for BP Compound Panel (LOINC 85354-9)
        code_obj = fhir_resource.get("code", {})
        codings = code_obj.get("coding", [])
        is_bp_panel = any(c.get("code") in ("85354-9", "55284-4") for c in codings if isinstance(c, dict))

        if is_bp_panel or "component" in fhir_resource:
            for comp in fhir_resource.get("component", []):
                if not isinstance(comp, dict):
                    continue
                comp_codings = comp.get("code", {}).get("coding", [])
                for cc in comp_codings:
                    code_val = cc.get("code")
                    if code_val in cls.CODE_TO_FIELD:
                        target_field = cls.CODE_TO_FIELD[code_val]
                        val_qty = comp.get("valueQuantity", {})
                        if "value" in val_qty:
                            extracted[target_field] = val_qty["value"]

        # Check single valueQuantity
        val_qty = fhir_resource.get("valueQuantity", {})
        if "value" in val_qty:
            val = val_qty["value"]
            for cc in codings:
                code_val = cc.get("code")
                if code_val in cls.CODE_TO_FIELD:
                    target_field = cls.CODE_TO_FIELD[code_val]
                    extracted[target_field] = val
                    break

        return extracted
