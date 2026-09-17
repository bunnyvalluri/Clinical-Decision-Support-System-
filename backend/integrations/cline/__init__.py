"""
Controlled Cline Agent Execution Layer for HealthNova AI CDSS.
Provides policy-bounded, default-deny agent execution with human-in-the-loop gates.
"""

from .adapter import ClineAgentAdapter
from .session_service import ClineSessionService
from .tool_registry import ClineToolRegistry
from .policy_adapter import ClinePolicyAdapter
from .audit_adapter import ClineAuditAdapter
from .event_adapter import ClineEventAdapter
from .provider_adapter import ClineProviderAdapter

__all__ = [
    "ClineAgentAdapter",
    "ClineSessionService",
    "ClineToolRegistry",
    "ClinePolicyAdapter",
    "ClineAuditAdapter",
    "ClineEventAdapter",
    "ClineProviderAdapter",
]
