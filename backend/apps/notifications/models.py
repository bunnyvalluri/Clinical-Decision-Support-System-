"""
Notifications models — clinical alerts and staff messaging.
"""
from django.db import models

from apps.core.models import BaseModel


class NotificationSeverity(models.TextChoices):
    INFO = "INFO", "Informational"
    WARNING = "WARNING", "Warning"
    HIGH = "HIGH", "High Risk Alert"
    CRITICAL = "CRITICAL", "Critical / Emergency"


class NotificationType(models.TextChoices):
    CLINICAL = "CLINICAL", "Clinical Event"
    RISK = "RISK", "Risk Assessment Alert"
    TRIAGE = "TRIAGE", "Triage Escalation"
    APPOINTMENT = "APPOINTMENT", "Appointment"
    SYSTEM = "SYSTEM", "System Alert"
    SECURITY = "SECURITY", "Security Event"
    AI = "AI", "AI Assistant Output"
    MODEL = "MODEL", "Model Registry Alert"
    DATA_QUALITY = "DATA_QUALITY", "Data Quality Anomaly"
    ADMIN = "ADMIN", "Administrative Alert"


class NotificationStatus(models.TextChoices):
    UNREAD = "UNREAD", "Unread"
    READ = "READ", "Read"
    ARCHIVED = "ARCHIVED", "Archived"


class NotificationChannel(models.TextChoices):
    IN_APP = "IN_APP", "In-App Notification"
    WEBSOCKET = "WEBSOCKET", "Real-Time WebSocket"
    EMAIL = "EMAIL", "Email Alert"
    SMS = "SMS", "SMS Dispatch"


class Notification(BaseModel):
    """
    Clinical alert or decision support notification for staff.
    """

    recipient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
        help_text="Clinical staff member receiving this notification.",
    )
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Patient linked to this alert.",
    )
    prediction = models.ForeignKey(
        "predictions.Prediction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Prediction that triggered this notification.",
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.CLINICAL,
        db_index=True,
    )
    severity = models.CharField(
        max_length=20,
        choices=NotificationSeverity.choices,
        default=NotificationSeverity.INFO,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=NotificationStatus.choices,
        default=NotificationStatus.UNREAD,
        db_index=True,
    )
    channel = models.CharField(
        max_length=30,
        choices=NotificationChannel.choices,
        default=NotificationChannel.IN_APP,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    action_url = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notifications"
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "created_at"]),
            models.Index(fields=["severity", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"[{self.severity}] {self.title} -> {self.recipient.email}"
