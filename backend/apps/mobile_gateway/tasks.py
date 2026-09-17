"""
Celery background tasks for Healthcare Mobile Gateway.

Handles asynchronous event forwarding, retries with exponential backoff,
dead-letter queue processing, and retention cleanup.
"""
import logging
from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from apps.mobile_gateway.models import (
    DeadLetterEvent,
    ForwardingDestination,
    MobileDevice,
    MobileEvent,
    ProcessingStatus,
)
from apps.mobile_gateway.services.delivery_service import ForwardingDeliveryService

logger = logging.getLogger("mobile_gateway")


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def dispatch_event_forwarding(self, event_id: str, destination_id: str, attempt: int = 1):
    """
    Asynchronously delivers an approved mobile event to a destination.
    Uses exponential backoff for transient failures.
    """
    try:
        event = MobileEvent.objects.get(id=event_id)
        destination = ForwardingDestination.objects.get(id=destination_id)
    except (MobileEvent.DoesNotExist, ForwardingDestination.DoesNotExist) as e:
        logger.error(f"Event or Destination missing for forwarding: {e}")
        return

    success, message = ForwardingDeliveryService.deliver_event(event, destination, attempt=attempt)

    if not success and attempt < ForwardingDeliveryService.MAX_RETRIES:
        next_attempt = attempt + 1
        delay = 10 * (2 ** (attempt - 1))  # 10s, 20s, 40s
        logger.warning(f"Forwarding attempt {attempt} failed for event {event_id}. Retrying in {delay}s...")
        dispatch_event_forwarding.apply_async(
            args=[event_id, destination_id, next_attempt],
            countdown=delay,
        )


@shared_task
def retry_dead_letter_events():
    """
    Periodic task to process DeadLetterEvents that have been manually marked as REQUEUED.
    """
    requeued_events = DeadLetterEvent.objects.filter(status="REQUEUED")[:50]
    for dl in requeued_events:
        dispatch_event_forwarding.delay(str(dl.mobile_event_id), str(dl.destination_id), attempt=1)
        dl.status = "PENDING_REVIEW"
        dl.save(update_fields=["status"])


@shared_task
def prune_expired_mobile_events():
    """
    Data retention task: Prunes operational mobile events older than 30 days.
    Immutable delivery receipts and audit trails are preserved.
    """
    cutoff = timezone.now() - timedelta(days=30)
    pruned_count, _ = MobileEvent.objects.filter(
        created_at__lt=cutoff,
        processing_status__in=[
            ProcessingStatus.DELIVERED,
            ProcessingStatus.BLOCKED,
            ProcessingStatus.CANCELLED,
        ],
    ).delete()
    logger.info(f"Pruned {pruned_count} expired mobile events past retention threshold.")


@shared_task
def device_heartbeat_health_check():
    """
    Checks device heartbeats. Marks devices inactive if no telemetry received for > 15 minutes.
    """
    threshold = timezone.now() - timedelta(minutes=15)
    updated = MobileDevice.objects.filter(
        is_online=True,
        last_seen__lt=threshold,
    ).update(is_online=False)
    if updated:
        logger.info(f"Marked {updated} mobile devices as offline due to heartbeat timeout.")
