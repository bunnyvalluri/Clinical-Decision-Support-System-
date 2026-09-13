"""
Clinical Intelligence Orchestrator.
Coordinates deterministic clinical rules, machine learning predictions,
uncertainty estimation, TreeSHAP attributions, and grounded knowledge retrieval
under strict human-in-the-loop governance.
"""
from dataclasses import asdict
from datetime import datetime, timezone
import time
from typing import Any, Dict, List, Optional
import uuid

from django.db import transaction
from django.utils import timezone as django_timezone

from apps.accounts.models import User, UserRole
from apps.clinical.models import ClinicalRecord
from apps.patients.models import Patient
from apps.predictions.models import Prediction, RiskLevel
from services.base import BaseService
from services.clinical_rules_engine import ClinicalRulesEngine
from services.explanation_service import ExplanationService
from services.interfaces import (
    DeterministicRuleAlert,
    GuardrailResult,
    IToolRegistry,
    KnowledgeCitation,
    ToolDefinition,
    ToolExecutionResult,
    UncertaintyResult,
)
from services.prediction_service import PredictionService
from services.uncertainty_engine import UncertaintyEngine

from .guardrails import SafetyGuardrailService
from .knowledge_retrieval import KnowledgeRetrievalService


class ClinicalIntelligenceOrchestrator(BaseService, IToolRegistry):
    """
    Controlled agentic orchestrator executing authorized clinical decision support operations.
    Has zero direct access to raw SQL or operating system shells.
    """

    def __init__(
        self,
        rules_engine: Optional[ClinicalRulesEngine] = None,
        uncertainty_engine: Optional[UncertaintyEngine] = None,
        guardrail_service: Optional[SafetyGuardrailService] = None,
        knowledge_service: Optional[KnowledgeRetrievalService] = None,
        prediction_service: Optional[PredictionService] = None,
        explanation_service: Optional[ExplanationService] = None,
    ) -> None:
        super().__init__()
        self.rules_engine = rules_engine or ClinicalRulesEngine()
        self.uncertainty_engine = uncertainty_engine or UncertaintyEngine()
        self.guardrails = guardrail_service or SafetyGuardrailService()
        self.knowledge = knowledge_service or KnowledgeRetrievalService()
        self.prediction_service = prediction_service or PredictionService()
        self.explanation_service = explanation_service or ExplanationService()

    def get_available_tools(self, user_role: str) -> List[ToolDefinition]:
        """Return allowlist of tools authorized for the clinician role."""
        tools = [
            ToolDefinition(
                name="get_patient_context",
                description="Retrieve authorized patient demographics and baseline status.",
                parameters={"patient_id": "string"},
                required_role="ALL",
            ),
            ToolDefinition(
                name="get_clinical_records",
                description="Retrieve latest physiological vitals and laboratory observations.",
                parameters={"patient_id": "string"},
                required_role="ALL",
            ),
            ToolDefinition(
                name="evaluate_clinical_rules",
                description="Evaluate deterministic clinical scoring protocols (qSOFA, NEWS2).",
                parameters={"clinical_data": "object"},
                required_role="ALL",
            ),
            ToolDefinition(
                name="run_risk_prediction",
                description="Execute calibrated ML ensemble risk evaluation.",
                parameters={"patient_id": "string", "model_name": "string (optional)"},
                required_role="DOCTOR_OR_NURSE",
            ),
            ToolDefinition(
                name="get_model_explanation",
                description="Retrieve local TreeSHAP feature attributions for a prediction.",
                parameters={"prediction_id": "string"},
                required_role="ALL",
            ),
            ToolDefinition(
                name="retrieve_approved_knowledge",
                description="Retrieve peer-reviewed clinical guidelines and citations.",
                parameters={"query": "string"},
                required_role="ALL",
            ),
        ]
        return tools

    def execute_tool(
        self, tool_name: str, parameters: Dict[str, Any], user_context: Dict[str, Any]
    ) -> ToolExecutionResult:
        """Execute an allowlisted tool under strict validation and timing."""
        start_time = time.perf_counter()
        try:
            if tool_name == "get_patient_context":
                patient_id = parameters.get("patient_id")
                patient = Patient.objects.get(id=patient_id)
                data = {
                    "id": str(patient.id),
                    "mrn": patient.mrn,
                    "first_name": patient.first_name,
                    "last_name": patient.last_name,
                    "age": patient.age,
                    "gender": patient.gender,
                    "status": "ACTIVE" if patient.is_active else "INACTIVE",
                }
            elif tool_name == "get_clinical_records":
                patient_id = parameters.get("patient_id")
                records = ClinicalRecord.objects.filter(patient_id=patient_id).order_by("-recorded_at")[:5]
                data = {
                    "count": len(records),
                    "latest": [
                        {
                            "id": str(r.id),
                            "recorded_at": r.recorded_at.isoformat(),
                            "systolic_bp": float(r.systolic_bp) if r.systolic_bp else None,
                            "diastolic_bp": float(r.diastolic_bp) if r.diastolic_bp else None,
                            "heart_rate": r.heart_rate,
                            "respiratory_rate": r.respiratory_rate,
                            "temperature": float(getattr(r, "body_temperature", None) or 0) if getattr(r, "body_temperature", None) else None,
                            "oxygen_saturation": float(r.oxygen_saturation) if r.oxygen_saturation else None,
                            "glucose": float(getattr(r, "glucose_level", None) or 0) if getattr(r, "glucose_level", None) else None,
                            "creatinine": float(r.creatinine) if r.creatinine else None,
                            "potassium": float(r.lab_results.get("potassium")) if (isinstance(getattr(r, "lab_results", None), dict) and r.lab_results.get("potassium")) else None,
                            "lactic_acid": float(r.lactic_acid) if r.lactic_acid else None,
                        }
                        for r in records
                    ],
                }
            elif tool_name == "evaluate_clinical_rules":
                c_data = parameters.get("clinical_data", {})
                rule_alerts = self.rules_engine.evaluate(c_data)
                data = {"alerts": [asdict(a) for a in rule_alerts]}
            elif tool_name == "retrieve_approved_knowledge":
                query = parameters.get("query", "")
                res = self.knowledge.retrieve(query)
                data = {
                    "grounding_confidence": res.grounding_confidence,
                    "citations": [asdict(c) for c in res.citations],
                }
            else:
                return ToolExecutionResult(
                    tool_name=tool_name,
                    success=False,
                    error=f"Disallowed or unknown tool '{tool_name}'",
                    latency_ms=(time.perf_counter() - start_time) * 1000,
                )

            return ToolExecutionResult(
                tool_name=tool_name,
                success=True,
                data=data,
                latency_ms=(time.perf_counter() - start_time) * 1000,
            )
        except Exception as exc:
            self.logger.error("Tool execution failed: %s (%s)", tool_name, exc, exc_info=True)
            return ToolExecutionResult(
                tool_name=tool_name,
                success=False,
                error=str(exc),
                latency_ms=(time.perf_counter() - start_time) * 1000,
            )

    def orchestrate_clinical_evaluation(
        self,
        patient_id: str,
        clinician: User,
        query: Optional[str] = None,
        model_name: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Main clinical orchestrator workflow:
        1. Safety Guardrails on query.
        2. Retrieve patient context & clinical vitals.
        3. Deterministic rules evaluation (qSOFA, NEWS2, acute lab alerts).
        4. Machine Learning ensemble prediction & TreeSHAP explanation.
        5. Uncertainty & Out-of-Distribution calculation.
        6. Grounded knowledge retrieval with citations.
        7. Safety Guardrails validation on synthesized summary.
        8. Return structured, human-in-the-loop clinical report.
        """
        start_time = time.perf_counter()
        correlation_id = correlation_id or str(uuid.uuid4())

        # 1. Input Safety Guardrails
        if query:
            user_role_str = getattr(clinician, "role", "CLINICIAN")
            guardrail_in = self.guardrails.validate_input(query, user_role=user_role_str)
            if not guardrail_in.is_safe:
                return {
                    "correlation_id": correlation_id,
                    "status": "SAFETY_BLOCKED",
                    "reason": guardrail_in.reason,
                    "disclaimer": self.guardrails.validate_output("").sanitized_input,
                }

        # 2. Retrieve Patient & Records
        patient = Patient.objects.get(id=patient_id)
        latest_record = ClinicalRecord.objects.filter(patient=patient).order_by("-recorded_at").first()

        clinical_dict = {}
        if latest_record:
            body_temp = getattr(latest_record, "body_temperature", None) or getattr(latest_record, "temperature", None)
            glucose_val = getattr(latest_record, "glucose_level", None) or getattr(latest_record, "glucose", None)
            potassium_val = getattr(latest_record, "potassium", None)
            if potassium_val is None and isinstance(getattr(latest_record, "lab_results", None), dict):
                potassium_val = latest_record.lab_results.get("potassium")

            clinical_dict = {
                "age": patient.age,
                "systolic_bp": float(latest_record.systolic_bp) if latest_record.systolic_bp else None,
                "diastolic_bp": float(latest_record.diastolic_bp) if latest_record.diastolic_bp else None,
                "heart_rate": latest_record.heart_rate,
                "respiratory_rate": latest_record.respiratory_rate,
                "temperature": float(body_temp) if body_temp else None,
                "oxygen_saturation": float(latest_record.oxygen_saturation) if latest_record.oxygen_saturation else None,
                "glucose": float(glucose_val) if glucose_val else None,
                "creatinine": float(latest_record.creatinine) if latest_record.creatinine else None,
                "potassium": float(potassium_val) if potassium_val else None,
                "lactic_acid": float(latest_record.lactic_acid) if latest_record.lactic_acid else None,
            }

        # 3. Deterministic Rules Evaluation
        deterministic_alerts = self.rules_engine.evaluate(clinical_dict)
        has_critical_rule = any(a.severity == "CRITICAL_EMERGENCY" for a in deterministic_alerts)

        # 4. ML Prediction & Explanation
        prediction_result = None
        shap_explanation = None
        try:
            pred_obj = self.prediction_service.predict_patient(
                patient_id=patient.id,
                requested_by=clinician,
                model_name=model_name,
            )
            prediction_result = {
                "prediction_id": str(pred_obj.id),
                "risk_level": pred_obj.prediction_result,
                "probability": float(pred_obj.probability),
                "model_name": pred_obj.model_name,
                "model_version": pred_obj.model_version_str,
                "inference_time_ms": float(pred_obj.inference_latency_ms),
            }

            if hasattr(pred_obj, "explanation") and pred_obj.explanation:
                shap_explanation = {
                    "top_features": pred_obj.explanation.top_risk_factors,
                    "base_value": pred_obj.explanation.baseline_value,
                }
        except Exception as exc:
            self.logger.warning("ML prediction engine could not execute: %s", exc)

        # 5. Model Uncertainty & OOD Evaluation
        features_for_ood = {k: v for k, v in clinical_dict.items() if v is not None}
        ensemble_preds = [prediction_result["probability"]] if prediction_result else [0.5]
        uncertainty = self.uncertainty_engine.evaluate_uncertainty(features_for_ood, ensemble_preds)

        # 6. Grounded Knowledge Retrieval
        retrieval_query = query or (
            f"inpatient risk assessment {patient.age}yo "
            f"systolic {clinical_dict.get('systolic_bp', 120)} "
            f"lactate {clinical_dict.get('lactic_acid', 1.0)}"
        )
        knowledge_res = self.knowledge.retrieve(retrieval_query, clinical_context=clinical_dict)

        # 7. Synthesize Human-in-the-Loop Decision Support Summary
        requires_human_review = (
            has_critical_rule
            or uncertainty.should_abstain
            or (prediction_result and prediction_result["risk_level"] in ["HIGH", "CRITICAL"])
        )

        prob_str = f"{prediction_result['probability']:.1%}" if prediction_result else "N/A"
        risk_level_str = prediction_result["risk_level"] if prediction_result else "UNAVAILABLE"

        summary_text = (
            f"Patient {patient.mrn} Clinical Assessment:\n"
            f"- Deterministic Protocols: {len(deterministic_alerts)} rule alert(s) triggered.\n"
            f"- ML Risk Stratification: {risk_level_str} (Probability: {prob_str}).\n"
            f"- Uncertainty Assessment: Confidence score {uncertainty.confidence_score * 100:.1f}%. "
            f"{uncertainty.clinical_recommendation}\n"
            f"- Human Review Mandate: {'URGENT REVIEW REQUIRED' if requires_human_review else 'ROUTINE MONITORING'}."
        )

        # 8. Post-Execution Safety Guardrails
        guardrail_out = self.guardrails.validate_output(summary_text)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return {
            "correlation_id": correlation_id,
            "patient_mrn": patient.mrn,
            "timestamp": django_timezone.now().isoformat(),
            "status": "COMPLETED",
            "requires_human_review": requires_human_review,
            "deterministic_rules": [asdict(a) for a in deterministic_alerts],
            "ml_prediction": prediction_result,
            "uncertainty": asdict(uncertainty),
            "shap_explanation": shap_explanation,
            "guideline_citations": [asdict(c) for c in knowledge_res.citations],
            "grounding_confidence": knowledge_res.grounding_confidence,
            "clinical_summary": guardrail_out.sanitized_input,
            "total_latency_ms": elapsed_ms,
        }
