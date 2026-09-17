"""
ClinicalResearchAgent:
Conducts evidence synthesis across approved clinical trials and guidelines.
"""
import time
from typing import List

from .base_agent import BaseAgent
from ai.domain.entities import ActionLevel, AIRequestEnvelope, AIResponseEnvelope
from ai.providers.registry import get_provider_registry
from ai.rag.corrective_rag import CorrectiveRAGPipeline
from ai.rag.citation_grounder import CitationGrounder


class ClinicalResearchAgent(BaseAgent):
    @property
    def agent_name(self) -> str:
        return "ClinicalResearchAgent"

    @property
    def role_description(self) -> str:
        return "Conducts evidence comparison and guideline synthesis across approved medical literature."

    @property
    def action_level(self) -> ActionLevel:
        return ActionLevel.LEVEL_1  # Analysis & aggregation

    @property
    def allowed_tools(self) -> List[str]:
        return ["retrieve_clinical_guidelines"]

    @property
    def system_instructions(self) -> str:
        return (
            "You are the HealthNova Clinical Research Specialist. You synthesize peer-reviewed medical literature, "
            "clinical trial consensus, and protocol updates. You cite exact guideline IDs and evidence levels. "
            "You NEVER convert research directly into unverified patient treatment."
        )

    def execute(self, request: AIRequestEnvelope) -> AIResponseEnvelope:
        start_t = time.time()
        retrieved_docs, grounding_status, refined = CorrectiveRAGPipeline.execute(request.query, top_k=4)

        evidence_blocks = "\n\n".join(
            [f"[{d.guideline_id}] {d.title} ({d.evidence_level}):\n{d.text}" for d in retrieved_docs]
        ) or "No matching clinical trials or guidelines found."

        prompt = (
            f"RESEARCH TOPIC: {request.query}\n\n"
            f"EVIDENCE DOSSIER:\n{evidence_blocks}\n\n"
            "Synthesize the evidence into:\n"
            "- Core Findings & Consensus\n"
            "- Comparative Clinical Trial Evidence\n"
            "- Evidence Grading & Limitations\n"
            "- Actionable Clinical Trial Citations"
        )

        provider = get_provider_registry().get_provider("OPENAI")
        model = request.model_override or "gpt-4o"
        comp = provider.generate(
            prompt=prompt,
            system_instruction=self.system_instructions,
            model_name=model,
            temperature=0.1,
            max_tokens=2048,
        )

        status, confidence, citations = CitationGrounder.verify_grounding(comp.text, retrieved_docs)
        cost = provider.calculate_cost(model, comp.input_tokens, comp.output_tokens)
        latency = (time.time() - start_t) * 1000.0

        return AIResponseEnvelope(
            content=comp.text,
            model_name=model,
            provider=provider.provider_name,
            citations=citations,
            grounding_status=status,
            grounding_confidence=confidence,
            input_tokens=comp.input_tokens,
            output_tokens=comp.output_tokens,
            estimated_cost_usd=cost,
            latency_ms=latency,
        )
