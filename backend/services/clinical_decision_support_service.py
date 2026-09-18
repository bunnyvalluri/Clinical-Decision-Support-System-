"""
Clinical Decision Support Service (CDSS).
Synthesizes machine learning risk classifications, TreeSHAP feature attributions,
deterministic clinical scoring algorithms (qSOFA, NEWS2), data quality assessments,
and predictive uncertainty into actionable clinical decision support.

Strictly adheres to clinical safety guidelines:
- Zero autonomous diagnosis or prescription
- Human clinician sign-off required for high-risk / critical alerts
- Deterministic rules cannot be overridden by ML probabilities
"""
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

from apps.predictions.models import Prediction, RiskLevel
from services.base import BaseService
from services.clinical_rules_engine import ClinicalRulesEngine
from services.data_quality_service import DataQualityService
from services.interfaces import DeterministicRuleAlert, IClinicalRuleEngine

logger = logging.getLogger("clinical.cdss")


@dataclass
class ClinicalDecisionSupportGuidance:
    prediction_id: Optional[str]
    patient_id: str
    risk_level: str
    probability: float
    confidence: float
    confidence_level: str
    should_abstain: bool
    abstention_reason: Optional[str]
    ood_status: str
    data_quality_status: str
    data_quality_issues: List[Dict[str, Any]]
    key_contributing_factors: List[Dict[str, Any]]
    deterministic_alerts: List[Dict[str, Any]]
    suggested_clinical_review: str  # "MANDATORY_STAT", "REQUIRED", "ROUTINE", "ABSTAINED"
    clinical_summary: str
    safety_disclaimer: str
    generated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ClinicalDecisionSupportService(BaseService):
    """
    Intelligent Clinical Decision Support Layer combining ML predictions,
    deterministic physiological rules, and human-in-the-loop review recommendations.
    """

    SAFETY_DISCLAIMER = (
        "HealthNova AI Clinical Decision Support is intended solely to aid authorized clinicians. "
        "It does NOT replace clinical judgment, provide autonomous diagnosis, or prescribe treatment. "
        "Final medical decisions rest solely with the licensed attending clinician."
    )

    def __init__(
        self,
        rules_engine: Optional[IClinicalRuleEngine] = None,
        data_quality_service: Optional[DataQualityService] = None,
    ) -> None:
        super().__init__()
        self.rules_engine = rules_engine or ClinicalRulesEngine()
        self.data_quality_service = data_quality_service or DataQualityService()

    def generate_support_guidance(
        self,
        patient_id: str,
        features: Dict[str, Any],
        prediction: Optional[Prediction] = None,
        prediction_result: Optional[Dict[str, Any]] = None,
    ) -> ClinicalDecisionSupportGuidance:
        """
        Generate structured clinical decision support guidance.
        """
        # 1. Deterministic Rule Evaluation (qSOFA, NEWS2, acute bounds)
        raw_alerts: List[DeterministicRuleAlert] = self.rules_engine.evaluate(features)
        rule_alerts: List[Dict[str, Any]] = [
            {
                "rule_name": a.rule_name,
                "severity": a.severity,
                "trigger_criteria": a.trigger_criteria,
                "recommended_action": a.recommended_action,
            }
            for a in raw_alerts
        ]

        # 2. Data Quality Assessment
        dq_report = self.data_quality_service.assess_record_quality(features)
        dq_status = dq_report.get("status", "VALID")
        dq_issues = dq_report.get("issues", [])

        # 3. Extract ML inference metrics
        pred_id = str(prediction.id) if prediction else None
        if prediction:
            risk_level = prediction.prediction_result
            prob = float(prediction.probability)
            conf = float(prediction.confidence_score or prediction.probability)
            should_abstain = bool(prediction.is_abstaining)
            ood_status = prediction.ood_status
            factors = []
            if hasattr(prediction, "explanation") and prediction.explanation:
                factors = prediction.explanation.top_risk_factors or []
        elif prediction_result:
            risk_level = prediction_result.get("prediction", "LOW")
            prob = float(prediction_result.get("confidence", 0.0))
            conf = float(prediction_result.get("confidence", 0.0))
            should_abstain = bool(prediction_result.get("should_abstain", False))
            ood_status = prediction_result.get("ood_assessment", {}).get("status", "IN_DISTRIBUTION")
            factors = prediction_result.get("top_risk_factors", [])
        else:
            risk_level = "UNKNOWN"
            prob = 0.0
            conf = 0.0
            should_abstain = True
            ood_status = "UNKNOWN"
            factors = []

        confidence_level = "HIGH" if conf >= 0.85 else ("MODERATE" if conf >= 0.60 else "LOW")

        # 4. Synthesize Clinical Review Requirement
        has_critical_rule = any(a.get("severity") in ("CRITICAL", "CRITICAL_EMERGENCY") for a in rule_alerts)
        if has_critical_rule or risk_level == RiskLevel.CRITICAL:
            suggested_review = "MANDATORY_STAT"
            review_text = "Critical physiological triggers or high-acuity deterioration identified. Immediate physician bedside evaluation recommended."
        elif should_abstain:
            suggested_review = "ABSTAINED"
            review_text = "Model has abstained due to high predictive uncertainty or out-of-distribution vitals. Physician manual review is required."
        elif risk_level == RiskLevel.HIGH:
            suggested_review = "REQUIRED"
            review_text = "Patient identified in elevated risk tier. Attending physician review and risk verification required."
        else:
            suggested_review = "ROUTINE"
            review_text = "Patient in stable risk bracket. Maintain routine monitoring per ward protocol."

        # 5. Build Summary Narrative
        summary_parts = [review_text]
        if rule_alerts:
            top_rule = rule_alerts[0]
            summary_parts.append(f"Clinical Flag: {top_rule['rule_name']} ({top_rule['trigger_criteria']}).")
        if factors:
            top_factors = [f"{f.get('feature_name', f.get('feature', ''))}" for f in factors[:3]]
            summary_parts.append(f"Key Biomarkers: {', '.join(filter(None, top_factors))}.")

        return ClinicalDecisionSupportGuidance(
            prediction_id=pred_id,
            patient_id=str(patient_id),
            risk_level=risk_level,
            probability=round(prob, 4),
            confidence=round(conf, 4),
            confidence_level=confidence_level,
            should_abstain=should_abstain,
            abstention_reason=(
                "High entropy / out-of-distribution clinical profile" if should_abstain else None
            ),
            ood_status=ood_status,
            data_quality_status=dq_status,
            data_quality_issues=dq_issues,
            key_contributing_factors=factors,
            deterministic_alerts=rule_alerts,
            suggested_clinical_review=suggested_review,
            clinical_summary=" ".join(summary_parts),
            safety_disclaimer=self.SAFETY_DISCLAIMER,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
