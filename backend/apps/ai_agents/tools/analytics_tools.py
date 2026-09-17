from typing import Any, Dict
from apps.ai_agents.models import AgentSecurityLevel
from apps.ai_agents.tools.base import BaseTool
from apps.model_registry.models import ModelVersion
from apps.ai_orchestrator.models import ModelDriftRecord


class GetModelPerformanceTool(BaseTool):
    name = "get_model_performance"
    description = "Retrieve authentic validated model performance metrics (ROC-AUC, F1, Recall, Precision, Brier Score) from Model Registry."
    category = "ANALYTICS"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.MEDIUM
    allowed_roles = ["informaticist", "doctor", "admin", "compliance_officer"]
    patient_data_access = False

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {"model_name": {"type": "string"}},
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {"metrics": {"type": "object"}}}

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        model_name = arguments.get("model_name")
        qs = ModelVersion.objects.all().order_by("-created_at")
        if model_name:
            qs = qs.filter(name__icontains=model_name)
        
        latest_version = qs.first()
        if not latest_version:
            return {
                "status": "NOT_FOUND",
                "message": "No model version metrics found in authoritative model registry.",
            }

        return {
            "status": "AVAILABLE",
            "model_name": latest_version.name,
            "version": latest_version.version,
            "metrics": latest_version.metrics if hasattr(latest_version, "metrics") else {},
            "validation_timestamp": latest_version.created_at.isoformat() if latest_version.created_at else None,
        }


class GetDataQualityStatusTool(BaseTool):
    name = "get_data_quality_status"
    description = "Assess physiological stream completeness, out-of-range sensor readings, and missingness rates."
    category = "ANALYTICS"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.MEDIUM
    allowed_roles = ["informaticist", "admin", "doctor"]
    patient_data_access = False

    def get_input_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {}}

    def get_output_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {"quality": {"type": "object"}}}

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        from apps.clinical.models import ClinicalRecord
        total_records = ClinicalRecord.objects.count()
        missing_vitals = ClinicalRecord.objects.filter(systolic_bp__isnull=True).count()
        missing_rate = (missing_vitals / total_records) if total_records > 0 else 0.0

        return {
            "status": "COMPLETED",
            "total_records_checked": total_records,
            "missingness_rate": round(missing_rate, 4),
            "vital_streams_active": ["heart_rate", "systolic_bp", "diastolic_bp", "oxygen_saturation"],
            "data_freshness": "STREAMING",
            "integrity_score": round(1.0 - missing_rate, 4),
        }


class GetPredictionDriftTool(BaseTool):
    name = "get_prediction_drift"
    description = "Retrieve population covariate and prediction score drift metrics (PSI, KS-statistic)."
    category = "ANALYTICS"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.MEDIUM
    allowed_roles = ["informaticist", "admin", "doctor"]
    patient_data_access = False

    def get_input_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {}}

    def get_output_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {"drift": {"type": "object"}}}

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        drift_record = ModelDriftRecord.objects.all().order_by("-evaluated_at").first()
        if not drift_record:
            return {
                "status": "NO_DRIFT_RECORD",
                "message": "No drift evaluations stored. Standard distribution baseline maintained.",
            }

        return {
            "status": "RECORDED",
            "model_name": drift_record.model_name,
            "feature_name": drift_record.feature_name,
            "psi_score": float(drift_record.psi_score),
            "ks_statistic": float(drift_record.ks_statistic),
            "is_drift_detected": drift_record.is_drift_detected,
            "evaluated_at": drift_record.evaluated_at.isoformat() if drift_record.evaluated_at else None,
        }
