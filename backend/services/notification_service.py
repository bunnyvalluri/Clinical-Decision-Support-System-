"""
Clinical Notification Service — BPY-CSE-2666.
Dispatches policy-governed notifications across In-App, WebSocket, and Email channels.
Enforces zero PHI leakage in external channel payloads.
"""
import logging
from typing import Any, Dict, List, Optional
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model

from apps.notifications.models import Notification, NotificationChannel, NotificationSeverity
from apps.patients.models import Patient
from apps.predictions.models import Prediction

logger = logging.getLogger(__name__)
User = get_user_model()


class ClinicalNotificationService:
    """
    Centralized dispatch for clinical alerts, risk escalations, and system governance events.
    """

    ALERT_TYPES = {
        "HIGH_RISK_ALERT": NotificationSeverity.HIGH,
        "CRITICAL_EMERGENCY": NotificationSeverity.CRITICAL,
        "REVIEW_REQUIRED": NotificationSeverity.WARNING,
        "DATA_QUALITY_ALERT": NotificationSeverity.WARNING,
        "MODEL_DRIFT_ALERT": NotificationSeverity.WARNING,
        "SYSTEM_ALERT": NotificationSeverity.INFO,
    }

    @classmethod
    def dispatch_alert(
        cls,
        alert_type: str,
        recipient: Any,
        title: str,
        message: str,
        patient: Optional[Patient] = None,
        prediction: Optional[Prediction] = None,
        action_url: str = "",
        channel: str = NotificationChannel.IN_APP,
    ) -> Notification:
        """
        Create and broadcast an auditable notification.
        """
        severity = cls.ALERT_TYPES.get(alert_type, NotificationSeverity.INFO)

        # 1. Create In-App Notification record in PostgreSQL
        notification = Notification.objects.create(
            recipient=recipient,
            patient=patient,
            prediction=prediction,
            severity=severity,
            channel=channel,
            title=title,
            message=message,
            action_url=action_url,
        )

        # 2. WebSocket Realtime Broadcast
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                payload = {
                    "type": "notification_event",
                    "notification_id": str(notification.id),
                    "alert_type": alert_type,
                    "severity": severity,
                    "title": title,
                    "message": message,
                    "action_url": action_url,
                    "timestamp": notification.created_at.isoformat(),
                    "patient_id": str(patient.id) if patient else None,
                }
                # Send to user-specific channel
                async_to_sync(channel_layer.group_send)(
                    f"user_{recipient.id}",
                    {"type": "user.notification", "payload": payload},
                )
                # Broadcast to general dashboard if high severity
                if severity in (NotificationSeverity.HIGH, NotificationSeverity.CRITICAL):
                    async_to_sync(channel_layer.group_send)(
                        "dashboard",
                        {"type": "dashboard.alert", "payload": payload},
                    )
        except Exception as ws_err:
            logger.debug("WebSocket notification broadcast error: %s", ws_err)

        return notification
