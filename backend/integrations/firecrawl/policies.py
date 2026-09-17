"""
Domain policies, trust tiers, and role-based access governance for Web Intelligence.
"""
from typing import Dict, List, Optional, Set
from urllib.parse import urlparse

from .exceptions import DomainBlockedError, PolicyDeniedError
from .schemas import SourceTrustTier, ResearchMode


# High-trust medical authority domains (TIER_1)
TIER_1_DOMAINS = {
    "who.int",
    "cdc.gov",
    "nih.gov",
    "ncbi.nlm.nih.gov",
    "pubmed.ncbi.nlm.nih.gov",
    "fda.gov",
    "nice.org.uk",
    "escardio.org",
    "acc.org",
    "diabetes.org",
}

# Academic and medical journal institutions (TIER_2)
TIER_2_DOMAINS = {
    "mayoclinic.org",
    "hopkinsmedicine.org",
    "nejm.org",
    "thelancet.com",
    "bmj.com",
    "jamanetwork.com",
    "nature.com",
    "sciencedirect.com",
}


class DomainPolicyEngine:
    """
    Evaluates domain policies, trust tiers, and blocklists.
    """

    @staticmethod
    def extract_domain(url: str) -> str:
        """Extracts lowercase domain name without www."""
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if ":" in domain:
            domain = domain.split(":")[0]
        if domain.startswith("www."):
            domain = domain[4:]
        return domain

    @staticmethod
    def classify_domain_tier(domain: str) -> SourceTrustTier:
        """Assigns trust tier based on domain authority."""
        domain_lower = domain.lower()
        for t1 in TIER_1_DOMAINS:
            if domain_lower == t1 or domain_lower.endswith("." + t1):
                return SourceTrustTier.TIER_1

        for t2 in TIER_2_DOMAINS:
            if domain_lower == t2 or domain_lower.endswith("." + t2):
                return SourceTrustTier.TIER_2

        # Academic / Government TLDs
        if domain_lower.endswith(".gov") or domain_lower.endswith(".edu") or domain_lower.endswith(".ac.uk"):
            return SourceTrustTier.TIER_2

        return SourceTrustTier.TIER_4

    @staticmethod
    def check_domain_allowed(
        domain: str,
        allowlist: Optional[List[str]] = None,
        blocklist: Optional[List[str]] = None,
    ) -> bool:
        """
        Verifies if domain is allowed. Raises DomainBlockedError if blocked.
        """
        domain_lower = domain.lower()

        # Check blocklist first
        if blocklist:
            for b in blocklist:
                b_clean = b.lower().strip()
                if b_clean and (domain_lower == b_clean or domain_lower.endswith("." + b_clean)):
                    raise DomainBlockedError(domain)

        # If explicit allowlist configured, must match
        if allowlist and len(allowlist) > 0:
            allowed = False
            for a in allowlist:
                a_clean = a.lower().strip()
                if a_clean and (domain_lower == a_clean or domain_lower.endswith("." + a_clean)):
                    allowed = True
                    break
            if not allowed:
                raise DomainBlockedError(domain)

        return True


class RoleAccessPolicy:
    """
    Role-based capability governance for web intelligence actions.
    """

    ROLE_PERMISSIONS: Dict[str, Set[str]] = {
        "PATIENT": {"search_educational"},
        "USER": {"search_educational"},
        "NURSE": {"search", "scrape", "view_sources"},
        "DOCTOR": {"search", "scrape", "map", "research", "view_sources", "cite"},
        "MEDICAL_INFORMATICIST": {
            "search", "scrape", "map", "crawl", "batch", "extract", "research",
            "view_sources", "cite", "index_rag"
        },
        "IT_ADMIN": {
            "search", "scrape", "map", "crawl", "batch", "extract", "research",
            "view_sources", "cite", "admin_health", "configure_policies", "cancel_jobs"
        },
        "ADMIN": {
            "search", "scrape", "map", "crawl", "batch", "extract", "research",
            "view_sources", "cite", "admin_health", "configure_policies", "cancel_jobs"
        },
    }

    # Per-role rate limits: requests per minute
    ROLE_RATE_LIMITS: Dict[str, int] = {
        "PATIENT": 5,
        "USER": 5,
        "NURSE": 20,
        "DOCTOR": 60,
        "MEDICAL_INFORMATICIST": 120,
        "IT_ADMIN": 300,
        "ADMIN": 300,
    }

    @classmethod
    def assert_permission(cls, role: str, action: str) -> None:
        """Raises PolicyDeniedError if role does not possess the action capability."""
        normalized = role.upper().strip()
        allowed_actions = cls.ROLE_PERMISSIONS.get(normalized, set())
        if action not in allowed_actions:
            raise PolicyDeniedError(f"Role '{normalized}' is not authorized to perform '{action}'.")

    @classmethod
    def get_rate_limit(cls, role: str) -> int:
        """Returns max allowed requests per minute for role."""
        return cls.ROLE_RATE_LIMITS.get(role.upper().strip(), 5)
