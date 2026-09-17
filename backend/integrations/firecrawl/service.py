"""
Web Intelligence Service - Central domain service orchestrating web retrieval, security gates, and provenance.
"""
import logging
import time
from typing import Any, Dict, List, Optional

from .config import FirecrawlConfig
from .exceptions import PolicyDeniedError, SSRFBlockedError
from .policies import DomainPolicyEngine, RoleAccessPolicy
from .providers.base import WebRetrievalProvider
from .providers.firecrawl_provider import FirecrawlProvider
from .schemas import (
    MapResponse,
    NormalizedDocument,
    SearchResponse,
    SourceTrustTier,
)
from .security import (
    ContentSanitizer,
    DataClassificationGuard,
    PromptInjectionDefense,
    SSRFValidator,
)
from .telemetry import FirecrawlTelemetry

logger = logging.getLogger("apps.firecrawl")


class WebIntelligenceService:
    """
    Central orchestration service for all web intelligence operations.
    """

    def __init__(
        self,
        config: Optional[FirecrawlConfig] = None,
        provider: Optional[WebRetrievalProvider] = None,
    ):
        self.config = config or FirecrawlConfig.load_from_settings()
        self.provider = provider or FirecrawlProvider()
        self.telemetry = FirecrawlTelemetry()

    def check_enabled(self) -> None:
        if not self.config.enabled:
            raise PolicyDeniedError("Firecrawl Web Intelligence is currently disabled in system configuration.")

    def search(
        self,
        query: str,
        role: str = "DOCTOR",
        limit: int = 10,
        options: Optional[Dict[str, Any]] = None,
    ) -> SearchResponse:
        """
        Executes policy-governed medical literature and evidence search.
        """
        self.check_enabled()
        action = "search_educational" if role.upper() in ("PATIENT", "USER") else "search"
        RoleAccessPolicy.assert_permission(role, action)
        DataClassificationGuard.assert_no_phi(query)

        # Enforce search page boundaries
        clamped_limit = max(1, min(limit, 20))

        start_time = time.time()
        try:
            response = self.provider.search(query, limit=clamped_limit, options=options)
            duration = (time.time() - start_time) * 1000
            self.telemetry.record_request(duration, success=True)

            # Filter results by role policy (Patients only see TIER_1 sources)
            if role.upper() in ("PATIENT", "USER"):
                response.results = [r for r in response.results if r.trust_tier == SourceTrustTier.TIER_1]
                response.total_count = len(response.results)

            return response
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            self.telemetry.record_request(duration, success=False, error=str(e))
            logger.error(f"Web search failed: {e}")
            raise

    def scrape_url(
        self,
        url: str,
        role: str = "DOCTOR",
        options: Optional[Dict[str, Any]] = None,
    ) -> NormalizedDocument:
        """
        Validates target URL against SSRF and domain policy, scrapes page, and normalizes content.
        """
        self.check_enabled()
        RoleAccessPolicy.assert_permission(role, "scrape")

        # 1. SSRF check
        try:
            valid_url = SSRFValidator.validate_url(url)
        except SSRFBlockedError:
            self.telemetry.record_ssrf_block()
            raise

        # 2. Domain policy check
        domain = DomainPolicyEngine.extract_domain(valid_url)
        try:
            DomainPolicyEngine.check_domain_allowed(
                domain,
                allowlist=self.config.allowed_domains,
                blocklist=self.config.blocked_domains,
            )
        except Exception:
            self.telemetry.record_domain_block()
            raise

        # 3. Execute scrape
        start_time = time.time()
        try:
            doc = self.provider.scrape(valid_url, options=options)
            duration = (time.time() - start_time) * 1000
            self.telemetry.record_request(duration, success=True)
            self.telemetry.record_page_scraped()
            return doc
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            self.telemetry.record_request(duration, success=False, error=str(e))
            logger.error(f"Scrape failed for {url}: {e}")
            raise

    def map_website(
        self,
        url: str,
        role: str = "DOCTOR",
        search: Optional[str] = None,
        limit: int = 100,
    ) -> MapResponse:
        """
        Discovers link topology for site.
        """
        self.check_enabled()
        RoleAccessPolicy.assert_permission(role, "map")

        try:
            valid_url = SSRFValidator.validate_url(url)
        except SSRFBlockedError:
            self.telemetry.record_ssrf_block()
            raise

        domain = DomainPolicyEngine.extract_domain(valid_url)
        DomainPolicyEngine.check_domain_allowed(
            domain,
            allowlist=self.config.allowed_domains,
            blocklist=self.config.blocked_domains,
        )

        clamped_limit = max(1, min(limit, 200))
        start_time = time.time()
        try:
            res = self.provider.map_url(valid_url, search=search, limit=clamped_limit)
            duration = (time.time() - start_time) * 1000
            self.telemetry.record_request(duration, success=True)
            return res
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            self.telemetry.record_request(duration, success=False, error=str(e))
            logger.error(f"Map failed for {url}: {e}")
            raise

    def extract_data(
        self,
        urls: List[str],
        schema: Dict[str, Any],
        role: str = "DOCTOR",
        prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes structured JSON extraction with schema validation.
        """
        self.check_enabled()
        RoleAccessPolicy.assert_permission(role, "extract")

        # Validate all target URLs
        for u in urls:
            SSRFValidator.validate_url(u)

        start_time = time.time()
        try:
            res = self.provider.extract(urls, schema=schema, prompt=prompt)
            duration = (time.time() - start_time) * 1000
            self.telemetry.record_request(duration, success=True)
            return res
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            self.telemetry.record_request(duration, success=False, error=str(e))
            logger.error(f"Extract failed: {e}")
            raise
