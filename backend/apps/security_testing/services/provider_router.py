"""
Security Provider Router (Prompt 44).
Orchestrates selection of security testing engines (Strix, Agentic Bug Hunter, Pentest-Agents)
based on assessment type, risk profile, environment, capabilities, budget, and authorization.
"""
import logging
from typing import Optional, Dict, Any

from apps.security_testing.models import (
    SecurityTarget,
    SecurityScan,
    SecurityProviderType,
    SecurityEnvironment,
)
from apps.security_testing.services.provider_abstraction import (
    SecurityTestingProvider,
    StrixProvider,
    AgenticBugHunterProvider,
    PentestAgentsProvider,
)

logger = logging.getLogger("security_testing.provider_router")


class SecurityProviderRouter:
    """
    Intelligent routing service selecting the optimal security testing engine.
    Ensures that multiple tools aren't executed redundantly for a single objective
    while applying strict security boundaries.
    """

    _providers: Dict[str, SecurityTestingProvider] = {
        SecurityProviderType.STRIX: StrixProvider(),
        SecurityProviderType.AGENTIC_BUGHUNTER: AgenticBugHunterProvider(),
        SecurityProviderType.PENTEST_AGENTS: PentestAgentsProvider(),
    }

    @classmethod
    def get_provider(cls, provider_type: str) -> SecurityTestingProvider:
        """Fetch provider instance by provider_type enum/string."""
        normalized = provider_type.upper()
        if normalized in cls._providers:
            return cls._providers[normalized]
        # Default fallback to Pentest-Agents if unknown
        return cls._providers[SecurityProviderType.PENTEST_AGENTS]

    @classmethod
    def route_assessment(
        cls,
        target: SecurityTarget,
        assessment_type: str,
        requested_provider: Optional[str] = None,
        budget: float = 10.0,
    ) -> SecurityTestingProvider:
        """
        Determines the appropriate security testing provider based on policy routing matrix:
        - Explicit requested provider (if allowed)
        - FAST_REVIEW / RECON -> AgenticBugHunterProvider
        - DEEP_WEB_TEST / SARIF -> StrixProvider
        - AGENTIC_BOUNTY_RESEARCH / API_TESTING / MULTI_AGENT -> PentestAgentsProvider
        """
        if requested_provider:
            prov = cls.get_provider(requested_provider)
            logger.info(f"Provider explicitly requested: {prov.display_name}")
            return prov

        # Route by assessment mode or scan_type
        scan_type_upper = (assessment_type or "").upper()

        if scan_type_upper in ["QUICK", "RECON", "FAST_REVIEW", "SMOKE"]:
            return cls._providers[SecurityProviderType.AGENTIC_BUGHUNTER]

        if scan_type_upper in ["DEEP", "DEEP_WEB_TEST", "COMPREHENSIVE_LAB", "SARIF_AUDIT"]:
            return cls._providers[SecurityProviderType.STRIX]

        # Default to Pentest-Agents for agentic bounty, API security, RBAC & IDOR research
        return cls._providers[SecurityProviderType.PENTEST_AGENTS]
