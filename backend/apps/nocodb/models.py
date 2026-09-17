"""
Authoritative relational data models for NocoDB Healthcare Analytics & Data Workspace.
Sole authoritative store: Neon PostgreSQL.
Metadata Isolation: NocoDB auxiliary state operates on controlled projections.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class DatasetCategory(models.TextChoices):
    ML_OPS = "ML_OPS", "ML & AI Operations"
    DATA_QUALITY = "DATA_QUALITY", "Data Quality & Integrity"
    CLINICAL_OPS = "CLINICAL_OPS", "Clinical Workflow Operations"
    SYSTEM_TELEMETRY = "SYSTEM_TELEMETRY", "System & API Telemetry"
    COLLABORATION = "COLLABORATION", "Collaboration & Whiteboards"
    GENERAL = "GENERAL", "General Analytics"


class ColumnDataType(models.TextChoices):
    SINGLE_LINE_TEXT = "SingleLineText", "Single Line Text"
    NUMBER = "Number", "Number"
    RATING = "Rating", "Rating"
    SELECT = "Select", "Single Select"
    MULTI_SELECT = "MultiSelect", "Multi Select"
    FORMULA = "Formula", "Formula"
    CHECKBOX = "Checkbox", "Checkbox"
    DATETIME = "DateTime", "Date & Time"
    DATE = "Date", "Date"
    JSON = "JSON", "JSON Object"


class AuditAction(models.TextChoices):
    VIEW = "VIEW", "View Dataset"
    FILTER = "FILTER", "Filter Query"
    INSERT = "INSERT", "Insert Row"
    UPDATE = "UPDATE", "Update Row"
    DELETE = "DELETE", "Delete Row"
    EXPORT = "EXPORT", "Export Dataset"
    SYNC = "SYNC", "Sync Projection"
    MCP_TOOL_INVOCATION = "MCP_TOOL_INVOCATION", "MCP Tool Invocation"
    SCHEMA_CHANGE = "SCHEMA_CHANGE", "Schema Change"


class NocoDBConnection(models.Model):
    """
    Configuration and health telemetry for the auxiliary NocoDB container instance.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, default="Primary NocoDB Analytics Engine")
    base_url = models.CharField(
        max_length=255,
        default="http://nocodb:8080",
        help_text="Internal HTTP endpoint for NocoDB container",
    )
    api_token = models.CharField(max_length=255, blank=True, default="")
    is_active = models.BooleanField(default=True)
    health_status = models.CharField(
        max_length=50,
        default="HEALTHY",
        choices=[
            ("HEALTHY", "Healthy"),
            ("DEGRADED", "Degraded"),
            ("OFFLINE", "Offline"),
            ("MAINTENANCE", "Maintenance"),
        ],
    )
    last_health_check_at = models.DateTimeField(null=True, blank=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    sync_interval_minutes = models.PositiveIntegerField(default=15)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "NocoDB Connection"
        verbose_name_plural = "NocoDB Connections"

    def __str__(self):
        return f"{self.name} ({self.health_status}) - {self.base_url}"


class NocoDBDataset(models.Model):
    """
    Governed de-identified analytical dataset exposed in the NocoDB workspace.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    category = models.CharField(
        max_length=50,
        choices=DatasetCategory.choices,
        default=DatasetCategory.GENERAL,
    )
    allowed_roles = models.JSONField(
        default=list,
        help_text="List of roles permitted to access this dataset (e.g. ['informaticist', 'admin', 'doctor'])",
    )
    is_active = models.BooleanField(default=True)
    is_system_dataset = models.BooleanField(
        default=True,
        help_text="System-managed projection synchronized from Neon PostgreSQL",
    )
    source_model = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Underlying Django model string, e.g. 'predictions.Prediction'",
    )
    row_count = models.PositiveIntegerField(default=0)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "title"]
        verbose_name = "NocoDB Governed Dataset"
        verbose_name_plural = "NocoDB Governed Datasets"

    def __str__(self):
        return f"{self.title} ({self.slug}) [{self.category}]"


class NocoDBSchemaColumn(models.Model):
    """
    Column metadata definition for governed NocoDB datasets.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset = models.ForeignKey(
        NocoDBDataset,
        on_delete=models.CASCADE,
        related_name="columns",
    )
    name = models.CharField(max_length=100, db_index=True)
    display_name = models.CharField(max_length=150)
    column_type = models.CharField(
        max_length=50,
        choices=ColumnDataType.choices,
        default=ColumnDataType.SINGLE_LINE_TEXT,
    )
    is_primary = models.BooleanField(default=False)
    is_phi = models.BooleanField(
        default=False,
        help_text="Flag indicating column contains sensitive PHI, requiring strict masking",
    )
    is_read_only = models.BooleanField(default=True)
    options = models.JSONField(
        default=list,
        blank=True,
        help_text="Allowed options for Select/MultiSelect column types",
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "name"]
        unique_together = ("dataset", "name")
        verbose_name = "NocoDB Schema Column"
        verbose_name_plural = "NocoDB Schema Columns"

    def __str__(self):
        return f"{self.dataset.slug}.{self.name} ({self.column_type})"


class NocoDBRowRecord(models.Model):
    """
    Materialized analytical row records projected from Neon PostgreSQL.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset = models.ForeignKey(
        NocoDBDataset,
        on_delete=models.CASCADE,
        related_name="rows",
    )
    anon_ref_id = models.CharField(
        max_length=128,
        db_index=True,
        help_text="Deterministic pseudonymous reference hash",
    )
    data = models.JSONField(default=dict)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["dataset", "anon_ref_id"]),
            models.Index(fields=["dataset", "is_archived", "-created_at"]),
        ]
        verbose_name = "NocoDB Row Record"
        verbose_name_plural = "NocoDB Row Records"

    def __str__(self):
        return f"{self.dataset.slug} - Row {self.anon_ref_id}"


class NocoDBViewPreference(models.Model):
    """
    Saved custom view configurations (filters, sorts, hidden columns) per user.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="nocodb_views",
    )
    dataset = models.ForeignKey(
        NocoDBDataset,
        on_delete=models.CASCADE,
        related_name="views",
    )
    name = models.CharField(max_length=150)
    view_type = models.CharField(
        max_length=50,
        default="grid",
        choices=[
            ("grid", "Grid View"),
            ("gallery", "Gallery View"),
            ("kanban", "Kanban View"),
            ("form", "Form View"),
        ],
    )
    config = models.JSONField(
        default=dict,
        help_text="Saved layout: {filters: [], sorts: [], hidden_columns: []}",
    )
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "name"]
        verbose_name = "NocoDB View Preference"
        verbose_name_plural = "NocoDB View Preferences"

    def __str__(self):
        return f"{self.user} - {self.dataset.slug} ({self.name})"


