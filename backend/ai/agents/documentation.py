"""
DocumentationAgent:
Formats clinical encounters into structured SOAP notes and HL7 FHIR documentation.
"""
import time
from typing import List

from .base_agent import BaseAgent
from ai.domain.entities import ActionLevel, AIRequestEnvelope, AIResponseEnvelope
from ai.providers.registry import get_provider_registry


class DocumentationAgent(BaseAgent):
    @property
    def agent_name(self) -> str:
        return "DocumentationAgent"

    @property
    def role_description(self) -> str:
        return "Formats validated clinical interactions into standardized SOAP notes and FHIR clinical documentation."

    @property
    def action_level(self) -> ActionLevel:
        return ActionLevel.LEVEL_2  # Draft preparation

    @property
    def allowed_tools(self) -> List[str]:
        return []

    @property
    def system_instructions(self) -> str:
        return (
            "You are the HealthNova Clinical Documentation Specialist. You format clinical encounter information "
            "into standard Subjective, Objective, Assessment, and Plan (SOAP) drafts for physician signature. "
            "You cannot invent assertions not present in the supplied clinical context."
        )

    def execute(self, request: AIRequestEnvelope) -> AIResponseEnvelope:
        start_t = time.time()

        prompt = (
            f"CLINICAL RAW ENCOUNTER DATA:\n{request.query}\n\n"
            "Generate a structured clinical SOAP note draft with:\n"
            "- Subjective (Chief complaint & patient history)\n"
            "- Objective (Vitals & lab findings)\n"
            "- Assessment (Differential considerations & ML risk score context)\n"
            "- Plan (Draft monitoring and follow-up recommendations for clinician review)"
        )

        provider = get_provider_registry().get_provider("ANTHROPIC")
        model = request.model_override or "claude-3-5-sonnet-20241022"
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
            requires_human_approval=True,
            approval_details={"action": "DOCUMENTATION_SIGN_OFF", "agent": self.agent_name},
            input_tokens=comp.input_tokens,
            output_tokens=comp.output_tokens,
            estimated_cost_usd=cost,
            latency_ms=latency,
        )
