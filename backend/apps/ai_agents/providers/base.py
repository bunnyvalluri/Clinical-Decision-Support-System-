from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ProviderResponse(BaseModel):
    content: str
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0
    model: str = ""
    provider: str = ""
    finish_reason: str = "stop"
    raw_response: Optional[Dict[str, Any]] = None


class LLMProvider(ABC):
    """
    Abstract LLM provider interface.
    Decouples agent logic from specific inference backends.
    """
    def __init__(self, name: str, default_model: str):
        self.name = name
        self.default_model = default_model

    @abstractmethod
    def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        timeout: int = 30,
    ) -> ProviderResponse:
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        pass
