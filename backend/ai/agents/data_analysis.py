"""
DataAnalysisAgent:
Specialized agent for Medical Informaticists.
Analyzes population health risk distributions, ML calibration, and feature drift (PSI)
without arbitrary SQL or shell execution.
"""
import time
from typing import List

from .base_agent import BaseAgent
from ai.domain.entities import ActionLevel, AIRequestEnvelope, AIResponseEnvelope, ToolCallRequest
from ai.providers.registry import get_provider_registry
from ai.tools.tool_executor import ToolExecutor


class DataAnalysisAgent(BaseAgent):
    @property
    def agent_name(self) -> str:
        return "DataAnalysisAgent"

    @property
    def role_description(self) -> str:
        return "Analyzes model calibration, population drift metrics, and aggregated clinical performance."

    @property
    def action_level(self) -> ActionLevel:
        return ActionLevel.LEVEL_1  # Analysis & aggregation

    @property
    def allowed_tools(self) -> List[str]:
        return ["calculate_psi_drift"]

    @property
    def system_instructions(self) -> str:
        return (
            "You are the HealthNova Medical Informatics Data Analysis Agent. You assist informaticists in inspecting "
            "MLOps drift statistics (PSI, KS-test), ensemble performance distributions, and calibration metrics. "
            "No raw patient identifiers or arbitrary SQL execution are permitted."
        )

    def execute(self, request: AIRequestEnvelope) -> AIResponseEnvelope:
        start_t = time.time()
        tool_executions = []

        # Run drift analysis tool
        tc = ToolCallRequest(tool_name="calculate_psi_drift", arguments={"feature_name": "systolic_bp"})
        res = ToolExecutor.execute(tc, request.user_id, request.user_role, request.correlation_id)
        tool_executions.append(res)

        prompt = (
            f"INFORMATICS QUERY: {request.query}\n\n"
            f"MLOPS DRIFT AUDIT DATA: {res.result_data}\n\n"
            "Provide a rigorous technical analysis of the feature stability, calibration status, and drift alerts."
        )

        provider = get_provider_registry().get_provider("OPENAI")
        model = request.model_override or "gpt-4o"
        comp = provider.generate(
            prompt=prompt,
            system_instruction=self.system_instructions,
            model_name=model,
            temperature=0.1,
            max_tokens=1500,
        )

        cost = provider.calculate_cost(model, comp.input_tokens, comp.output_tokens)
        latency = (time.time() - start_t) * 1000.0

        return AIResponseEnvelope(
            content=comp.text,
            model_name=model,
            provider=provider.provider_name,
            tool_executions=tool_executions,
            input_tokens=comp.input_tokens,
            output_tokens=comp.output_tokens,
            estimated_cost_usd=cost,
            latency_ms=latency,
        )