class NocoDBAuditEvent(models.Model):
    """
    Immutable audit trail for all workspace data views, mutations, exports, and MCP invocations.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nocodb_audit_events",
    )
    user_role = models.CharField(max_length=50, blank=True, default="system")
    action = models.CharField(
        max_length=50,
        choices=AuditAction.choices,
        db_index=True,
    )
    dataset_slug = models.CharField(max_length=100, db_index=True)
    resource_id = models.CharField(max_length=128, blank=True, default="")
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "NocoDB Audit Event"
        verbose_name_plural = "NocoDB Audit Events"

    def __str__(self):
        return f"[{self.created_at.isoformat()}] {self.user_role} - {self.action} on {self.dataset_slug}"


class NocoDBWebhookEvent(models.Model):
    """
    Audited webhook events between NocoDB container and HealthNova AI.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=100)
    direction = models.CharField(
        max_length=20,
        choices=[("INBOUND", "Inbound"), ("OUTBOUND", "Outbound")],
        default="INBOUND",
    )
    payload = models.JSONField(default=dict)
    status = models.CharField(
        max_length=30,
        choices=[
            ("PENDING", "Pending"),
            ("PROCESSED", "Processed"),
            ("FAILED", "Failed"),
        ],
        default="PENDING",
    )
    signature = models.CharField(max_length=255, blank=True, default="")
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "NocoDB Webhook Event"
        verbose_name_plural = "NocoDB Webhook Events"
