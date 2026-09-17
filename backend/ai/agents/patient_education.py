"""
PatientEducationAgent:
Specialized agent for patients and authorized family members.
Provides clear health education, translates medical concepts into plain language,
and prepares questions for the patient's next clinical consultation.
Strictly non-diagnostic.
"""
import time
from typing import List

from .base_agent import BaseAgent
from ai.domain.entities import ActionLevel, AIRequestEnvelope, AIResponseEnvelope
from ai.providers.registry import get_provider_registry
from ai.rag.corrective_rag import CorrectiveRAGPipeline
from ai.rag.citation_grounder import CitationGrounder


class PatientEducationAgent(BaseAgent):
    @property
    def agent_name(self) -> str:
        return "PatientEducationAgent"

    @property
    def role_description(self) -> str:
        return "Provides accessible health education, clarifies medical jargon, and prepares doctor visit questions."

    @property
    def action_level(self) -> ActionLevel:
        return ActionLevel.LEVEL_0  # Read-only educational

    @property
    def allowed_tools(self) -> List[str]:
        return ["retrieve_clinical_guidelines"]

    @property
    def system_instructions(self) -> str:
        return (
            "You are the HealthNova Patient Health Education Assistant. Your purpose is to help patients understand "
            "general wellness concepts, laboratory test names, and prepare thoughtful questions for their doctors. "
            "STRICT BOUNDARY: You do NOT provide personal medical diagnoses or prescribe treatments. "
            "Always encourage patients to discuss their individual health questions with their healthcare provider."
        )

    def execute(self, request: AIRequestEnvelope) -> AIResponseEnvelope:
        start_t = time.time()

        # Retrieve relevant general health guidance
        retrieved_docs, grounding_status, _ = CorrectiveRAGPipeline.execute(request.query, top_k=2)

        evidence_summary = "\n".join([f"- {d.title}: {d.text[:200]}" for d in retrieved_docs]) or "General health education."

        prompt = (
            f"PATIENT QUESTION: {request.query}\n\n"
            f"REFERENCE EDUCATION SOURCES:\n{evidence_summary}\n\n"
            "Explain the concept in clear, compassionate, easy-to-understand language. "
            "Conclude with 2-3 helpful questions the patient can ask their physician."
        )

        provider = get_provider_registry().get_provider("GEMINI")
        model = request.model_override or "gemini-2.0-flash"
        comp = provider.generate(
            prompt=prompt,
            system_instruction=self.system_instructions,
            model_name=model,
            temperature=0.2,
            max_tokens=1024,
        )

        # Append standard non-diagnostic disclaimer
        disclaimer = (
            "\n\n---\n*Notice: This information is for general educational purposes and does not constitute "
            "a medical diagnosis. Please consult your physician for personalized medical advice.*"
        )
        final_content = comp.text + disclaimer

        status, confidence, citations = CitationGrounder.verify_grounding(comp.text, retrieved_docs)
        cost = provider.calculate_cost(model, comp.input_tokens, comp.output_tokens)
        latency = (time.time() - start_t) * 1000.0

        return AIResponseEnvelope(
            content=final_content,
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
