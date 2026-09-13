"""
Notification & Email dispatch Celery tasks.
Handles in-app alerts, real-time WebSocket messaging, and email dispatch with retries.
"""
import hashlib
import logging
from typing import Any

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.conf import settings
from django.core.mail import send_mail

from apps.notifications.models import Notification, NotificationChannel, NotificationSeverity
from channels_app.events import NotificationEvent
from config.celery import BaseCDSSAsyncJob

logger = logging.getLogger("celery.tasks.notifications")


@shared_task(
    bind=True,
    base=BaseCDSSAsyncJob,
    name="apps.notifications.tasks.send_notification_task",
    max_retries=3,
    default_retry_delay=5,
    time_limit=45,
    soft_time_limit=30,
)
def send_notification_task(self, notification_id: str) -> dict[str, Any]:
    """
    Dispatch an in-app and WebSocket notification to clinical staff.
    If channel includes EMAIL or severity is CRITICAL, triggers email delivery.
    """
    logger.info("send_notification_task triggered: notification_id=%s", notification_id)
    try:
        notif = Notification.objects.select_related("recipient", "patient").get(id=notification_id)

        # 1. Dispatch over WebSocket to recipient's private group
        channel_layer = get_channel_layer()
        if channel_layer:
            event = NotificationEvent(
                notification_id=str(notif.id),
                title=notif.title,
                severity=notif.severity,
                message=notif.message,
                action_url=notif.action_url or "",
            ).to_dict()

            async_to_sync(channel_layer.group_send)(
                f"notifications_{notif.recipient_id}",
                {"type": "notification", "payload": event},
            )

        # 2. Dispatch email if channel is EMAIL or severity is CRITICAL
        email_dispatched = False
        if notif.channel == NotificationChannel.EMAIL or notif.severity in [
            NotificationSeverity.HIGH,
            NotificationSeverity.CRITICAL,
        ]:
            if notif.recipient and notif.recipient.email:
                send_email_notification_task.delay(
                    recipient_email=notif.recipient.email,
                    subject=f"[{notif.severity}] {notif.title}",
                    message=notif.message,
                )
                email_dispatched = True

        return {
            "status": "SENT",
            "notification_id": str(notif.id),
            "recipient_id": str(notif.recipient_id),
            "email_dispatched": email_dispatched,
        }

    except Notification.DoesNotExist:
        logger.warning("Notification %s does not exist, skipping dispatch.", notification_id)
        return {"status": "NOT_FOUND", "notification_id": notification_id}

    except Exception as exc:
        logger.error("Failed to dispatch notification %s: %s", notification_id, exc, exc_info=True)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    base=BaseCDSSAsyncJob,
    name="apps.notifications.tasks.send_email_notification_task",
    max_retries=3,
    default_retry_delay=10,
    time_limit=45,
    soft_time_limit=30,
)
def send_email_notification_task(
    self,
    recipient_email: str,
    subject: str,
    message: str,
    html_message: str | None = None,
) -> dict[str, Any]:
    """
    Send an email notification via Django's configured mail backend.
    Enforces email deduplication lock (5 minutes) to prevent duplicate sends.
    """
    logger.info("send_email_notification_task triggered for: %s | Subject: %s", recipient_email, subject)

    # Email deduplication lock
    subject_hash = hashlib.md5(f"{recipient_email}:{subject}".encode()).hexdigest()
    lock_key = f"email_dedup:{subject_hash}"
    if not self.acquire_idempotency_lock(lock_key, ttl_seconds=300):
        logger.info("Duplicate email suppressed within 5m window for %s: %s", recipient_email, subject)
        return {"status": "SUPPRESSED_DUPLICATE", "recipient": recipient_email}

    try:
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "clinical-alerts@hospital.org")
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )

        return {
            "status": "DELIVERED",
            "recipient": recipient_email,
            "subject": subject,
        }

    except Exception as exc:
        logger.error("Failed to send email to %s: %s", recipient_email, exc, exc_info=True)
        # Release lock so retry can re-attempt
        self.release_idempotency_lock(lock_key)
        raise self.retry(exc=exc)
