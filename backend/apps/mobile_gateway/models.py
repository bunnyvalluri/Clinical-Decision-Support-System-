"""
Healthcare Mobile Event Gateway Models.

Authoritative source of truth: Neon PostgreSQL.
No raw PHI, OTPs, or authentication secrets are stored unredacted.
All destinations and rules default to disabled (Default-Deny).
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class RegistrationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Approval"
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    REVOKED = "REVOKED", "Revoked"
    LOST = "LOST", "Reported Lost"
    DECOMMISSIONED = "DECOMMISSIONED", "Decommissioned"


class DestinationType(models.TextChoices):
    SECURE_WEBHOOK = "SECURE_WEBHOOK", "Secure Webhook (HTTPS/HMAC)"
    EMAIL = "EMAIL", "Approved Hospital Email"
    INTERNAL_API = "INTERNAL_API", "Internal Clinical API"
    PUSH_NOTIFICATION = "PUSH_NOTIFICATION", "Clinical Push Notification"
    ENTERPRISE_CHAT = "ENTERPRISE_CHAT", "Enterprise Messaging"
    SMS = "SMS", "Controlled Outbound SMS"
    OTHER_APPROVED = "OTHER_APPROVED", "Other Security-Approved Destination"


class ApprovalStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Clinical/IT Review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    SUSPENDED = "SUSPENDED", "Suspended"


class EventType(models.TextChoices):
    SMS_RECEIVED = "SMS_RECEIVED", "SMS Received"
    CALL_RECEIVED = "CALL_RECEIVED", "Call Event"
    APP_NOTIFICATION = "APP_NOTIFICATION", "App Notification"
    SYSTEM_EVENT = "SYSTEM_EVENT", "System Event"
    BATTERY_EVENT = "BATTERY_EVENT", "Battery / Power Event"
    NETWORK_EVENT = "NETWORK_EVENT", "Network State Event"
    DEVICE_STATUS = "DEVICE_STATUS", "Device Heartbeat / Status"
    ALL = "ALL", "All Permitted Events"


class DataClassification(models.TextChoices):
    PUBLIC = "PUBLIC", "Public Information"
    LOW_SENSITIVITY = "LOW_SENSITIVITY", "Low Sensitivity (Operational)"
    SENSITIVE = "SENSITIVE", "Sensitive Non-Clinical"
    PHI = "PHI", "Protected Health Information"
    OTP = "OTP", "One-Time Password / Auth Secret"
    AUTHENTICATION_SECRET = "AUTHENTICATION_SECRET", "Credential / Key / Secret"
    FINANCIAL = "FINANCIAL", "Financial / Billing Information"
    UNKNOWN = "UNKNOWN", "Unknown / Unclassified"


class ForwardingAction(models.TextChoices):
    ALLOW = "ALLOW", "Allow Forwarding"
    BLOCK = "BLOCK", "Block Event"
    REDACT = "REDACT", "Redact Sensitive Data & Forward"
    REVIEW_REQUIRED = "REVIEW_REQUIRED", "Require Human Clinician Review"


class ProcessingStatus(models.TextChoices):
    RECEIVED = "RECEIVED", "Received by Gateway"
    CLASSIFIED = "CLASSIFIED", "Classified by Policy Engine"
    BLOCKED = "BLOCKED", "Blocked by Policy"
    REDACTED = "REDACTED", "Sanitized / Redacted"
    APPROVED = "APPROVED", "Approved for Delivery"
    QUEUED = "QUEUED", "Queued in Celery"
    SENDING = "SENDING", "Transmitting to Destination"
    DELIVERED = "DELIVERED", "Successfully Delivered"
    FAILED = "FAILED", "Transmission Failed"
    RETRYING = "RETRYING", "Retrying with Backoff"
    DEAD_LETTER = "DEAD_LETTER", "Routed to Dead-Letter Queue"
    EXPIRED = "EXPIRED", "Expired (Retention TTL)"
    CANCELLED = "CANCELLED", "Cancelled by Kill Switch"


class RiskLevel(models.TextChoices):
    LOW = "LOW", "Low Risk"
    MEDIUM = "MEDIUM", "Medium Risk"
    HIGH = "HIGH", "High Risk"
    CRITICAL = "CRITICAL", "Critical Security Risk"


class MobileDevice(models.Model):
    """
    Registered mobile device acting as an authorized event gateway node.
    Enforces hardware Keystore identity, device status gates, and revocation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mobile_devices",
        help_text="Owning patient or authorized staff user.",
    )
    device_identifier = models.CharField(
        max_length=128,
        unique=True,
        db_index=True,
        help_text="Hardware/app-generated unique device identity hash.",
    )
    device_name = models.CharField(max_length=100, default="Android Device")
    platform = models.CharField(max_length=32, default="ANDROID")
    app_version = models.CharField(max_length=32, default="3.42.0")
    os_version = models.CharField(max_length=32, blank=True, default="Android 14")
    registration_status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.PENDING,
        db_index=True,
    )
    public_key = models.TextField(
        blank=True,
        help_text="Device public key stored in PEM or Hex format for HMAC/ECDSA verification.",
    )
    shared_secret = models.CharField(
        max_length=128,
        blank=True,
        help_text="Cryptographic device secret (stored securely for HMAC verification).",
    )
    last_seen = models.DateTimeField(null=True, blank=True)
    is_online = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "mobile_devices"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.device_name} ({self.device_identifier[:8]}...) - {self.registration_status}"

    @property
    def is_active_for_transmission(self) -> bool:
        return self.registration_status == RegistrationStatus.ACTIVE


