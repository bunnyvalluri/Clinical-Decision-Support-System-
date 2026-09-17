import logging
import time
from typing import Any, Dict, List, Optional
from apps.ai_agents.schemas.agent_state import AgentState
from apps.ai_agents.schemas.tool_calls import ToolCallRequest
from apps.ai_agents.services.tool_registry import ToolRegistry

logger = logging.getLogger("ai_agents.services.agent_planner")


class AgentPlanner:
    """
    Finite State Machine Planner.
    Directs the PLAN -> ACT -> OBSERVE -> VALIDATE -> CONTINUE/STOP cycle.
    Enforces hard stopping thresholds: max iterations, tool budgets, and timeouts.
    """
    @classmethod
    def plan_next_step(
        cls,
        state: AgentState,
        allowed_tools: List[str],
    ) -> Optional[ToolCallRequest]:
        """
        Determines if a tool call is required or if the agent has enough observation
        to synthesize the final validated answer.
        """
        # 1. Enforce hard execution constraints
        if state.iteration_count >= state.max_iterations:
            state.is_terminal = True
            state.stop_reason = "MAX_ITERATIONS_REACHED"
            return None

        if len(state.tool_calls) >= state.max_tool_calls:
            state.is_terminal = True
            state.stop_reason = "MAX_TOOL_CALLS_REACHED"
            return None

        # 2. Heuristic / Model-Assisted Tool Selection
        # If we have already executed tools and gathered observations, stop and respond
        if state.tool_results:
            state.is_terminal = True
            return None

        # Check if the user query requests specific clinical facts
        lower_task = state.task.lower()
        patient_id = state.patient_id

        # Sepsis, Lactate, AKI, Protocol retrieval
        if any(term in lower_task for term in ["protocol", "guideline", "ssc", "kdigo", "aha", "resuscitation"]):
            if "retrieve_guideline" in allowed_tools and "kdigo" in lower_task:
                return ToolCallRequest(tool_name="retrieve_guideline", arguments={"guideline_id": "KDIGO-2022-AKI"})
            if "retrieve_guideline" in allowed_tools and ("sepsis" in lower_task or "ssc" in lower_task):
                return ToolCallRequest(tool_name="retrieve_guideline", arguments={"guideline_id": "SSC-2021-SEPSIS"})
            if "search_authorized_clinical_documents" in allowed_tools:
                return ToolCallRequest(tool_name="search_authorized_clinical_documents", arguments={"query": state.task})

        # Vitals or physiological trends
        if any(term in lower_task for term in ["vital", "blood pressure", "heart rate", "spo2", "triage", "temperature"]):
            if patient_id and "get_patient_vitals" in allowed_tools:
                return ToolCallRequest(tool_name="get_patient_vitals", arguments={"patient_id": patient_id})

        # Risk prediction or explanation
        if any(term in lower_task for term in ["risk", "prediction", "probability", "shap", "explanation"]):
            if patient_id and "get_patient_risk_prediction" in allowed_tools:
                return ToolCallRequest(tool_name="get_patient_risk_prediction", arguments={"patient_id": patient_id})

        # Patient summary / timeline
        if any(term in lower_task for term in ["summary", "timeline", "history", "notes"]):
            if patient_id and "get_patient_summary" in allowed_tools:
                return ToolCallRequest(tool_name="get_patient_summary", arguments={"patient_id": patient_id})

        # Analytics / Drift / Quality
        if "drift" in lower_task and "get_prediction_drift" in allowed_tools:
            return ToolCallRequest(tool_name="get_prediction_drift", arguments={})
        if "performance" in lower_task and "get_model_performance" in allowed_tools:
            return ToolCallRequest(tool_name="get_model_performance", arguments={})

        # System health / Admin
        if any(term in lower_task for term in ["health", "status", "diagnostic", "infrastructure"]):
            if "get_service_health_diagnostics" in allowed_tools:
                return ToolCallRequest(tool_name="get_service_health_diagnostics", arguments={})

        # Default: No further tools needed, proceed to direct grounded synthesis
        state.is_terminal = True
        return None
