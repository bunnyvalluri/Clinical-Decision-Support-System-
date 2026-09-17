"""
ClinicalAssistantAgent:
Specialized agent for attending physicians and clinicians.
Summarizes patient encounters, explains ML predictions, retrieves clinical guidelines,
and drafts structured review notes under Human-in-the-Loop supervision.
"""
import time
from typing import List

from .base_agent import BaseAgent
from ai.domain.entities import ActionLevel, AIRequestEnvelope, AIResponseEnvelope, ToolCallRequest
from ai.providers.registry import get_provider_registry
from ai.rag.corrective_rag import CorrectiveRAGPipeline
from ai.rag.citation_grounder import CitationGrounder
from ai.tools.tool_executor import ToolExecutor


class ClinicalAssistantAgent(BaseAgent):
    @property
    def agent_name(self) -> str:
        return "ClinicalAssistantAgent"

    @property
    def role_description(self) -> str:
        return "Assists licensed clinicians with record summarization, ML prediction explanations, and guideline grounding."

    @property
    def action_level(self) -> ActionLevel:
        return ActionLevel.LEVEL_2  # Drafting / Decision-support

    @property
    def allowed_tools(self) -> List[str]:
        return [
            "read_patient_context",
            "read_risk_prediction",
            "retrieve_clinical_guidelines",
            "calculate_clinical_score",
        ]

    @property
    def system_instructions(self) -> str:
        return (
            "You are the HealthNova AI Clinical Assistant. You support authorized physicians with clinical context "
            "summaries, machine learning risk factor explanations, and verified peer-reviewed guidelines. "
            "CRITICAL HEALTHCARE BOUNDARY: You NEVER issue autonomous medical diagnoses or final prescriptions. "
            "All recommendations require attending physician sign-off. Clearly distinguish between calibrated ML risk "
            "scores, deterministic clinical rules (qSOFA/NEWS2), and retrieved guidelines."
        )

    def execute(self, request: AIRequestEnvelope) -> AIResponseEnvelope:
        start_t = time.time()
        tool_executions = []

        # 1. Retrieve patient context if patient_id provided
        patient_data = {}
        if request.patient_id:
            tc = ToolCallRequest(tool_name="read_patient_context", arguments={"patient_id": request.patient_id})
            res = ToolExecutor.execute(tc, request.user_id, request.user_role, request.correlation_id)
            tool_executions.append(res)
            patient_data = res.result_data

        # 2. Retrieve grounded clinical guidelines via Corrective RAG
        retrieved_docs, grounding_status, refined_q = CorrectiveRAGPipeline.execute(request.query, top_k=3)

        # Assemble prompt with strict instruction hierarchy
        evidence_text = "\n\n".join(
            [f"[{d.guideline_id}] {d.title} ({d.section}):\n{d.text}" for d in retrieved_docs]
        ) or "No specific guideline matched in the grounded repository."

        context_prompt = (
            f"CLINICAL QUERY: {request.query}\n\n"
            f"PATIENT VITALS CONTEXT: {patient_data}\n\n"
            f"GROUNDED LITERATURE EVIDENCE:\n{evidence_text}\n\n"
            "Prepare a structured clinical decision-support response with:\n"
            "1. Clinical Presentation Summary\n"
            "2. Calibrated ML Risk & Deterministic Score Observations\n"
            "3. Grounded Guideline Evidence\n"
            "4. Limitations & Uncertainty\n"
            "5. Suggested Questions for Attending Clinician Review"
        )

        # 3. Model Inference via Gateway Provider
        provider = get_provider_registry().get_provider("ANTHROPIC")
        model = request.model_override or "claude-3-5-sonnet-20241022"
        comp = provider.generate(
            prompt=context_prompt,
            system_instruction=self.system_instructions,
            model_name=model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        # 4. Verify grounding & citations
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
            tool_executions=tool_executions,
            requires_human_approval=True,
            approval_details={"action": "CLINICAL_REVIEW", "agent": self.agent_name},
            input_tokens=comp.input_tokens,
            output_tokens=comp.output_tokens,
            estimated_cost_usd=cost,
            latency_ms=latency,
        )
