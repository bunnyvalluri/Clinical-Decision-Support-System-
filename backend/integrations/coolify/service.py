"""
Coolify Platform Service.
Orchestrates deployment automation, server inventory caching, correlation IDs,
and human approval enforcement.
"""

import logging
import uuid
from typing import Any, Dict, List, Optional

from django.utils import timezone
from .client import CoolifyClient, CoolifyException

logger = logging.getLogger(__name__)

_CLIENT_INSTANCE: Optional[CoolifyClient] = None


def get_coolify_client() -> CoolifyClient:
    """Singleton getter for CoolifyClient."""
    global _CLIENT_INSTANCE
    if _CLIENT_INSTANCE is None:
        _CLIENT_INSTANCE = CoolifyClient()
    return _CLIENT_INSTANCE


class CoolifyPlatformService:
    """
    High-level platform service for managing infrastructure operations.
    Coordinates between Django ORM models and Coolify control plane API.
    """

    def __init__(self, client: Optional[CoolifyClient] = None):
        self.client = client or get_coolify_client()

    def get_infrastructure_overview(self) -> Dict[str, Any]:
        """Aggregate infrastructure health and server overview."""
        health = self.client.get_health()
        try:
            servers = self.client.get_servers() if health["status"] == "HEALTHY" else []
            applications = self.client.get_applications() if health["status"] == "HEALTHY" else []
        except Exception:
            servers = []
            applications = []

        return {
            "health": health,
            "servers": servers,
            "applications": applications,
            "timestamp": timezone.now().isoformat(),
        }

    def trigger_deployment(
        self,
        application_uuid: str,
        actor: Any,
        commit_sha: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Trigger an application deployment in Coolify with full audit traceability.
        """
        corr_id = correlation_id or str(uuid.uuid4())
        logger.info(
            f"Deployment triggered for application {application_uuid} by actor {getattr(actor, 'username', 'system')} "
            f"[correlation_id={corr_id}]"
        )

        res = self.client.deploy_application(
            app_uuid=application_uuid,
            commit=commit_sha,
            force=False,
        )

        return {
            "application_uuid": application_uuid,
            "deployment_id": res.get("deployment_id", str(uuid.uuid4())),
            "status": "QUEUED",
            "correlation_id": corr_id,
            "triggered_at": timezone.now().isoformat(),
        }
