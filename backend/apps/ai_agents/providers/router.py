import logging
from typing import Any, Dict, List, Optional
from apps.ai_agents.models import DataClassification
from apps.ai_agents.providers.base import LLMProvider, ProviderResponse
from apps.ai_agents.providers.ollama import OllamaProvider
from apps.ai_agents.providers.external import ExternalProvider

logger = logging.getLogger("ai_agents.providers.router")


class ProviderRouter:
    """
    Healthcare-safe provider routing with circuit breaking and PHI firewall.
    Defaults to local Ollama.
    Allows external fallback ONLY when data classification is PUBLIC or LOW_SENSITIVITY.
    """
    def __init__(self):
        self.primary_provider = OllamaProvider()
        self.secondary_provider = ExternalProvider(name="groq", default_model="llama-3.3-70b-versatile")
        self._circuit_open_providers = set()

    def route_and_generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        requested_provider: Optional[str] = None,
        data_classification: str = DataClassification.PHI,
        model: Optional[str] = None,
        temperature: float = 0.1,
    ) -> ProviderResponse:
        # Determine provider preference
        selected_provider_name = requested_provider or "ollama"

        # If data is PHI or sensitive, external cloud provider is strictly forbidden
        if data_classification in [DataClassification.PHI, DataClassification.HIGHLY_SENSITIVE, DataClassification.AUTHENTICATION_SECRET]:
            selected_provider_name = "ollama"

        # Attempt primary execution
        if selected_provider_name == "ollama":
            try:
                return self.primary_provider.generate(
                    messages=messages,
                    tools=tools,
                    model=model,
                    temperature=temperature,
                )
            except Exception as primary_err:
                logger.warning(f"Primary Ollama provider failed: {primary_err}")
                
                # Check if fallback is allowed by data classification policy
                if data_classification in [DataClassification.PHI, DataClassification.HIGHLY_SENSITIVE]:
                    logger.warning("PHI present: External fallback blocked by healthcare safety policy.")
                    # Return safe degraded response rather than leaking data to external cloud
                    return ProviderResponse(
                        content="Local clinical inference service is temporarily degraded. "
                                "Under healthcare safety invariants, patient data cannot be routed to external cloud models. "
                                "Please refer to the standard clinical records workflow or contact the on-duty clinician.",
                        finish_reason="safe_degraded_stop",
                        provider="ollama_safe_degraded",
                        model=model or "safe-fallback",
                    )
                
                # For public/non-sensitive queries, attempt external fallback
                logger.info("Non-sensitive query: attempting approved external fallback...")
                try:
                    resp = self.secondary_provider.generate(
                        messages=messages,
                        tools=tools,
                        model=model,
                        temperature=temperature,
                    )
                    resp.raw_response = {"fallback_triggered": True, "fallback_reason": str(primary_err)}
                    return resp
                except Exception as fallback_err:
                    logger.error(f"External fallback failed: {fallback_err}")
                    return ProviderResponse(
                        content="All AI providers are currently unavailable. Standard clinical operations remain active.",
                        finish_reason="provider_unavailable",
                        provider="none",
                    )

        # Explicit non-Ollama request for non-PHI
        return self.secondary_provider.generate(
            messages=messages,
            tools=tools,
            model=model,
            temperature=temperature,
        )
