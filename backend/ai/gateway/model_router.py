"""
Intelligent Model Router selecting models based on role, task, data classification, and cost criteria.
Enforces local Ollama routing for sensitive clinical data (PHI).
"""
import logging
from typing import Optional, Tuple

logger = logging.getLogger("ai.gateway.model_router")


class AIModelRouter:
    """
    Directs clinical tasks to calibrated models and local inference runtimes.
    """

    ROLE_DEFAULTS = {
        "DOCTOR": ("OLLAMA", "llama3.3:8b-instruct-q4_K_M"),
        "CLINICAL_INFORMATICIST": ("OLLAMA", "llama3.3:8b-instruct-q4_K_M"),
        "NURSE": ("OLLAMA", "qwen2.5:7b-instruct-q4_K_M"),
        "PATIENT": ("LOCAL", "llama3.3:8b-instruct-q4_K_M"),
        "USER": ("LOCAL", "llama3.3:8b-instruct-q4_K_M"),
        "ADMIN": ("OLLAMA", "llama3.3:70b-instruct-q4_K_M"),
    }

    CLOUD_FALLBACKS = {
        "DOCTOR": ("ANTHROPIC", "claude-3-5-sonnet-20241022"),
        "NURSE": ("GEMINI", "gemini-2.0-flash"),
        "PATIENT": ("GEMINI", "gemini-2.0-flash"),
        "USER": ("GEMINI", "gemini-2.0-flash"),
        "INFORMATICIST": ("OPENAI", "gpt-4o"),
        "ADMIN": ("LOCAL", "llama3.3:70b"),
    }

    @classmethod
    def route(
        cls,
        user_role: str,
        task_type: str = "DEFAULT",
        data_classification: str = "INTERNAL",
        require_local: bool = False,
    ) -> Tuple[str, str]:
        """
        Returns (provider_name, model_name).
        Guarantees local Ollama execution when data_classification is PHI or require_local is True.
        """
        role_key = user_role.upper() if user_role else "DOCTOR"
        is_phi = data_classification.upper() in {"RESTRICTED_PHI", "PHI", "CONFIDENTIAL", "HIGH_RISK"}

        # 1. Database-configured override from AIModelConfig or LLMModelRegistry if active
        try:
            from apps.ai_orchestrator.models import LLMModelRegistry
            active_model = LLMModelRegistry.objects.filter(
                status=LLMModelRegistry.Status.ACTIVE,
                provider="OLLAMA",
            ).first()
            if active_model and (is_phi or require_local):
                return "OLLAMA", active_model.tag
        except Exception:
            pass

        try:
            from apps.ai_orchestrator.models import AIModelConfig
            default_cfg = AIModelConfig.objects.filter(is_default=True, is_active=True).first()
            if default_cfg:
                if is_phi or require_local:
                    if default_cfg.provider.upper() in {"OLLAMA", "LOCAL", "OPENSOURCE"}:
                        return default_cfg.provider, default_cfg.model_name
                    # Default config is cloud, but PHI requires local -> fall through to local default
                else:
                    return default_cfg.provider, default_cfg.model_name
        except Exception:
            pass

        # 2. Strict local routing for PHI
        if is_phi or require_local:
            return cls.ROLE_DEFAULTS.get(role_key, ("OLLAMA", "llama3.3:8b-instruct-q4_K_M"))

        # 3. Non-sensitive general queries may use cloud fallbacks
        return cls.ROLE_DEFAULTS.get(role_key, ("OPENAI", "gpt-4o"))
