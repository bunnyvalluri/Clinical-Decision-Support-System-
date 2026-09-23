"""
Typed Decision Gateway.
Top-level entrypoint routing requests across Laya (Multilingual) and Laya-MLX (Apple Silicon) providers.
"""
import logging
from typing import Any, Dict, List, Optional, Tuple

from django.utils import timezone

from .base import (
    DecisionType,
    ProviderState,
    ProviderType,
    TypedDecisionOutput,
    TypedDecisionProvider,
    UncertaintyStatus,
)
from .config import TypedDecisionConfig
from .language_router import LayaLanguageRouter
from .laya_provider import LayaProvider
from integrations.laya_mlx.adapter import LayaMLXProvider

logger = logging.getLogger("integrations.typed_decisions.gateway")


class TypedDecisionGateway:
    """
    Central gateway coordinating typed-decision providers behind the AI Safety Gateway.
    """
    _providers: Dict[str, TypedDecisionProvider] = {}

    @classmethod
    def get_provider(cls, name: Optional[str] = None) -> TypedDecisionProvider:
        """
        Get or initialize the specified provider ('LAYA' or 'LAYA_MLX').
        """
        provider_key = (name or TypedDecisionConfig.DEFAULT_PROVIDER).upper()

        if provider_key not in cls._providers:
            if provider_key == "LAYA_MLX":
                cls._providers[provider_key] = LayaMLXProvider(name="laya-mlx")
            else:
                cls._providers[provider_key] = LayaProvider(name="laya")

        return cls._providers[provider_key]

    @classmethod
    def resolve_provider_for_request(
        cls,
        context: str,
        requested_provider: Optional[str] = None,
    ) -> Tuple[TypedDecisionProvider, str]:
        """
        Resolve provider based on language requirements, platform, and explicit request.
        """
        # 1. If explicit provider requested, honor it
        if requested_provider:
            return cls.get_provider(requested_provider), f"Explicit caller request: {requested_provider}"

        # 2. Check language requirement
        analysis = LayaLanguageRouter.analyse(context)
        if analysis["script"] != "latin":
            # Non-Latin script requires Laya Multilingual provider
            return cls.get_provider("LAYA"), f"Multilingual script '{analysis['script']}' requires Laya Multilingual provider"

        # 3. Default to configured provider
        default_prov = cls.get_provider(TypedDecisionConfig.DEFAULT_PROVIDER)
        caps = default_prov.capabilities()

        # 4. If default provider is LAYA_MLX but host is unsupported, failover to LAYA with audit
        if TypedDecisionConfig.DEFAULT_PROVIDER.upper() == "LAYA_MLX" and not caps.get("available"):
            fallback = cls.get_provider("LAYA")
            return fallback, "Failover: LAYA_MLX unsupported on current platform, routed to LAYA"

        return default_prov, f"Default policy provider: {TypedDecisionConfig.DEFAULT_PROVIDER}"

    @classmethod
    def predict(
        cls,
        decision_type: DecisionType,
        case_context: str,
        instructions: str,
        options_or_criteria: Any,
        schema_version: str = "1.0.0",
        correlation_id: Optional[str] = None,
        language: Optional[str] = None,
        requested_provider: Optional[str] = None,
    ) -> TypedDecisionOutput:
        """
        Execute typed decision through resolved provider with audited failover.
        """
        provider, resolution_reason = cls.resolve_provider_for_request(case_context, requested_provider)

        if decision_type == DecisionType.CHOICE:
            output = provider.predict_choice(
                case_context, instructions, options_or_criteria, schema_version, correlation_id, language
            )
        elif decision_type == DecisionType.SCORE:
            output = provider.predict_score(
                case_context, instructions, options_or_criteria, schema_version, correlation_id, language
            )
        else:
            output = provider.predict_boolean(
                case_context, instructions, schema_version, correlation_id, language
            )

        output.audit_metadata["provider_resolution_reason"] = resolution_reason
        return output

    @classmethod
    def get_all_capabilities(cls) -> Dict[str, Any]:
        """
        Aggregate diagnostics across both Laya and Laya-MLX providers.
        """
        laya_prov = cls.get_provider("LAYA")
        mlx_prov = cls.get_provider("LAYA_MLX")

        return {
            "default_provider": TypedDecisionConfig.DEFAULT_PROVIDER,
            "providers": {
                "laya": laya_prov.capabilities(),
                "laya_mlx": mlx_prov.capabilities(),
            },
            "timestamp": timezone.now().isoformat(),
        }
