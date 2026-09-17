import logging
import time
from typing import Any, Dict, List, Optional
from apps.ai_agents.providers.base import LLMProvider, ProviderResponse

logger = logging.getLogger("ai_agents.providers.ollama")


class OllamaProvider(LLMProvider):
    """
    Primary local LLM provider.
    Runs completely on-premise / private cluster with zero data egress.
    """
    def __init__(self, default_model: str = "medllama3:latest"):
        super().__init__(name="ollama", default_model=default_model)

    def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        timeout: int = 30,
    ) -> ProviderResponse:
        model_name = model or self.default_model
        start_time = time.perf_counter()

        try:
            from integrations.ollama.chat import OllamaChatService
            result = OllamaChatService.execute_chat(
                messages=messages,
                model=model_name,
                temperature=temperature,
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            msg_content = result.get("message", {}).get("content", "")
            tool_calls = result.get("message", {}).get("tool_calls", [])

            return ProviderResponse(
                content=msg_content,
                tool_calls=tool_calls,
                prompt_tokens=result.get("prompt_tokens", 0),
                completion_tokens=result.get("completion_tokens", 0),
                total_tokens=result.get("total_tokens", 0),
                latency_ms=round(elapsed_ms, 2),
                model=model_name,
                provider="ollama",
                raw_response=result,
            )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            logger.warning(f"Ollama generation encountered error: {exc}. Latency: {elapsed_ms:.2f}ms")
            raise

    def is_healthy(self) -> bool:
        try:
            from integrations.ollama.health import OllamaHealthChecker
            health = OllamaHealthChecker.check_health()
            return health.get("status") in ["healthy", "degraded"]
        except Exception:
            return False
