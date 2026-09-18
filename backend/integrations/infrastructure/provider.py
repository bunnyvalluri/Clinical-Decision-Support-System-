"""
Abstract base class and contract for infrastructure providers (OpenTofu, AWS, Coolify).
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class InfrastructureProvider(ABC):
    """
    Abstract interface defining capabilities expected of any IaC or PaaS provider.
    """

    @abstractmethod
    def plan(self, environment: str, dry_run: bool = True) -> Dict[str, Any]:
        """Generate speculative execution plan."""
        pass

    @abstractmethod
    def apply(self, environment: str, approval_token: Optional[str] = None) -> Dict[str, Any]:
        """Apply verified execution plan."""
        pass

    @abstractmethod
    def detect_drift(self, environment: str) -> Dict[str, Any]:
        """Compare desired code state with running cloud reality."""
        pass

    @abstractmethod
    def get_inventory(self, environment: str) -> Dict[str, Any]:
        """Retrieve authoritative resource inventory."""
        pass
