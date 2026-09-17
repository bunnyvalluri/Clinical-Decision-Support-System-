import uuid
from django.conf import settings
from django.db import models


class APIStatus(models.TextChoices):
    DISCOVERED = "DISCOVERED", "Discovered"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    SECURITY_REVIEW = "SECURITY_REVIEW", "Security Review"
    PRIVACY_REVIEW = "PRIVACY_REVIEW", "Privacy Review"
    CLINICAL_REVIEW = "CLINICAL_REVIEW", "Clinical Review"
    APPROVED = "APPROVED", "Approved"
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    DEPRECATED = "DEPRECATED", "Deprecated"
    REJECTED = "REJECTED", "Rejected"


class APITrustLevel(models.TextChoices):
    UNTRUSTED = "UNTRUSTED", "Untrusted"
    REVIEWED = "REVIEWED", "Reviewed"
    APPROVED = "APPROVED", "Approved"
    CLINICAL_APPROVED = "CLINICAL_APPROVED", "Clinical Approved"


class HealthStatus(models.TextChoices):
    HEALTHY = "HEALTHY", "Healthy"
    DEGRADED = "DEGRADED", "Degraded"
    UNHEALTHY = "UNHEALTHY", "Unhealthy"
    UNKNOWN = "UNKNOWN", "Unknown"


class AuthenticationType(models.TextChoices):
    NONE = "NONE", "No Authentication"
    API_KEY = "API_KEY", "API Key"
    BEARER = "BEARER", "Bearer Token"
    OAUTH2 = "OAUTH2", "OAuth 2.0"
    BASIC = "BASIC", "Basic Auth"


class ExternalAPIRegistry(models.Model):
    """Authoritative registry for approved external public APIs."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    provider = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default="Health")
    description = models.TextField()
    base_url = models.URLField(max_length=500)
    documentation_url = models.URLField(max_length=500, blank=True)
    authentication_type = models.CharField(
        max_length=50,
        choices=AuthenticationType.choices,
        default=AuthenticationType.NONE,
    )
    https_required = models.BooleanField(default=True)
    cors_support = models.CharField(
        max_length=20,
        choices=[("YES", "Yes"), ("NO", "No"), ("UNKNOWN", "Unknown")],
        default="YES",
    )
    status = models.CharField(
        max_length=50,
        choices=APIStatus.choices,
        default=APIStatus.DISCOVERED,
        db_index=True,
    )
    trust_level = models.CharField(
        max_length=50,
        choices=APITrustLevel.choices,
        default=APITrustLevel.UNTRUSTED,
    )
    approved_for_use = models.BooleanField(default=False)
    clinical_relevance = models.TextField(blank=True)
    data_classification = models.CharField(max_length=50, default="PUBLIC")
    rate_limit = models.CharField(max_length=100, default="240 req/min")
    timeout = models.PositiveIntegerField(default=5, help_text="Timeout in seconds")
    last_validated_at = models.DateTimeField(null=True, blank=True)
    health_status = models.CharField(
        max_length=50,
        choices=HealthStatus.choices,
        default=HealthStatus.UNKNOWN,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "external_api_registry"
        ordering = ["-created_at"]
        verbose_name = "External API Registry"
        verbose_name_plural = "External API Registries"

    def __str__(self) -> str:
        return f"{self.name} ({self.provider}) [{self.status}]"


class ExternalAPIApproval(models.Model):
    """Audit trail of human and agent reviews leading to API activation."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    api = models.ForeignKey(ExternalAPIRegistry, on_delete=models.CASCADE, related_name="approvals")
    stage = models.CharField(max_length=50, choices=APIStatus.choices)
    decision = models.CharField(
        max_length=50,
        choices=[("APPROVED", "Approved"), ("REJECTED", "Rejected"), ("CHANGES_REQUESTED", "Changes Requested")],
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="external_api_approvals",
    )
    reviewer_role = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "external_api_approvals"
        ordering = ["-created_at"]


class ExternalAPIHealth(models.Model):
    """Timeseries log of health probes and latency records."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    api = models.ForeignKey(ExternalAPIRegistry, on_delete=models.CASCADE, related_name="health_checks")
    latency_ms = models.FloatField(default=0.0)
    status_code = models.IntegerField(default=0)
    is_available = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    checked_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "external_api_health"
        ordering = ["-checked_at"]


class ExternalAPILicense(models.Model):
    """License and terms-of-service compliance tracking."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.CharField(max_length=255)
    api_name = models.CharField(max_length=255)
    license = models.CharField(max_length=255, default="Open Data / Public Domain")
    terms_url = models.URLField(max_length=500, blank=True)
    documentation_url = models.URLField(max_length=500, blank=True)
    review_status = models.CharField(max_length=50, default="REVIEWED")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "external_api_licenses"


class ExternalAPIAuditLog(models.Model):
    """Safe metadata audit log for all outgoing external API interactions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    api = models.ForeignKey(
        ExternalAPIRegistry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    endpoint = models.CharField(max_length=500)
    http_method = models.CharField(max_length=10, default="GET")
    request_id = models.CharField(max_length=100, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    user_role = models.CharField(max_length=50, blank=True)
    status_code = models.IntegerField(default=200)
    latency_ms = models.FloatField(default=0.0)
    success = models.BooleanField(default=True)
    circuit_state = models.CharField(max_length=20, default="CLOSED")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "external_api_audit_log"
        ordering = ["-timestamp"]
