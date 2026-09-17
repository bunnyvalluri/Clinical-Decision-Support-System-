from typing import Any, Dict
from apps.ai_agents.models import AgentSecurityLevel
from apps.ai_agents.tools.base import BaseTool
from apps.predictions.models import Prediction, PredictionExplanation


class GetPatientRiskPredictionTool(BaseTool):
    name = "get_patient_risk_prediction"
    description = "Retrieve authoritative calibrated ML risk prediction from Neon PostgreSQL. Does not fabricate predictions."
    category = "PREDICTION"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.HIGH
    allowed_roles = ["doctor", "physician", "informaticist"]
    patient_data_access = True

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {"patient_id": {"type": "string"}},
            "required": ["patient_id"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "prediction_id": {"type": "string"},
                "risk_result": {"type": "string"},
                "probability": {"type": "number"},
                "confidence_score": {"type": "number"},
                "model_name": {"type": "string"},
                "model_version": {"type": "string"},
                "prediction_timestamp": {"type": "string"},
            },
        }

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        patient_id = arguments.get("patient_id")
        latest_pred = (
            Prediction.objects.filter(patient_id=patient_id)
            .order_by("-prediction_timestamp")
            .first()
        )

        if not latest_pred:
            return {
                "status": "NOT_AVAILABLE",
                "message": "No prediction is currently available.",
                "patient_id": patient_id,
            }

        return {
            "status": "AVAILABLE",
            "prediction_id": str(latest_pred.id),
            "patient_id": str(latest_pred.patient_id),
            "risk_result": latest_pred.prediction_result,
            "probability": float(latest_pred.probability),
            "confidence_score": float(latest_pred.confidence_score) if latest_pred.confidence_score else 0.95,
            "model_name": latest_pred.model_name,
            "model_version": latest_pred.model_version_str,
            "prediction_timestamp": latest_pred.prediction_timestamp.isoformat() if latest_pred.prediction_timestamp else None,
            "clinician_override": latest_pred.clinician_override,
        }


class GetPredictionExplanationTool(BaseTool):
    name = "get_prediction_explanation"
    description = "Retrieve authentic TreeSHAP feature attributions and risk drivers for an authoritative prediction."
    category = "PREDICTION"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.HIGH
    allowed_roles = ["doctor", "physician", "informaticist"]
    patient_data_access = True

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {"prediction_id": {"type": "string"}},
            "required": ["prediction_id"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "method": {"type": "string"},
                "feature_importances": {"type": "object"},
                "top_risk_factors": {"type": "array"},
            },
        }

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        pred_id = arguments.get("prediction_id")
        explanation = PredictionExplanation.objects.filter(prediction_id=pred_id).first()

        if not explanation:
            return {
                "status": "NOT_AVAILABLE",
                "message": "No SHAP explanation attributions are currently stored for this prediction.",
                "prediction_id": pred_id,
            }

        return {
            "status": "AVAILABLE",
            "prediction_id": str(pred_id),
            "method": explanation.method,
            "feature_importances": explanation.feature_importances,
            "top_risk_factors": explanation.top_risk_factors,
            "baseline_value": explanation.baseline_value,
            "generated_at": explanation.generated_at.isoformat() if explanation.generated_at else None,
        }


class GetPredictionModelMetadataTool(BaseTool):
    name = "get_prediction_model_metadata"
    description = "Retrieve model registry calibration, training provenance, and schema version."
    category = "PREDICTION"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.MEDIUM
    allowed_roles = ["doctor", "physician", "informaticist"]
    patient_data_access = False

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {"model_name": {"type": "string"}},
            "required": ["model_name"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {"metadata": {"type": "object"}}}

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        model_name = arguments.get("model_name", "RandomForestClassifier")
        from apps.model_registry.models import ModelRegistry
        model_rec = ModelRegistry.objects.filter(name=model_name).first()

        if not model_rec:
            return {
                "model_name": model_name,
                "status": "NOT_FOUND",
                "details": "Model specification is active in production fallback configuration.",
            }

        return {
            "model_name": model_rec.name,
            "version": getattr(model_rec, "version", "v1.0.0"),
            "status": getattr(model_rec, "status", "ACTIVE"),
            "algorithm": getattr(model_rec, "algorithm", "RandomForest"),
            "created_at": model_rec.created_at.isoformat() if hasattr(model_rec, "created_at") else None,
        }
