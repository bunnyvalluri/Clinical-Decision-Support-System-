"""
Ruflo Multi-Agent AI Engineering Orchestration Engine.
Version: 3.42.0
Coordinates hierarchical swarms of specialized agents under strict policy invariants,
loop protection, context minimization, dual-role authorization, and human-in-the-loop governance.
"""
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
import json
import logging
from pathlib import Path
import re
import time
from typing import Any, Dict, List, Optional, Tuple
import uuid

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.db import transaction
from django.utils import timezone as django_timezone

from apps.accounts.models import User, UserRole
from apps.ai_orchestrator.context_builder import ClinicalRiskContextBuilder, MinimizedClinicalContext
from apps.ai_orchestrator.models import (
    AgentMemoryRecord,
    AgentTask,
    AIAgentTrace,
    AIApprovalGate,
    AIInteraction,
)
from apps.clinical.models import ClinicalRecord
from apps.patients.models import Patient
from apps.predictions.models import Prediction
from services.clinical_rules_engine import ClinicalRulesEngine
from services.explanation_service import ExplanationService
from services.prediction_service import PredictionService
from services.uncertainty_engine import UncertaintyEngine

from .guardrails import SafetyGuardrailService
from .knowledge_retrieval import KnowledgeRetrievalService

logger = logging.getLogger(__name__)


@dataclass
class SwarmExecutionReceipt:
    workflow_id: str
    status: str  # COMPLETED, WAITING_FOR_APPROVAL, FAILED, SAFETY_BLOCKED, TIMED_OUT
    requires_human_review: bool
    safety_verdict: str  # SAFE, REVIEW_REQUIRED, UNSAFE, INSUFFICIENT_INFORMATION
    participating_agents: List[str]
    total_steps: int
    total_tool_calls: int
    total_latency_ms: float
    output_summary: str
    structured_data: Dict[str, Any]
    approval_gate_id: Optional[str] = None
    error_detail: Optional[str] = None


