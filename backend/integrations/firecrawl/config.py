"""
Configuration management for Firecrawl Web Intelligence integration.
"""
from dataclasses import dataclass, field
from typing import List, Optional
from django.conf import settings


@dataclass(frozen=True)
class FirecrawlConfig:
    enabled: bool = False
    mode: str = "self_hosted"  # 'managed' | 'self_hosted'
    base_url: str = "http://localhost:3002"
    api_key: str = ""
    connect_timeout: int = 5
    request_timeout: int = 30
    max_concurrency: int = 5
    max_crawl_pages: int = 50
    max_batch_urls: int = 20
    max_content_bytes: int = 5 * 1024 * 1024  # 5 MB
    allowed_domains: List[str] = field(default_factory=list)
    blocked_domains: List[str] = field(default_factory=list)
    allow_public_web_search: bool = True
    allow_crawl: bool = True
    allow_interact: bool = False  # Default disabled for clinical safety
    allow_agent: bool = False  # Default disabled unless explicitly permitted
    robots_policy: str = "respect"  # 'respect' | 'strict'
    circuit_fail_max: int = 5
    circuit_reset_sec: int = 60

    @classmethod
    def load_from_settings(cls) -> "FirecrawlConfig":
        """Loads configuration from Django settings with safe defaults."""
        allowed = getattr(settings, "FIRECRAWL_ALLOWED_DOMAINS", [])
        if isinstance(allowed, str):
            allowed = [d.strip().lower() for d in allowed.split(",") if d.strip()]

        blocked = getattr(settings, "FIRECRAWL_BLOCKED_DOMAINS", [])
        if isinstance(blocked, str):
            blocked = [d.strip().lower() for d in blocked.split(",") if d.strip()]

        return cls(
            enabled=bool(getattr(settings, "FIRECRAWL_ENABLED", False)),
            mode=str(getattr(settings, "FIRECRAWL_MODE", "self_hosted")),
            base_url=str(getattr(settings, "FIRECRAWL_BASE_URL", "http://localhost:3002")).rstrip("/"),
            api_key=str(getattr(settings, "FIRECRAWL_API_KEY", "")),
            connect_timeout=int(getattr(settings, "FIRECRAWL_CONNECT_TIMEOUT", 5)),
            request_timeout=int(getattr(settings, "FIRECRAWL_REQUEST_TIMEOUT", 30)),
            max_concurrency=int(getattr(settings, "FIRECRAWL_MAX_CONCURRENCY", 5)),
            max_crawl_pages=int(getattr(settings, "FIRECRAWL_MAX_CRAWL_PAGES", 50)),
            max_batch_urls=int(getattr(settings, "FIRECRAWL_MAX_BATCH_URLS", 20)),
            max_content_bytes=int(getattr(settings, "FIRECRAWL_MAX_CONTENT_BYTES", 5 * 1024 * 1024)),
            allowed_domains=allowed,
            blocked_domains=blocked,
            allow_public_web_search=bool(getattr(settings, "FIRECRAWL_ALLOW_PUBLIC_WEB_SEARCH", True)),
            allow_crawl=bool(getattr(settings, "FIRECRAWL_ALLOW_CRAWL", True)),
            allow_interact=bool(getattr(settings, "FIRECRAWL_ALLOW_INTERACT", False)),
            allow_agent=bool(getattr(settings, "FIRECRAWL_ALLOW_AGENT", False)),
            robots_policy=str(getattr(settings, "FIRECRAWL_ROBOTS_POLICY", "respect")),
            circuit_fail_max=int(getattr(settings, "FIRECRAWL_CIRCUIT_FAIL_MAX", 5)),
            circuit_reset_sec=int(getattr(settings, "FIRECRAWL_CIRCUIT_RESET_SEC", 60)),
        )
