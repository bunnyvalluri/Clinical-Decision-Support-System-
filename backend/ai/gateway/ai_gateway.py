"""
Central AI Gateway coordinating request pipeline, safety validation,
agent dispatch, output verification, and immutable auditing.
"""
from decimal import Decimal
import logging
import time
from typing import Optional

from ai.domain.entities import AIRequestEnvelope, AIResponseEnvelope, GroundingStatus
from ai.safety.safety_engine import AISafetyEngine
from ai.gateway.rate_limiter import AIRateLimiter
from ai.gateway.model_router import AIModelRouter
from ai.agents.clinical_assistant import ClinicalAssistantAgent
from ai.agents.patient_education import PatientEducationAgent
from ai.agents.data_analysis import DataAnalysisAgent
from ai.agents.clinical_research import ClinicalResearchAgent
from ai.agents.documentation import DocumentationAgent
from ai.agents.model_evaluation import ModelEvaluationAgent

logger = logging.getLogger("ai.gateway")


class AIGateway:
    """
    Production AI Gateway. Entrypoint for all AI chat and agent executions.
    """

    def __init__(self):
        self.safety_engine = AISafetyEngine()
        self._agents = {
            "DOCTOR": ClinicalAssistantAgent(),
            "NURSE": ClinicalAssistantAgent(),
            "PATIENT": PatientEducationAgent(),
            "USER": PatientEducationAgent(),
            "INFORMATICIST": DataAnalysisAgent(),
            "ADMIN": ModelEvaluationAgent(),
        }

    def process_request(self, request: AIRequestEnvelope) -> AIResponseEnvelope:
        start_t = time.time()

        # 1. Rate Limiting Check
        allowed, remaining = AIRateLimiter.check_rate_limit(request.user_id, request.user_role)
        if not allowed:
            return AIResponseEnvelope(
                content="Rate limit exceeded. Please wait before submitting additional AI requests.",
                model_name="N/A",
                provider="GATEWAY",
                is_error=True,
                error_code="RATE_LIMIT_EXCEEDED",
            )

        # 2. Safety & Prompt Injection Check
        verdict = self.safety_engine.evaluate_request(
            user_id=request.user_id,
            user_role=request.user_role,
            query=request.query,
            patient_context=request.context_data,
        )
        if not verdict.passed:
            self._audit_event(request, verdict.reason, "SAFETY_BLOCKED", 0.0)
            return AIResponseEnvelope(
                content=f"Safety Policy Block: {verdict.reason}",
                model_name="N/A",
                provider="GATEWAY",
                safety_flags=verdict.flags,
                is_error=True,
                error_code="SAFETY_POLICY_VIOLATION",
            )

        # Update query with sanitized input
        request.query = verdict.sanitized_input

        # 3. Model & Provider Routing
        if not request.model_override:
            prov, mod = AIModelRouter.route(request.user_role)
            request.model_override = mod

        # 4. Agent Selection & Execution
        agent = self._agents.get(request.user_role.upper(), ClinicalAssistantAgent())
        try:
            response = agent.execute(request)
        except Exception as exc:
            logger.error("Agent execution failure: %s", exc)
            return AIResponseEnvelope(
                content="AI service is temporarily unavailable. Please consult hospital deterministic clinical protocols.",
                model_name="N/A",
                provider="GATEWAY",
                is_error=True,
                error_code="AI_SERVICE_UNAVAILABLE",
            )

        # 5. Output Safety Inspection
        out_passed, out_flags, cleaned_text = self.safety_engine.evaluate_output(
            response.content, request.user_role
        )
        if not out_passed:
            response.content = "Output suppressed by safety guardrail due to non-compliant clinical assertion."
            response.grounding_status = GroundingStatus.ERROR
            response.safety_flags.extend(out_flags)
        else:
            response.content = cleaned_text
            response.safety_flags.extend(verdict.flags + out_flags)

        # 6. Immutable Audit Persistence
        total_latency = (time.time() - start_t) * 1000.0
        response.latency_ms = total_latency
        self._audit_event(
            request,
            payload_summary=response.content[:200],
            verdict="PASSED" if out_passed else "FLAGGED",
            latency_ms=total_latency,
            cost=response.estimated_cost_usd,
            agent_type=agent.agent_name,
            model_name=response.model_name,
        )

        return response

    def _audit_event(
        self,
        request: AIRequestEnvelope,
        payload_summary: str,
        verdict: str,
        latency_ms: float,
        cost: float = 0.0,
        agent_type: str = "GATEWAY",
        model_name: str = "",
    ) -> None:
        try:
            from apps.ai_orchestrator.models import AIAuditEvent

            AIAuditEvent.objects.create(
                correlation_id=request.correlation_id,
                user_id=request.user_id if request.user_id else None,
                role=request.user_role,
                event_type="CHAT_REQUEST",
                agent_type=agent_type,
                model_name=model_name,
                payload_summary=payload_summary,
                safety_verdict=verdict,
                latency_ms=latency_ms,
                cost=Decimal(str(round(cost, 6))),
            )
        except Exception as err:
            logger.error("Audit logging error: %s", err)


_gateway_instance = AIGateway()


def get_ai_gateway() -> AIGateway:
    return _gateway_instance