class ForwardingDestination(models.Model):
    """
    Approved and allowlisted forwarding destination.
    Default-deny: New destinations default to disabled and require IT Admin approval.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    destination_type = models.CharField(
        max_length=32,
        choices=DestinationType.choices,
        default=DestinationType.INTERNAL_API,
    )
    endpoint = models.CharField(
        max_length=500,
        help_text="Verified HTTPS URL or approved destination identifier.",
    )
    environment = models.CharField(max_length=32, default="PRODUCTION")
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        db_index=True,
    )
    data_classification_allowed = models.JSONField(
        default=list,
        help_text="List of permitted classifications e.g. ['PUBLIC', 'LOW_SENSITIVITY']",
    )
    encryption_required = models.BooleanField(default=True)
    webhook_signing_secret = models.CharField(max_length=128, blank=True)
    rate_limit_per_minute = models.IntegerField(default=60)
    enabled = models.BooleanField(default=False, help_text="Default-deny forwarding flag")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_destinations",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_destinations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "mobile_forwarding_destinations"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} [{self.destination_type}] - {self.approval_status}"


class ForwardingRule(models.Model):
    """
    Declarative forwarding policy rule.
    Strictly declarative: executes no arbitrary scripts, code, or SQL.
    Priority-based resolution: lowest number = highest priority. Most restrictive wins.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    event_type = models.CharField(
        max_length=32,
        choices=EventType.choices,
        default=EventType.ALL,
    )
    source_filter = models.CharField(
        max_length=255,
        default="*",
        help_text="Sender number pattern or application package (glob/regex).",
    )
    content_filter = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Regex keyword filter (declarative only).",
    )
    classification_policy = models.CharField(
        max_length=20,
        choices=ForwardingAction.choices,
        default=ForwardingAction.BLOCK,
        help_text="Policy outcome when rule criteria matches.",
    )
    destination = models.ForeignKey(
        ForwardingDestination,
        on_delete=models.CASCADE,
        related_name="rules",
    )
    priority = models.IntegerField(
        default=100,
        help_text="Rule evaluation priority: lower integer = evaluated first.",
    )
    enabled = models.BooleanField(default=False, help_text="Default-deny rule state.")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_rules",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_rules",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "mobile_forwarding_rules"
        ordering = ["priority", "created_at"]

    def __str__(self):
        return f"{self.name} (Priority {self.priority}) -> {self.classification_policy}"


