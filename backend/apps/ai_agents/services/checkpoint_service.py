import json
import logging
from typing import Any, Dict
from apps.ai_agents.models import AgentExecution, AgentSession, AgentMessage
from apps.ai_agents.schemas.agent_state import AgentState

logger = logging.getLogger("ai_agents.services.checkpoint_service")


class CheckpointService:
    """
    Durable execution checkpointer.
    Persists step-by-step state in Neon PostgreSQL without exposing private chain-of-thought.
    """
    @classmethod
    def save_checkpoint(cls, state: AgentState, execution: AgentExecution) -> None:
        try:
            execution.iteration_count = state.iteration_count
            execution.tool_call_count = len(state.tool_calls)
            execution.status = state.stop_reason or execution.status
            if state.errors:
                execution.error_message = "; ".join(state.errors[-3:])
            execution.save(update_fields=["iteration_count", "tool_call_count", "status", "error_message"])
        except Exception as exc:
            logger.error(f"Failed to persist execution checkpoint: {exc}")

    @classmethod
    def record_message(
        cls,
        session: AgentSession,
        execution: AgentExecution,
        role: str,
        content: str,
        tool_calls: list = None,
        tool_results: list = None,
        citations: list = None,
        grounding_status: str = "GROUNDED",
        grounding_confidence: float = 1.0,
        requires_approval: bool = False,
    ) -> AgentMessage:
        return AgentMessage.objects.create(
            session=session,
            execution=execution,
            role=role,
            content=content,
            tool_calls=tool_calls or [],
            tool_results=tool_results or [],
            citations=citations or [],
            grounding_status=grounding_status,
            grounding_confidence=grounding_confidence,
            requires_approval=requires_approval,
        )
