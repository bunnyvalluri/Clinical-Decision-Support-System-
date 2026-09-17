from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from apps.ai_agents.models import AgentSession
from apps.ai_agents.schemas.responses import AgentRunResponse
from apps.ai_agents.services.agent_executor import AgentExecutor


class AgentRuntime(ABC):
    """
    Framework-agnostic Agent Runtime abstraction.
    Allows future replacement or augmentation with LangGraph without altering business logic.
    """
    @abstractmethod
    def execute(
        self,
        session: AgentSession,
        user_query: str,
        user,
        patient_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> AgentRunResponse:
        pass


class DeterministicAgentRuntime(AgentRuntime):
    """
    Standard production deterministic state-machine runtime.
    """
    def __init__(self):
        self.executor = AgentExecutor()

    def execute(
        self,
        session: AgentSession,
        user_query: str,
        user,
        patient_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> AgentRunResponse:
        return self.executor.run(
            session=session,
            user_query=user_query,
            user=user,
            patient_id=patient_id,
            correlation_id=correlation_id,
        )