class MobileEvent(models.Model):
    """
    Normalized and sanitized event ingested from an authorized mobile gateway.
    Raw unredacted PHI, OTPs, or credentials are NEVER stored.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(
        MobileDevice,
        on_delete=models.CASCADE,
        related_name="events",
    )
    event_type = models.CharField(max_length=32, choices=EventType.choices)
    source = models.CharField(
        max_length=255,
        help_text="Sender phone number or application package name.",
    )
    timestamp = models.DateTimeField(help_text="Event timestamp reported by device.")
    content = models.TextField(
        blank=True,
        help_text="Sanitized / redacted event content.",
    )
    raw_hash = models.CharField(
        max_length=64,
        blank=True,
        help_text="SHA-256 hash of original payload for tamper-evidence and deduplication.",
    )
    metadata = models.JSONField(default=dict, blank=True)
    classification = models.CharField(
        max_length=32,
        choices=DataClassification.choices,
        default=DataClassification.UNKNOWN,
        db_index=True,
    )
    risk_level = models.CharField(
        max_length=20,
        choices=RiskLevel.choices,
        default=RiskLevel.LOW,
    )
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.RECEIVED,
        db_index=True,
    )
    idempotency_key = models.CharField(
        max_length=128,
        unique=True,
        db_index=True,
        help_text="Unique key ensuring duplicate events are discarded.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "mobile_events"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Event [{self.event_type}] from {self.source} - {self.classification} ({self.processing_status})"


class DeliveryReceipt(models.Model):
    """
    Immutable audit record of forwarding attempts and delivery confirmations.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mobile_event = models.ForeignKey(
        MobileEvent,
        on_delete=models.CASCADE,
        related_name="receipts",
    )
    destination = models.ForeignKey(
        ForwardingDestination,
        on_delete=models.CASCADE,
        related_name="receipts",
    )
    attempt = models.IntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=[
            ("SUCCESS", "Success"),
            ("FAILED", "Failed"),
            ("RETRYING", "Retrying"),
        ],
    )
    latency_ms = models.IntegerField(default=0)
    provider_response_code = models.IntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "mobile_delivery_receipts"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Receipt: {self.status} to {self.destination.name} (Attempt {self.attempt})"


class DeadLetterEvent(models.Model):
    """
    Dead-letter storage for events that permanently failed forwarding policy/delivery.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mobile_event = models.ForeignKey(
        MobileEvent,
        on_delete=models.CASCADE,
        related_name="dead_letters",
    )
    destination = models.ForeignKey(
        ForwardingDestination,
        on_delete=models.CASCADE,
        related_name="dead_letters",
    )
    failure_reason = models.TextField()
    attempt_count = models.IntegerField(default=1)
    last_attempt = models.DateTimeField(auto_now=True)
    next_retry = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("PENDING_REVIEW", "Pending Review"),
            ("DISCARDED", "Discarded"),
            ("REQUEUED", "Requeued"),
        ],
        default="PENDING_REVIEW",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "mobile_dead_letter_events"
        ordering = ["-created_at"]

    def __str__(self):
        return f"DeadLetter: {self.mobile_event_id} -> {self.destination.name} ({self.status})"


class EmergencyKillSwitch(models.Model):
    """
    Immediate emergency kill switch to disable event forwarding globally or per scope.
    Preserves audit trails while halting real-time delivery immediately.
    """
    class KillScope(models.TextChoices):
        GLOBAL = "GLOBAL", "Global Shutdown of All Mobile Forwarding"
        DESTINATION = "DESTINATION", "Disable Specific Destination"
        DEVICE = "DEVICE", "Disable Specific Mobile Device"
        RULE = "RULE", "Disable Specific Forwarding Rule"
        USER = "USER", "Disable All Forwarding for User"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scope = models.CharField(
        max_length=20,
        choices=KillScope.choices,
        default=KillScope.GLOBAL,
    )
    target_id = models.CharField(
        max_length=128,
        blank=True,
        default="",
        help_text="Target UUID/Identifier when scope is not GLOBAL.",
    )
    reason = models.TextField(help_text="Clinical / Security reason for activation.")
    is_active = models.BooleanField(default=True)
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="triggered_kill_switches",
    )
    activated_at = models.DateTimeField(auto_now_add=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "mobile_emergency_kill_switches"
        ordering = ["-activated_at"]

    def __str__(self):
        status = "ACTIVE" if self.is_active else "INACTIVE"
        return f"KillSwitch [{self.scope}] target={self.target_id or 'ALL'} ({status})"
