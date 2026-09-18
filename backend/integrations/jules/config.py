"""
Configuration and settings management for Google Jules integration.
Reads backend-only environment variables with safe defaults.
"""
import os
from dataclasses import dataclass, field
from typing import List
from django.conf import settings


@dataclass(frozen=True)
class JulesSettings:
    api_key: str = field(default_factory=lambda: getattr(settings, "JULES_API_KEY", os.getenv("JULES_API_KEY", "")))
    base_url: str = field(
        default_factory=lambda: getattr(
            settings, "JULES_API_BASE_URL", os.getenv("JULES_API_BASE_URL", "https://jules.googleapis.com/v1alpha")
        ).rstrip("/")
    )
    enabled: bool = field(
        default_factory=lambda: getattr(
            settings, "JULES_ENABLED", os.getenv("JULES_ENABLED", "false").lower() in ("true", "1", "yes")
        )
    )
    timeout_seconds: int = field(
        default_factory=lambda: int(getattr(settings, "JULES_TIMEOUT_SECONDS", os.getenv("JULES_TIMEOUT_SECONDS", "60")))
    )
    connect_timeout_seconds: int = field(
        default_factory=lambda: int(
            getattr(settings, "JULES_CONNECT_TIMEOUT_SECONDS", os.getenv("JULES_CONNECT_TIMEOUT_SECONDS", "10"))
        )
    )
    max_concurrent_sessions: int = field(
        default_factory=lambda: int(
            getattr(settings, "JULES_MAX_CONCURRENT_SESSIONS", os.getenv("JULES_MAX_CONCURRENT_SESSIONS", "3"))
        )
    )
    require_plan_approval: bool = field(
        default_factory=lambda: getattr(
            settings, "JULES_REQUIRE_PLAN_APPROVAL", os.getenv("JULES_REQUIRE_PLAN_APPROVAL", "true").lower() in ("true", "1", "yes")
        )
    )
    auto_create_pr: bool = field(
        default_factory=lambda: getattr(
            settings, "JULES_AUTO_CREATE_PR", os.getenv("JULES_AUTO_CREATE_PR", "false").lower() in ("true", "1", "yes")
        )
    )
    allowed_repositories: List[str] = field(
        default_factory=lambda: [
            r.strip()
            for r in getattr(
                settings,
                "JULES_ALLOWED_REPOSITORIES",
                os.getenv("JULES_ALLOWED_REPOSITORIES", "HealthNova-AI,Clinical-Decision-Support-System-"),
            ).split(",")
            if r.strip()
        ]
    )
    allowed_branches: List[str] = field(
        default_factory=lambda: [
            b.strip()
            for b in getattr(
                settings,
                "JULES_ALLOWED_BRANCHES",
                os.getenv("JULES_ALLOWED_BRANCHES", "develop,feature/*,bugfix/*,jules/*"),
            ).split(",")
            if b.strip()
        ]
    )
    environment: str = field(
        default_factory=lambda: getattr(settings, "JULES_ENVIRONMENT", os.getenv("JULES_ENVIRONMENT", "development"))
    )

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 8)


def get_jules_settings() -> JulesSettings:
    """Returns singleton/immutable settings instance."""
    return JulesSettings()
