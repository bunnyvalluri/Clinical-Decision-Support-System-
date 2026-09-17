"""
Intelligent Model Router selecting models based on role, task, and cost criteria.
"""
from typing import Optional


class AIModelRouter:
    """
    Directs clinical tasks to calibrated models.
    """

    ROLE_DEFAULTS = {
        "DOCTOR": ("ANTHROPIC", "claude-3-5-sonnet-20241022"),
        "NURSE": ("GEMINI", "gemini-2.0-flash"),
        "PATIENT": ("GEMINI", "gemini-2.0-flash"),
        "USER": ("GEMINI", "gemini-2.0-flash"),
        "INFORMATICIST": ("OPENAI", "gpt-4o"),
        "ADMIN": ("LOCAL", "llama3.3:70b"),
    }

    @classmethod
    def route(cls, user_role: str, task_type: str = "DEFAULT") -> tuple[str, str]:
        """
        Returns (provider_name, model_name)
        """
        try:
            from apps.ai_orchestrator.models import AIModelConfig
            default_cfg = AIModelConfig.objects.filter(is_default=True, is_active=True).first()
            if default_cfg:
                return default_cfg.provider, default_cfg.model_name
        except Exception:
            pass

        return cls.ROLE_DEFAULTS.get(user_role.upper(), ("OPENAI", "gpt-4o"))
