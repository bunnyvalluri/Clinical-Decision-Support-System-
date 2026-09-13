"""Notification dispatch Celery tasks — implemented in Stage 7."""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="celery_tasks.notification_tasks.send_risk_alert_notification")
def send_risk_alert_notification(prediction_id: str) -> None:
    """
    Dispatch a risk alert notification for a completed high-risk prediction.
    Implementation: Stage 7.
    """
    logger.info("send_risk_alert_notification triggered for prediction_id=%s", prediction_id)


@shared_task(name="celery_tasks.notification_tasks.send_email_notification")
def send_email_notification(user_id: str, subject: str, message: str) -> None:
    """Send an email notification to a user. Implementation: Stage 7."""
    logger.info("send_email_notification triggered for user_id=%s", user_id)
