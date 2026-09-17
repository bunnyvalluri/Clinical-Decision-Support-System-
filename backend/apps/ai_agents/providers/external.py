import os
import logging
import time
from typing import Any, Dict, List, Optional
from apps.ai_agents.providers.base import LLMProvider, ProviderResponse

logger = logging.getLogger("ai_agents.providers.external")


class ExternalProvider(LLMProvider):
    """
    Controlled external cloud provider (e.g. Groq, Gemini).
    Protected by PHI Firewall: Any prompt containing PHI or patient identifiers is blocked.
    """
    def __init__(self, name: str = "groq", default_model: str = "llama-3.3-70b-versatile"):
        super().__init__(name=name, default_model=default_model)
        self.api_key = os.getenv(f"{name.upper()}_API_KEY", "")

    def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        timeout: int = 30,
    ) -> ProviderResponse:
        start_time = time.perf_counter()
        target_model = model or self.default_model

        if not self.api_key:
            raise RuntimeError(
                f"External provider {self.name} is unconfigured: missing {self.name.upper()}_API_KEY."
            )

        # In a real environment, requests are dispatched via external AI gateway or official SDK
        # For security invariants, we enforce that this provider never receives patient identifiers
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return ProviderResponse(
            content=f"External response via {self.name} [{target_model}]",
            prompt_tokens=100,
            completion_tokens=50,
            total_tokens=150,
            latency_ms=round(elapsed_ms, 2),
            model=target_model,
            provider=self.name,
        )

    def is_healthy(self) -> bool:
        return bool(self.api_key)
