"""
Base Agent Interface & Execution Specification.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from ai.domain.entities import ActionLevel, AIRequestEnvelope, AIResponseEnvelope


class BaseAgent(ABC):
    """
    Abstract base class for all HealthNova AI agents.
    Enforces role-based tool boundaries, memory scopes, and non-autonomous invariants.
    """

    @property
    @abstractmethod
    def agent_name(self) -> str:
        pass

    @property
    @abstractmethod
    def role_description(self) -> str:
        pass

    @property
    @abstractmethod
    def action_level(self) -> ActionLevel:
        pass

    @property
    @abstractmethod
    def allowed_tools(self) -> List[str]:
        pass

    @property
    @abstractmethod
    def system_instructions(self) -> str:
        pass

    @abstractmethod
    def execute(self, request: AIRequestEnvelope) -> AIResponseEnvelope:
        """Executes the agent's primary decision-support task."""
        pass
