"""
Controlled Sandbox Provider for Browser Automation.
Used for offline testing, CI/CD, and environments without active CDP daemon.
"""
from typing import Any, Dict, List, Optional
from .base_provider import BrowserAgentProvider
from .jev_provider import JevUltrafastProvider


class LayaSandboxProvider(JevUltrafastProvider):
    """
    Subclass of JevUltrafastProvider running in forced sandbox mode.
    """

    @property
    def provider_id(self) -> str:
        return "laya-sandbox"

    @property
    def version(self) -> str:
        return "1.0.0"

    def health_check(self) -> Dict[str, Any]:
        info = super().health_check()
        info["provider_id"] = self.provider_id
        info["version"] = self.version
        info["status"] = "READY"
        info["details"] = "Controlled HealthNova Browser Sandbox active."
        return info
