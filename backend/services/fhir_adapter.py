"""
FHIR R4 Interoperability Adapter — BPY-CSE-2666.
Translates internal clinical records, vitals, and predictions to/from
HL7 FHIR Release 4 standard JSON resources (Patient, Observation, Condition, RiskAssessment).
Acts as a backwards-compatible facade delegating to apps.interoperability.mappings.
"""
from typing import Any, Dict, List

from apps.clinical.models import ClinicalRecord
from apps.interoperability.mappings.observation_mapper import ObservationFHIRMapper
from apps.interoperability.mappings.patient_mapper import PatientFHIRMapper
from apps.interoperability.mappings.risk_assessment_mapper import RiskAssessmentFHIRMapper
from apps.patients.models import Patient
from apps.predictions.models import Prediction


class FHIRAdapter:
    """
    HL7 FHIR R4 mapping facade.
    Provides standard-compliant conversions without fabricating external EHR connections.
    Delegates to the production-grade interoperability subsystem.
    """

    @classmethod
    def patient_to_fhir(cls, patient: Patient) -> Dict[str, Any]:
        """Convert internal Patient model to FHIR R4 Patient resource."""
        return PatientFHIRMapper.to_fhir(patient)

    @classmethod
    def clinical_record_to_observations(cls, record: ClinicalRecord) -> List[Dict[str, Any]]:
        """Convert ClinicalRecord vitals into standard LOINC-coded FHIR R4 Observation resources."""
        return ObservationFHIRMapper.to_fhir(record)

    @classmethod
    def prediction_to_risk_assessment(cls, prediction: Prediction) -> Dict[str, Any]:
        """Convert Prediction model output to FHIR R4 RiskAssessment resource."""
        return RiskAssessmentFHIRMapper.to_fhir(prediction)
