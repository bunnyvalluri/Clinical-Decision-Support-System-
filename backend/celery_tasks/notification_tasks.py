"""
Notification dispatch Celery tasks package interface.
Re-exports tasks from apps.notifications.tasks for modular discovery.
"""
from apps.notifications.tasks import send_email_notification_task, send_notification_task

# Backward compatible aliases
send_risk_alert_notification = send_notification_task
send_email_notification = send_email_notification_task

__all__ = (
    "send_notification_task",
    "send_email_notification_task",
    "send_risk_alert_notification",
    "send_email_notification",
)
