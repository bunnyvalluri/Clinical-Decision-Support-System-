"""
Central Provider Registry managing instances and fallback chains.
"""
import logging
from typing import Dict, Optional
from decouple import config

from .base import BaseLLMProvider
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider
from .gemini_provider import GeminiProvider
from .local_provider import LocalModelProvider

logger = logging.getLogger("ai.providers.registry")


class ProviderRegistry:
    """
    Singleton registry managing initialized LLM providers.
    """

    _instance: Optional["ProviderRegistry"] = None

    def __new__(cls) -> "ProviderRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._providers = {}
            cls._instance._init_providers()
        return cls._instance

    def _init_providers(self) -> None:
        openai_key = config("OPENAI_API_KEY", default="")
        anthropic_key = config("ANTHROPIC_API_KEY", default="")
        gemini_key = config("GEMINI_API_KEY", default=config("GOOGLE_API_KEY", default=""))
        ollama_url = config("OLLAMA_BASE_URL", default="http://localhost:11434")

        self._providers["OPENAI"] = OpenAIProvider(api_key=openai_key)
        self._providers["ANTHROPIC"] = AnthropicProvider(api_key=anthropic_key)
        self._providers["GEMINI"] = GeminiProvider(api_key=gemini_key)
        self._providers["LOCAL"] = LocalModelProvider(base_url=ollama_url)
        self._providers["OPENSOURCE"] = LocalModelProvider(base_url=ollama_url)

    def get_provider(self, provider_name: str) -> BaseLLMProvider:
        normalized = provider_name.upper()
        if normalized in self._providers:
            return self._providers[normalized]
        logger.warning("Provider %s not found. Falling back to LOCAL provider.", provider_name)
        return self._providers["LOCAL"]

    def list_available_providers(self) -> Dict[str, bool]:
        return {name: prov.health_check() for name, prov in self._providers.items()}


_global_registry = ProviderRegistry()


def get_provider_registry() -> ProviderRegistry:
    return _global_registry
