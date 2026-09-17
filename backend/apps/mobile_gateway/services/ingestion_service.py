"""
Event Ingestion Service.

Orchestrates:
1. Rate limiting per device (Redis sliding window / token bucket).
2. Idempotency checks.
3. Privacy sanitization & classification.
4. Tamper-evident raw hashing (no unredacted PHI or secrets stored).
5. Forwarding policy evaluation.
6. Celery asynchronous forwarding dispatch.
7. Real-time Django Channels WebSocket notification.
"""
import hashlib
import time
from typing import Any, Dict, Optional, Tuple
from django.core.cache import cache
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.mobile_gateway.models import (
    DataClassification,
    ForwardingAction,
    MobileDevice,
    MobileEvent,
    ProcessingStatus,
    RiskLevel,
)
from .privacy_service import PrivacyClassificationService
from .policy_engine import ForwardingPolicyEngine


class EventIngestionService:
    RATE_LIMIT_PER_MINUTE = 60
    RATE_LIMIT_PREFIX = "mobile_rate:"

    @classmethod
    def check_rate_limit(cls, device: MobileDevice) -> bool:
        """
        Token-bucket rate limiter via Redis cache.
        Returns True if request allowed, False if exceeded.
        """
        current_minute = int(time.time() // 60)
        cache_key = f"{cls.RATE_LIMIT_PREFIX}{device.device_identifier}:{current_minute}"
        try:
            count = cache.get(cache_key, 0)
            if count >= cls.RATE_LIMIT_PER_MINUTE:
                return False
            cache.set(cache_key, count + 1, timeout=70)
            return True
        except Exception:
            return True

    @classmethod
    def ingest_event(
        cls,
        device: MobileDevice,
        event_type: str,
        source: str,
        timestamp,
        content: str,
        idempotency_key: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Tuple[MobileEvent, ForwardingAction, str]:
        """
        Ingests and sanitizes an incoming mobile event.
        Returns (event_instance, policy_action, audit_message).
        """
        # 1. Idempotency Check
        existing = MobileEvent.objects.filter(idempotency_key=idempotency_key).first()
        if existing:
            return existing, ForwardingAction.BLOCK, "Idempotent replay: Event already processed."

        # 2. Rate Limiting Check
        if not cls.check_rate_limit(device):
            raw_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
            event = MobileEvent.objects.create(
                device=device,
                event_type=event_type,
                source=source,
                timestamp=timestamp or timezone.now(),
                content="[RATE_LIMIT_EXCEEDED]",
                raw_hash=raw_hash,
                metadata=metadata or {},
                classification=DataClassification.LOW_SENSITIVITY,
                risk_level=RiskLevel.MEDIUM,
                processing_status=ProcessingStatus.BLOCKED,
                idempotency_key=idempotency_key,
            )
            cls._broadcast_realtime(event, "EVENT_BLOCKED", "Rate limit exceeded for device.")
            return event, ForwardingAction.BLOCK, "Rate limit exceeded."

        # 3. Privacy Classification & In-Place Sanitization
        raw_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        classification, risk_level, sanitized_text, requires_block = (
            PrivacyClassificationService.classify_and_sanitize(content)
        )

        initial_status = ProcessingStatus.RECEIVED
        if requires_block:
            initial_status = ProcessingStatus.BLOCKED
        elif sanitized_text != content:
            initial_status = ProcessingStatus.REDACTED

        # 4. Save Sanitized Event (NEVER saves raw content with PHI/secrets)
        event = MobileEvent.objects.create(
            device=device,
            event_type=event_type,
            source=source,
            timestamp=timestamp or timezone.now(),
            content=sanitized_text,
            raw_hash=raw_hash,
            metadata=metadata or {},
            classification=classification,
            risk_level=risk_level,
            processing_status=initial_status,
            idempotency_key=idempotency_key,
        )

        # Update device last_seen and online status
        device.last_seen = timezone.now()
        device.is_online = True
        device.save(update_fields=["last_seen", "is_online", "updated_at"])

        # 5. Evaluate Forwarding Policy
        if requires_block:
            action = ForwardingAction.BLOCK
            reason = f"Strict Privacy Violation: {classification} detected and blocked."
            event.processing_status = ProcessingStatus.BLOCKED
            event.save(update_fields=["processing_status", "updated_at"])
            cls._broadcast_realtime(event, "EVENT_BLOCKED", reason)
            return event, action, reason

        action, approved_destinations, reason = ForwardingPolicyEngine.evaluate_event_policy(event, device)

        if action in [ForwardingAction.ALLOW, ForwardingAction.REDACT]:
            event.processing_status = ProcessingStatus.APPROVED
            event.save(update_fields=["processing_status", "updated_at"])
            cls._broadcast_realtime(event, "EVENT_APPROVED", reason)

            # Trigger async forwarding via Celery
            from apps.mobile_gateway.tasks import dispatch_event_forwarding
            for dest in approved_destinations:
                dispatch_event_forwarding.delay(str(event.id), str(dest.id))

        elif action == ForwardingAction.REVIEW_REQUIRED:
            event.processing_status = ProcessingStatus.QUEUED
            event.save(update_fields=["processing_status", "updated_at"])
            cls._broadcast_realtime(event, "REVIEW_REQUIRED", reason)
        else:
            event.processing_status = ProcessingStatus.BLOCKED
            event.save(update_fields=["processing_status", "updated_at"])
            cls._broadcast_realtime(event, "EVENT_BLOCKED", reason)

        return event, action, reason

    @classmethod
    def _broadcast_realtime(cls, event: MobileEvent, event_name: str, message: str):
        """Dispatches real-time updates over Django Channels to authorized listeners."""
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return

            payload = {
                "type": "mobile_event_update",
                "event": {
                    "event_id": str(event.id),
                    "device_id": str(event.device_id),
                    "event_type": event.event_type,
                    "classification": event.classification,
                    "status": event.processing_status,
                    "update_type": event_name,
                    "message": message,
                    "timestamp": event.timestamp.isoformat(),
                },
            }

            # Broadcast to admin stream
            async_to_sync(channel_layer.group_send)("mobile_admin_stream", payload)

            # Broadcast to specific device owner if associated with a user
            if event.device.user_id:
                async_to_sync(channel_layer.group_send)(
                    f"mobile_user_{event.device.user_id}",
                    payload,
                )
        except Exception:
            # Non-blocking for real-time telemetry
            pass
