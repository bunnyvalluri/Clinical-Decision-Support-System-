"""
RiskAssessment FHIR R4 Mapper — BPY-CSE-2666.
Translates between internal Prediction CDSS model outputs and FHIR R4 RiskAssessment.
"""
from typing import Any, Dict

from apps.predictions.models import Prediction
from .base import BaseFHIRMapper


class RiskAssessmentFHIRMapper(BaseFHIRMapper):
    """
    Translates between predictions.Prediction and FHIR R4 RiskAssessment.
    Provides standard CDSS output for clinical decision support exchange.
    """

    @classmethod
    def to_fhir(cls, prediction: Prediction) -> Dict[str, Any]:
        """Convert Prediction model output to FHIR R4 RiskAssessment resource."""
        fhir_ra: Dict[str, Any] = {
            "resourceType": "RiskAssessment",
            "id": str(prediction.id),
            "status": "final",
            "subject": {"reference": f"Patient/{prediction.patient_id}"},
            "occurrenceDateTime": prediction.prediction_timestamp.isoformat() if prediction.prediction_timestamp else None,
            "method": {
                "coding": [
                    {
                        "system": "urn:oid:healthnova:algorithms",
                        "code": prediction.model_name,
                        "display": f"{prediction.model_name} v{prediction.model_version_str}",
                    }
                ],
                "text": f"Machine Learning Model: {prediction.model_name} (version {prediction.model_version_str})",
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
                        ],
                        "text": f"{prediction.get_prediction_result_display()} (Probability: {float(prediction.probability):.2%})",
                    },
                    "probabilityDecimal": float(prediction.probability),
                }
            ],
            "note": [
                {
                    "text": (
                        f"HealthNova CDSS Invariant #3: Non-autonomous decision support. "
                        f"Clinical review status: {prediction.review_status}."
                    )
                }
            ],
        }

        if prediction.clinical_record_id:
            fhir_ra["basis"] = [{"reference": f"Observation/bp-{prediction.clinical_record_id}"}]

        return fhir_ra

    @classmethod
    def to_internal(cls, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """Extract prediction parameters if receiving external risk assessments."""
        patient_ref_id = cls.extract_reference_id(fhir_resource.get("subject"))
        
        predictions = fhir_resource.get("prediction", [])
        risk_tier = "MEDIUM"
        probability = 0.5
        if predictions and isinstance(predictions, list):
            pred_obj = predictions[0]
            probability = pred_obj.get("probabilityDecimal", 0.5)
            outcome = pred_obj.get("outcome", {})
            for c in outcome.get("coding", []):
                risk_tier = c.get("code", risk_tier)
                break

        return {
            "patient_id": patient_ref_id,
            "prediction_result": risk_tier,
            "probability": probability,
            "prediction_timestamp": cls.parse_datetime(fhir_resource.get("occurrenceDateTime")),
        }
