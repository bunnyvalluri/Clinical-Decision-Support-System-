"""
Abstract Base LLM Provider Interface.
"""
from abc import ABC, abstractmethod
from typing import Any, AsyncIterator, Dict, List, Optional
import time

from ai.domain.entities import ToolCallRequest, ToolCallResult


class ProviderCompletionResult:
    def __init__(
        self,
        text: str,
        input_tokens: int = 0,
        output_tokens: int = 0,
        model_name: str = "",
        tool_calls: Optional[List[ToolCallRequest]] = None,
        latency_ms: float = 0.0,
        raw_response: Optional[Dict[str, Any]] = None,
    ):
        self.text = text
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.model_name = model_name
        self.tool_calls = tool_calls or []
        self.latency_ms = latency_ms
        self.raw_response = raw_response or {}


class BaseLLMProvider(ABC):
    """
    Abstract interface for all model providers (OpenAI, Anthropic, Gemini, Local).
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key
        self.base_url = base_url

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return provider identifier (e.g. 'OPENAI', 'ANTHROPIC', 'GEMINI', 'LOCAL')."""
        pass

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_instruction: str,
        model_name: str,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> ProviderCompletionResult:
        """Execute synchronous completion."""
        pass

    @abstractmethod
    def generate_stream(
        self,
        prompt: str,
        system_instruction: str,
        model_name: str,
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ) -> Any:
        """Yield streaming chunks of text."""
        pass

    @abstractmethod
    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate estimated cost in USD."""
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """Verify API accessibility."""
        pass
