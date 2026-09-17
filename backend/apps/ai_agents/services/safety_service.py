import os
import re
import logging
from typing import Any, Dict, List, Optional, Tuple
from django.conf import settings
from apps.ai_agents.models import (
    AgentExecution,
    AgentSafetyEvent,
    AgentSecurityLevel,
    SafetyEventType,
)

logger = logging.getLogger("ai_agents.services.safety_service")

# Adversarial prompt injection patterns
INJECTION_PATTERNS = [
    r"(?i)ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions",
    r"(?i)system\s*prompt\s*override",
    r"(?i)you\s+are\s+now\s+in\s+developer\s+mode",
    r"(?i)jailbreak",
    r"(?i)bypass\s+safety",
    r"(?i)disregard\s+(?:all\s+)?rules",
    r"(?i)drop\s+table",
    r"(?i)select\s+\*\s+from\s+auth",
    r"(?i)print\s+env",
    r"(?i)cat\s+/etc/passwd",
    r"(?i)rm\s+-rf",
    r"(?i)prescribe\s+(?:morphine|fentanyl|propofol|insulin)",
    r"(?i)administer\s+(?:lethal|overdose)",
]


class SafetyService:
    """
    Healthcare Safety and Security Gatekeeper.
    Scans for prompt injection, enforces kill switches, and logs audit safety events.
    """
    @classmethod
    def is_globally_enabled(cls) -> bool:
        """Global AI kill switch."""
        enabled = os.getenv("AI_AGENT_GLOBAL_ENABLED", "true").lower() in ["true", "1", "yes"]
        return enabled

    @classmethod
    def scan_prompt_for_injection(cls, prompt_text: str) -> Tuple[bool, Optional[str]]:
        """
        Returns (is_safe, violation_reason).
        """
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, prompt_text):
                return False, f"Prompt injection detected matching pattern '{pattern}'."
        return True, None

    @classmethod
    def record_safety_event(
        cls,
        event_type: str,
        severity: str,
        details: Dict[str, Any],
        correlation_id: str,
        execution: Optional[AgentExecution] = None,
        user=None,
    ) -> AgentSafetyEvent:
        logger.warning(f"SAFETY EVENT [{severity}]: {event_type} - {details}")
        return AgentSafetyEvent.objects.create(
            execution=execution,
            event_type=event_type,
            severity=severity,
            details=details,
            correlation_id=correlation_id,
            user=user,
        )

    @classmethod
    def sanitize_untrusted_data(cls, text: str) -> str:
        """
        Encloses retrieved text / external data in XML data boundary tags
        so the LLM interprets it strictly as data, never system instructions.
        """
        # Strip potential markdown instruction escapes
        cleaned = text.replace("```system", "```data").replace("```instruction", "```data")
        return f"<clinical_data_boundary>\n{cleaned}\n</clinical_data_boundary>"