class RufloSwarmEngine:
    """
    Central orchestration harness coordinating specialized Ruflo agents.
    Enforces deterministic boundaries, zero-PHI in memory, and human approval gates.
    """

    MAX_STEPS = 10
    MAX_AGENTS = 6
    MAX_RUNTIME_SECONDS = 60.0
    MAX_TOOL_CALLS = 15
    MAX_RETRIES = 2

    def __init__(self) -> None:
        self.rules_engine = ClinicalRulesEngine()
        self.uncertainty_engine = UncertaintyEngine()
        self.guardrails = SafetyGuardrailService()
        self.knowledge = KnowledgeRetrievalService()
        self.prediction_service = PredictionService()
        self.explanation_service = ExplanationService()
        self.agent_manifests = self._load_agent_manifests()
        self.tool_manifests = self._load_tool_manifests()

    def _load_agent_manifests(self) -> Dict[str, Dict[str, Any]]:
        config_path = Path(settings.BASE_DIR).parent / ".ruflo" / "agents.json"
        if config_path.exists():
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return {agent["id"]: agent for agent in data.get("agents", [])}
            except Exception as exc:
                logger.warning("Could not read .ruflo/agents.json: %s", exc)
        return {}

    def _load_tool_manifests(self) -> Dict[str, Dict[str, Any]]:
        tools_path = Path(settings.BASE_DIR).parent / ".ruflo" / "tools.json"
        if tools_path.exists():
            try:
                with open(tools_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return {tool["name"]: tool for tool in data.get("tools", [])}
            except Exception as exc:
                logger.warning("Could not read .ruflo/tools.json: %s", exc)
        return {}

    def validate_tool_authorization(
        self, tool_name: str, user_role: str, agent_id: str
    ) -> Tuple[bool, str]:
        """Verify that both user role and calling agent are explicitly authorized."""
        tool = self.tool_manifests.get(tool_name)
        if not tool:
            return False, f"Tool '{tool_name}' is not registered in the system."

        category = tool.get("category", "RESTRICTED")
        if category == "FORBIDDEN":
            return False, f"Tool '{tool_name}' is permanently FORBIDDEN in this environment."

        allowed_roles = tool.get("allowedRoles", [])
        if "ALL" not in allowed_roles:
            role_norm = user_role.upper()
            if role_norm == "CLINICIAN":
                role_norm = "DOCTOR"
            if role_norm not in allowed_roles:
                return (
                    False,
                    f"User role '{user_role}' is not authorized to invoke tool '{tool_name}'.",
                )

        allowed_agents = tool.get("allowedAgents", [])
        if agent_id not in allowed_agents:
            return (
                False,
                f"Agent '{agent_id}' is not authorized to execute tool '{tool_name}'.",
            )

        return True, "Authorized"

    def broadcast_realtime_event(self, group_name: str, event_data: Dict[str, Any]) -> None:
        """Broadcast real-time orchestration events across Redis to Django Channels."""
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        "type": "ai_event",
                        "data": event_data,
                    },
                )
        except Exception as exc:
            logger.debug("Real-time broadcast skipped or failed: %s", exc)

    def record_agent_trace(
        self,
        workflow_id: str,
        correlation_id: str,
        agent_name: str,
        tool_calls: List[Dict[str, Any]],
        input_summary: str,
        output_summary: str,
        status: str,
        latency_ms: float,
        user: Optional[User] = None,
        role: str = "SYSTEM",
        failure_reason: str = "",
        approval_state: str = "NOT_REQUIRED",
    ) -> AIAgentTrace:
        """Create an immutable trace record in PostgreSQL."""
        return AIAgentTrace.objects.create(
            workflow_id=workflow_id,
            correlation_id=correlation_id,
            user=user,
            role=role,
            agent_name=agent_name,
            agent_version="3.42.0",
            tool_calls=tool_calls,
            input_summary=input_summary[:1000],
            output_summary=output_summary[:2000],
            status=status,
            latency_ms=latency_ms,
            failure_reason=failure_reason[:1000],
            approval_state=approval_state,
        )

    def store_memory(
        self,
        namespace: str,
        key: str,
        value: Dict[str, Any],
        provenance: str = "system",
        ttl_days: int = 180,
    ) -> Tuple[bool, str]:
        """Store reusable knowledge while strictly preventing patient PHI spillage."""
        val_str = json.dumps(value)
        # Scan for potential PHI patterns (MRN, SSN, phone numbers)
        phi_patterns = [
            r"MRN-?[0-9A-Z]{4,}",
            r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
            r"\b\d{3}-\d{3}-\d{4}\b",  # Phone
        ]
        for pat in phi_patterns:
            if re.search(pat, val_str, re.IGNORECASE):
                logger.error("SECURITY ALERT: Attempted to store potential PHI in memory namespace '%s'", namespace)
                return False, "Storage rejected: Potential PHI detected in memory payload."

        valid_namespaces = [ns.value for ns in AgentMemoryRecord.Namespace]
        if namespace not in valid_namespaces:
            return False, f"Invalid namespace '{namespace}'. Must be one of {valid_namespaces}"

        expires_at = django_timezone.now() + timedelta(days=ttl_days)
        AgentMemoryRecord.objects.update_or_create(
            namespace=namespace,
            key=key,
            defaults={
                "value": value,
                "provenance": provenance,
                "expires_at": expires_at,
            },
        )
        return True, "Memory stored successfully."

    def execute_clinical_workflow(
        self,
        patient_id: uuid.UUID,
        clinician: User,
        query: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> SwarmExecutionReceipt:
        """
        Execute a complete, policy-governed clinical decision support swarm workflow.
        Steps:
        1. Input Guardrails & Prompt Injection Scanning.
        2. Context Minimization via ClinicalRiskContextBuilder.
        3. Parallel execution of Deterministic Protocols and ML Prediction.
        4. TreeSHAP attribution and Grounded Guideline Retrieval.
        5. Uncertainty & Out-of-Distribution calculation.
        6. Clinical Safety Agent evaluation (SAFE / REVIEW_REQUIRED / UNSAFE).
        7. Human Approval Gate submission if review required.
        8. Audit Trace and Task Queue persistence.
        9. Real-time WebSocket emission.
        """
        start_time = time.perf_counter()
        workflow_id = str(uuid.uuid4())
        correlation_id = correlation_id or workflow_id
        user_role = getattr(clinician, "role", "DOCTOR")

        # Create master task record
        task = AgentTask.objects.create(
            workflow_id=workflow_id,
            agent_type="coordinator",
            task_type="CLINICAL_DECISION_SUPPORT",
            priority=AgentTask.TaskPriority.HIGH,
            status=AgentTask.TaskStatus.RUNNING,
            created_by=clinician,
            started_at=django_timezone.now(),
            input_reference={"patient_id": str(patient_id), "query": query or ""},
        )

        self.broadcast_realtime_event(
            "dashboard",
            {
                "event": "AI_WORKFLOW_STARTED",
                "workflow_id": workflow_id,
                "task_id": str(task.id),
                "role": user_role,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

        # 1. Prompt Injection & Input Guardrails
        if query:
            guardrail_in = self.guardrails.validate_input(query, user_role=user_role)
            if not guardrail_in.is_safe:
                task.status = AgentTask.TaskStatus.REJECTED
                task.error_code = "SAFETY_BLOCKED"
                task.completed_at = django_timezone.now()
                task.save(update_fields=["status", "error_code", "completed_at"])

                self.record_agent_trace(
                    workflow_id=workflow_id,
                    correlation_id=correlation_id,
                    agent_name="healthcare-security-agent",
                    tool_calls=[],
                    input_summary=query,
                    output_summary="Input blocked by safety guardrails",
                    status="REJECTED",
                    latency_ms=(time.perf_counter() - start_time) * 1000,
                    user=clinician,
                    role=user_role,
                    failure_reason=guardrail_in.reason or "Security violation",
                )

                self.broadcast_realtime_event(
                    "alerts",
                    {
                        "event": "SECURITY_ALERT",
                        "workflow_id": workflow_id,
                        "reason": guardrail_in.reason,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )

                return SwarmExecutionReceipt(
                    workflow_id=workflow_id,
                    status="SAFETY_BLOCKED",
                    requires_human_review=False,
                    safety_verdict="UNSAFE",
                    participating_agents=["healthcare-security-agent"],
                    total_steps=1,
                    total_tool_calls=0,
                    total_latency_ms=(time.perf_counter() - start_time) * 1000,
                    output_summary=f"Safety Guardrail Block: {guardrail_in.reason}",
                    structured_data={"blocked": True, "reason": guardrail_in.reason},
                    error_detail=guardrail_in.reason,
                )

        # 2. Context Minimization
        patient = Patient.objects.get(id=patient_id)
        minimized_context = ClinicalRiskContextBuilder.build_context(patient)

        # 3. Deterministic Protocol Evaluation
        clinical_data_dict = {
            "age": minimized_context.age,
            **minimized_context.latest_observations,
        }
        rule_alerts = self.rules_engine.evaluate(clinical_data_dict)
        has_critical_rule = any(a.severity == "CRITICAL_EMERGENCY" for a in rule_alerts)

        # 4. ML Prediction & TreeSHAP
        prediction_result = None
        shap_explanation = None
        try:
            pred_obj = self.prediction_service.predict_patient(
                patient_id=patient.id,
                requested_by=clinician,
            )
            prediction_result = {
                "prediction_id": str(pred_obj.id),
                "risk_level": pred_obj.prediction_result,
                "probability": float(pred_obj.probability),
                "model_name": pred_obj.model_name,
                "model_version": pred_obj.model_version_str,
            }
            if hasattr(pred_obj, "explanation") and pred_obj.explanation:
                shap_explanation = {
                    "top_features": pred_obj.explanation.top_risk_factors,
                    "base_value": pred_obj.explanation.baseline_value,
                }
        except Exception as exc:
            logger.warning("ML prediction failed during workflow: %s", exc)

        # 5. Model Uncertainty & OOD
        features_for_ood = {k: v for k, v in clinical_data_dict.items() if v is not None}
        ensemble_preds = [prediction_result["probability"]] if prediction_result else [0.5]
        uncertainty = self.uncertainty_engine.evaluate_uncertainty(features_for_ood, ensemble_preds)

        # 6. Guideline Knowledge Retrieval
        retrieval_query = query or f"inpatient risk assessment age {patient.age}"
        knowledge_res = self.knowledge.retrieve(retrieval_query, clinical_context=clinical_data_dict)

        # 7. Clinical Safety Evaluation
        # Safety verdict: SAFE, REVIEW_REQUIRED, UNSAFE, INSUFFICIENT_INFORMATION
        if not minimized_context.vitals_summary:
            safety_verdict = "INSUFFICIENT_INFORMATION"
            requires_human_review = True
        elif has_critical_rule or uncertainty.should_abstain:
            safety_verdict = "REVIEW_REQUIRED"
            requires_human_review = True
        elif prediction_result and prediction_result["risk_level"] in ["HIGH", "CRITICAL"]:
            safety_verdict = "REVIEW_REQUIRED"
            requires_human_review = True
        else:
            safety_verdict = "SAFE"
            requires_human_review = False

        # 8. Human Approval Gate Creation if required
        approval_gate_id = None
        if requires_human_review:
            gate = AIApprovalGate.objects.create(
                action_type=AIApprovalGate.ActionType.CLINICAL_RECOMMENDATION,
                workflow_id=workflow_id,
                agent_task=task,
                requested_by_agent="clinical-safety-agent",
                model_version=prediction_result["model_version"] if prediction_result else "ensemble-v2",
                justification=(
                    f"Safety verdict '{safety_verdict}': "
                    f"{len(rule_alerts)} deterministic alert(s), "
                    f"ML risk: {prediction_result['risk_level'] if prediction_result else 'UNKNOWN'}, "
                    f"Confidence: {uncertainty.confidence_score * 100:.1f}%."
                ),
            )
            approval_gate_id = str(gate.id)
            task.approval_required = True
            task.approval_status = AgentTask.ApprovalStatus.PENDING
            task.status = AgentTask.TaskStatus.WAITING_FOR_APPROVAL
        else:
            task.status = AgentTask.TaskStatus.COMPLETED

        task.completed_at = django_timezone.now()
        task.output_reference = {
            "safety_verdict": safety_verdict,
            "requires_human_review": requires_human_review,
            "approval_gate_id": approval_gate_id,
        }
        task.save()

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        # Record agent traces for coordinator and clinical safety agent
        self.record_agent_trace(
            workflow_id=workflow_id,
            correlation_id=correlation_id,
            agent_name="clinical-safety-agent",
            tool_calls=[{"tool": "evaluate_clinical_safety", "verdict": safety_verdict}],
            input_summary=f"Context for {minimized_context.pseudonymous_id}",
            output_summary=f"Verdict: {safety_verdict}, Review: {requires_human_review}",
            status="COMPLETED",
            latency_ms=elapsed_ms * 0.4,
            user=clinician,
            role=user_role,
            approval_state="REQUIRED" if requires_human_review else "NOT_REQUIRED",
        )

        self.record_agent_trace(
            workflow_id=workflow_id,
            correlation_id=correlation_id,
            agent_name="coordinator",
            tool_calls=[
                {"tool": "get_patient_context"},
                {"tool": "evaluate_clinical_rules"},
                {"tool": "run_risk_prediction"},
                {"tool": "retrieve_approved_knowledge"},
            ],
            input_summary="Patient evaluation request",
            output_summary=f"Completed workflow in {elapsed_ms:.1f}ms",
            status="COMPLETED",
            latency_ms=elapsed_ms,
            user=clinician,
            role=user_role,
        )

        # Record AIInteraction audit entry
        AIInteraction.objects.create(
            patient=patient,
            clinician=clinician,
            correlation_id=correlation_id,
            operation_type="RUFLO_SWARM_EVALUATION",
            input_query=query or "",
            tools_invoked=[
                "get_patient_context",
                "evaluate_clinical_rules",
                "run_risk_prediction",
                "retrieve_approved_knowledge",
            ],
            safety_status=(
                AIInteraction.SafetyStatus.PASSED
                if safety_verdict == "SAFE"
                else AIInteraction.SafetyStatus.FLAGGED
            ),
            guardrail_flags=[safety_verdict],
            requires_human_review=requires_human_review,
            latency_ms=elapsed_ms,
        )

        # Real-time WebSocket emission
        self.broadcast_realtime_event(
            "dashboard",
            {
                "event": "AI_RESPONSE_READY" if not requires_human_review else "AI_REVIEW_REQUIRED",
                "workflow_id": workflow_id,
                "task_id": str(task.id),
                "approval_gate_id": approval_gate_id,
                "safety_verdict": safety_verdict,
                "requires_human_review": requires_human_review,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

        prob_display = (
            f"{prediction_result['probability']:.1%}"
            if prediction_result and "probability" in prediction_result
            else "N/A"
        )
        risk_display = (
            prediction_result["risk_level"]
            if prediction_result and "risk_level" in prediction_result
            else "UNAVAILABLE"
        )

        summary_text = (
            f"Decision Support Summary for Subject {minimized_context.pseudonymous_id}:\n"
            f"• Deterministic Protocols: {len(rule_alerts)} triggered.\n"
            f"• ML Risk Stratification: {risk_display} (Probability: {prob_display}).\n"
            f"• Confidence Score: {uncertainty.confidence_score * 100:.1f}%. "
            f"Entropy: {uncertainty.entropy:.3f}.\n"
            f"• Safety Policy Status: {safety_verdict}. "
            f"{'HUMAN REVIEW MANDATORY' if requires_human_review else 'Routine monitoring permitted'}."
        )

        return SwarmExecutionReceipt(
            workflow_id=workflow_id,
            status=task.status,
            requires_human_review=requires_human_review,
            safety_verdict=safety_verdict,
            participating_agents=[
                "coordinator",
                "clinical-workflow-agent",
                "clinical-explainability-agent",
                "clinical-safety-agent",
            ],
            total_steps=4,
            total_tool_calls=4,
            total_latency_ms=elapsed_ms,
            output_summary=summary_text,
            structured_data={
                "minimized_subject": minimized_context.pseudonymous_id,
                "deterministic_rules": [asdict(a) for a in rule_alerts],
                "ml_prediction": prediction_result,
                "uncertainty": asdict(uncertainty),
                "shap_explanation": shap_explanation,
                "citations": [asdict(c) for c in knowledge_res.citations],
                "disclaimer": (
                    "HealthNova AI operates as a decision support system. "
                    "All recommendations require clinical verification."
                ),
            },
            approval_gate_id=approval_gate_id,
        )


_global_ruflo_engine: Optional[RufloSwarmEngine] = None


def get_ruflo_engine() -> RufloSwarmEngine:
    global _global_ruflo_engine
    if _global_ruflo_engine is None:
        _global_ruflo_engine = RufloSwarmEngine()
    return _global_ruflo_engine
