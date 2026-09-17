"""
Django models for search index registry, transactional outbox events,
and immutable search audit trails.
Sole authoritative store: Neon PostgreSQL.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class SearchIndexStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    REBUILDING = "REBUILDING", "Rebuilding"
    DEGRADED = "DEGRADED", "Degraded"
    DISABLED = "DISABLED", "Disabled"
    FAILED = "FAILED", "Failed"


class SearchIndexRegistry(models.Model):
    """
    Authoritative registry of search indexes, schema versions,
    document counts, and health statuses.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    index_uid = models.CharField(max_length=64, unique=True, db_index=True)
    entity_type = models.CharField(max_length=64, db_index=True)
    classification = models.CharField(max_length=32, default="INTERNAL")
    schema_version = models.CharField(max_length=32, default="1.0.0")
    status = models.CharField(
        max_length=32,
        choices=SearchIndexStatus.choices,
        default=SearchIndexStatus.ACTIVE,
        db_index=True,
    )
    document_count = models.IntegerField(default=0)
    last_reindex = models.DateTimeField(null=True, blank=True)
    last_reconciliation = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "search_index_registry"
        ordering = ["index_uid"]

    def __str__(self) -> str:
        return f"{self.index_uid} [{self.status}] (v{self.schema_version})"


class OutboxEventStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    PROCESSED = "PROCESSED", "Processed"
    FAILED = "FAILED", "Failed"


class SearchOutboxEvent(models.Model):
    """
    Transactional outbox event capturing database mutations.
    Guarantees eventual consistency between Neon PostgreSQL and Meilisearch.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entity_type = models.CharField(max_length=64, db_index=True)
    entity_id = models.CharField(max_length=128, db_index=True)
    action = models.CharField(max_length=32, default="UPSERT")  # UPSERT, DELETE
    status = models.CharField(
        max_length=32,
        choices=OutboxEventStatus.choices,
        default=OutboxEventStatus.PENDING,
        db_index=True,
    )
    retry_count = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "search_outbox_events"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Outbox: {self.entity_type}:{self.entity_id} [{self.action} - {self.status}]"


class SearchAuditEvent(models.Model):
    """
    Immutable audit record for executed search queries.
    Stores redacted query strings to comply with HIPAA PHI minimization.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="search_audits",
    )
    user_id_ref = models.IntegerField(null=True, blank=True)
    role = models.CharField(max_length=64, db_index=True)
    index_name = models.CharField(max_length=64, db_index=True)
    redacted_query = models.CharField(max_length=255, blank=True, default="")
    result_count = models.IntegerField(default=0)
    latency_ms = models.IntegerField(default=0)
    search_mode = models.CharField(max_length=32, default="meilisearch")  # meilisearch, degraded_postgres
    correlation_id = models.CharField(max_length=64, blank=True, default="", db_index=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "search_audit_events"
        ordering = ["-timestamp"]

    def __str__(self) -> str:
        return f"SearchAudit: {self.role} in '{self.index_name}' -> {self.result_count} hits ({self.latency_ms}ms)"
