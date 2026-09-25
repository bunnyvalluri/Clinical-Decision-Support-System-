"""
Browser Agent Gateway for HealthNova AI.
Coordinates controlled browser automation providers (Jev Ultrafast, Sandbox)
under strict authorization, safety policies, audit logging, and human approval gates.
"""
import logging
import os
from typing import Any, Dict, List, Optional, Type

from apps.ai_agents.models import BrowserAgentTask
from apps.ai_agents.services.safety_gateway import BrowserAgentSafetyGateway
from .base_provider import BrowserAgentProvider
from .jev_provider import JevUltrafastProvider
from .sandbox_provider import LayaSandboxProvider

logger = logging.getLogger("browser_agent.gateway")


class BrowserAgentGateway:
    """
    Central gateway for controlled browser agent operations in HealthNova AI.
    Application code interacts through this gateway or its provider interfaces.
    """

    _providers: Dict[str, BrowserAgentProvider] = {}
    _default_provider_id: str = "jev-ultrafast"

    @classmethod
    def register_provider(cls, provider: BrowserAgentProvider):
        cls._providers[provider.provider_id] = provider

    @classmethod
    def get_provider(cls, provider_id: Optional[str] = None) -> BrowserAgentProvider:
        # Lazy initialization
        if not cls._providers:
            cls.register_provider(JevUltrafastProvider())
            cls.register_provider(LayaSandboxProvider())

        target_id = provider_id or os.getenv("DEFAULT_BROWSER_PROVIDER", cls._default_provider_id)
        provider = cls._providers.get(target_id)
        if not provider:
            # Fallback to Jev or first registered
            provider = cls._providers.get("jev-ultrafast") or next(iter(cls._providers.values()))
        return provider

    @classmethod
    def list_providers(cls) -> List[Dict[str, Any]]:
        if not cls._providers:
            cls.register_provider(JevUltrafastProvider())
            cls.register_provider(LayaSandboxProvider())

        results = []
        for pid, provider in cls._providers.items():
            health = provider.health_check()
            results.append({
                "provider_id": pid,
                "version": provider.version,
                "status": health.get("status", "CONFIGURED"),
                "details": health.get("details", ""),
                "cdp_available": health.get("cdp_available", False),
            })
        return results

    @classmethod
    def create_task(cls, task_params: Dict[str, Any], provider_id: Optional[str] = None) -> Dict[str, Any]:
        provider = cls.get_provider(provider_id)
        return provider.create_task(task_params)

    @classmethod
    def start_task(cls, task_id: str, provider_id: Optional[str] = None) -> Dict[str, Any]:
        task = BrowserAgentTask.objects.filter(id=task_id).first()
        target_provider = provider_id or (task.provider if task else None)
        provider = cls.get_provider(target_provider)
        return provider.start_task(task_id)

    @classmethod
    def pause_task(cls, task_id: str, provider_id: Optional[str] = None) -> Dict[str, Any]:
        task = BrowserAgentTask.objects.filter(id=task_id).first()
        target_provider = provider_id or (task.provider if task else None)
        provider = cls.get_provider(target_provider)
        return provider.pause_task(task_id)

    @classmethod
    def resume_task(cls, task_id: str, provider_id: Optional[str] = None) -> Dict[str, Any]:
        task = BrowserAgentTask.objects.filter(id=task_id).first()
        target_provider = provider_id or (task.provider if task else None)
        provider = cls.get_provider(target_provider)
        return provider.resume_task(task_id)

    @classmethod
    def cancel_task(cls, task_id: str, reason: str = "User cancelled", provider_id: Optional[str] = None) -> Dict[str, Any]:
        task = BrowserAgentTask.objects.filter(id=task_id).first()
        target_provider = provider_id or (task.provider if task else None)
        provider = cls.get_provider(target_provider)
        return provider.cancel_task(task_id, reason=reason)

    @classmethod
    def verify_result(cls, task_id: str, provider_id: Optional[str] = None) -> Dict[str, Any]:
        task = BrowserAgentTask.objects.filter(id=task_id).first()
        target_provider = provider_id or (task.provider if task else None)
        provider = cls.get_provider(target_provider)
        return provider.verify_result(task_id)

    @classmethod
    def health_check(cls, provider_id: Optional[str] = None) -> Dict[str, Any]:
        provider = cls.get_provider(provider_id)
        return provider.health_check()
