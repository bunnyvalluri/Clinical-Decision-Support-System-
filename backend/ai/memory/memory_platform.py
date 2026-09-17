"""
Namespace-Segregated AI Memory Platform.
Strictly prohibits storage of patient PHI; enforces deterministic TTLs.
"""
from datetime import timedelta
import logging
from typing import Any, Dict, List, Optional
from django.utils import timezone

from ai.safety.phi_redactor import PHIRedactor

logger = logging.getLogger("ai.memory.platform")


class AIMemoryPlatform:
    """
    Manages long-term and short-term memory partitions with strict governance.
    """

    ALLOWED_NAMESPACES = {
        "user_preferences": timedelta(days=365),
        "clinician_workflow": timedelta(days=90),
        "agent_coordination": timedelta(hours=1),
        "project_knowledge": None,  # Persistent
        "ai_evaluations": timedelta(days=30),
    }

    @classmethod
    def set_memory(
        cls,
        owner_id: str,
        namespace: str,
        key: str,
        value: Dict[str, Any],
        classification: str = "LOW_SENSITIVITY",
        source: str = "",
    ) -> bool:
        """
        Persists a memory key-value pair under strict PHI inspection.
        """
        if namespace not in cls.ALLOWED_NAMESPACES:
            logger.warning("Rejected memory write: Namespace '%s' is not allowed.", namespace)
            return False

        # Verify zero PHI
        serialized_val = str(value)
        _, phi_count = PHIRedactor.redact(serialized_val)
        if phi_count > 0:
            logger.error("Security violation: Attempted to write %d PHI tokens to AI memory.", phi_count)
            return False

        from apps.ai_orchestrator.models import AIMemory

        ttl = cls.ALLOWED_NAMESPACES.get(namespace)
        expires_at = timezone.now() + ttl if ttl else None

        AIMemory.objects.update_or_create(
            owner_id=owner_id,
            namespace=namespace,
            key=key,
            defaults={
                "content": value,
                "classification": classification,
                "source": source,
                "expires_at": expires_at,
                "status": "ACTIVE",
            },
        )
        return True

    @classmethod
    def get_memory(cls, owner_id: str, namespace: str, key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a valid, non-expired memory entry.
        """
        from apps.ai_orchestrator.models import AIMemory

        entry = AIMemory.objects.filter(
            owner_id=owner_id,
            namespace=namespace,
            key=key,
            status="ACTIVE",
        ).first()

        if not entry:
            return None

        # Check TTL
        if entry.expires_at and entry.expires_at < timezone.now():
            entry.status = "EXPIRED"
            entry.save(update_fields=["status"])
            return None

        return entry.content

    @classmethod
    def list_memory_for_namespace(cls, owner_id: str, namespace: str) -> List[Dict[str, Any]]:
        from apps.ai_orchestrator.models import AIMemory

        now = timezone.now()
        entries = AIMemory.objects.filter(
            owner_id=owner_id,
            namespace=namespace,
            status="ACTIVE",
        )
        valid = []
        for e in entries:
            if e.expires_at and e.expires_at < now:
                continue
            valid.append({"key": e.key, "value": e.content, "created_at": e.created_at.isoformat()})
        return valid

    @classmethod
    def purge_expired(cls) -> int:
        from apps.ai_orchestrator.models import AIMemory

        now = timezone.now()
        count, _ = AIMemory.objects.filter(expires_at__lt=now).delete()
        logger.info("Purged %d expired AI memory records.", count)
        return count
