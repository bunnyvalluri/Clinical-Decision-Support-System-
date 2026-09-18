"""
FHIR R4 Interoperability Adapter — BPY-CSE-2666.
Translates internal clinical records, vitals, and predictions to/from
HL7 FHIR Release 4 standard JSON resources (Patient, Observation, Condition, RiskAssessment).
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from apps.clinical.models import ClinicalRecord
from apps.patients.models import Patient
from apps.predictions.models import Prediction


class FHIRAdapter:
    """
    HL7 FHIR R4 mapping facade.
    Provides standard-compliant conversions without fabricating external EHR connections.
    """

    @classmethod
    def patient_to_fhir(cls, patient: Patient) -> Dict[str, Any]:
        """Convert internal Patient model to FHIR R4 Patient resource."""
        gender_map = {"M": "male", "F": "female", "Other": "other"}
        return {
            "resourceType": "Patient",
            "id": str(patient.id),
            "identifier": [
                {
                    "use": "usual",
                    "type": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                                "code": "MR",
                                "display": "Medical Record Number",
                            }
                        ]
                    },
                    "system": "urn:oid:healthnova:mrn",
                    "value": patient.mrn,
                }
            ],
            "active": patient.is_active,
            "name": [
                {
                    "use": "official",
                    "family": patient.last_name,
                    "given": [patient.first_name],
                }
            ],
            "gender": gender_map.get(patient.gender, "unknown"),
            "birthDate": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            "telecom": [
                {"system": "phone", "value": patient.phone_number, "use": "mobile"},
                {"system": "email", "value": patient.email, "use": "home"},
            ] if patient.phone_number or patient.email else [],
        }

    @classmethod
    def clinical_record_to_observations(cls, record: ClinicalRecord) -> List[Dict[str, Any]]:
        """Convert ClinicalRecord vitals into standard LOINC-coded FHIR R4 Observation resources."""
        observations: List[Dict[str, Any]] = []
        subject_ref = {"reference": f"Patient/{record.patient_id}"}
        effective_dt = record.recorded_at.isoformat()

        # Blood Pressure (LOINC 85354-9)
        if record.systolic_bp is not None and record.diastolic_bp is not None:
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
                "component": [
                    {
                        "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure"}]},
                        "valueQuantity": {"value": record.systolic_bp, "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"},
                    },
                    {
                        "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic blood pressure"}]},
                        "valueQuantity": {"value": record.diastolic_bp, "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"},
                    },
                ],
            })

        # Heart Rate (LOINC 8867-4)
        if record.heart_rate is not None:
            observations.append({
                "resourceType": "Observation",
                "id": f"hr-{record.id}",
                "status": "final",
                "code": {"coding": [{"system": "http://loinc.org", "code": "8867-4", "display": "Heart rate"}]},
                "subject": subject_ref,
                "effectiveDateTime": effective_dt,
                "valueQuantity": {"value": record.heart_rate, "unit": "beats/minute", "system": "http://unitsofmeasure.org", "code": "/min"},
            })

        # SpO2 (LOINC 2708-6)
        if record.oxygen_saturation is not None:
            observations.append({
                "resourceType": "Observation",
                "id": f"spo2-{record.id}",
                "status": "final",
                "code": {"coding": [{"system": "http://loinc.org", "code": "2708-6", "display": "Oxygen saturation in Arterial blood"}]},
                "subject": subject_ref,
                "effectiveDateTime": effective_dt,
                "valueQuantity": {"value": float(record.oxygen_saturation), "unit": "%", "system": "http://unitsofmeasure.org", "code": "%"},
            })

        return observations

    @classmethod
    def prediction_to_risk_assessment(cls, prediction: Prediction) -> Dict[str, Any]:
        """Convert Prediction model output to FHIR R4 RiskAssessment resource."""
        return {
            "resourceType": "RiskAssessment",
            "id": str(prediction.id),
            "status": "final",
            "subject": {"reference": f"Patient/{prediction.patient_id}"},
            "occurrenceDateTime": prediction.prediction_timestamp.isoformat(),
            "method": {
                "coding": [
                    {
                        "system": "urn:oid:healthnova:algorithms",
                        "code": prediction.model_name,
                        "display": f"{prediction.model_name} v{prediction.model_version_str}",
                    }
                ]
            },
            "prediction": [
                {
                    "outcome": {
                        "coding": [
                            {
                                "system": "urn:oid:healthnova:risk-tiers",
                                "code": prediction.prediction_result,
                                "display": f"{prediction.prediction_result} Risk Tier",
                            }
                        ]
                    },
                    "probabilityDecimal": float(prediction.probability),
                }
            ],
            "note": [
                {
                    "text": "Decision support assistive prediction. Clinician human review mandatory prior to therapeutic actions."
                }
            ],
        }
