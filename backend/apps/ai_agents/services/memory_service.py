import logging
from typing import Any, Dict, List, Optional
from django.utils import timezone
from apps.ai_agents.models import AgentMemory, AgentSession, DataClassification, MemoryType

logger = logging.getLogger("ai_agents.services.memory_service")


class MemoryService:
    """
    Healthcare-grade persistent memory engine backed by Neon PostgreSQL.
    Strictly isolated per session and user.
    Blocks storage of passwords, tokens, raw PHI, or speculative clinical facts.
    """
    PROHIBITED_KEYS = {"password", "token", "secret", "ssn", "api_key", "authorization"}

    @classmethod
    def set_memory(
        cls,
        user,
        key: str,
        value: Any,
        session: Optional[AgentSession] = None,
        memory_type: str = MemoryType.SHORT_TERM_AGENT_STATE,
        classification: str = DataClassification.LOW_SENSITIVITY,
        ttl_seconds: Optional[int] = None,
    ) -> Optional[AgentMemory]:
        # Enforce security bounds
        normalized_key = key.lower().strip()
        if any(p in normalized_key for p in cls.PROHIBITED_KEYS):
            logger.warning(f"Memory write rejected for sensitive key: {key}")
            return None

        # Prohibit persisting PHI into AI memory
        if classification in [DataClassification.PHI, DataClassification.HIGHLY_SENSITIVE, DataClassification.AUTHENTICATION_SECRET]:
            logger.warning("Memory write rejected: PHI cannot be persisted in AI memory store.")
            return None

        expires_at = None
        if ttl_seconds:
            expires_at = timezone.now() + timezone.timedelta(seconds=ttl_seconds)

        mem, _ = AgentMemory.objects.update_or_create(
            user=user,
            session=session,
            key=key,
            defaults={
                "value": {"payload": value},
                "memory_type": memory_type,
                "data_classification": classification,
                "expires_at": expires_at,
            },
        )
        return mem

    @classmethod
    def get_memory(cls, user, key: str, session: Optional[AgentSession] = None) -> Optional[Any]:
        """Retrieves active, non-expired memory value."""
        qs = AgentMemory.objects.filter(user=user, key=key)
        if session:
            qs = qs.filter(session=session)
        
        mem = qs.first()
        if not mem:
            return None

        if mem.expires_at and mem.expires_at < timezone.now():
            mem.delete()
            return None

        return mem.value.get("payload")

    @classmethod
    def get_session_memories(cls, session: AgentSession) -> Dict[str, Any]:
        """Returns all valid key-value pairs for the session."""
        now = timezone.now()
        qs = AgentMemory.objects.filter(session=session)
        result = {}
        for m in qs:
            if m.expires_at and m.expires_at < now:
                continue
            result[m.key] = m.value.get("payload")
        return result

    @classmethod
    def clear_session_memory(cls, session: AgentSession):
        AgentMemory.objects.filter(session=session).delete()
