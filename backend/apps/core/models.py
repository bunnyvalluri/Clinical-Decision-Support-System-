"""
Core abstract base models.

All domain models in this project inherit from BaseModel to get
UUID primary keys, consistent timestamps, and soft-delete support.
"""
import uuid

from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model providing UUID primary key and audit timestamps.

    Every concrete model in the system inherits from this class to ensure
    a consistent schema across all tables.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier (UUID v4).",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Record creation timestamp (UTC).",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Record last-modification timestamp (UTC).",
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class SoftDeleteManager(models.Manager):
    """Default manager that excludes soft-deleted records."""

    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Manager that returns ALL records including soft-deleted ones."""

    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset()


class SoftDeleteModel(BaseModel):
    """
    Abstract model that supports soft deletion.

    Records are never permanently deleted from the database; instead the
    ``is_deleted`` flag is set to True and the standard manager filters
    them out automatically.
    """

    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True if this record has been soft-deleted.",
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the record was soft-deleted (UTC).",
    )

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False) -> tuple[int, dict]:
        """Soft-delete by setting the flag rather than removing the row."""
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
        return 1, {self.__class__.__name__: 1}

    def hard_delete(self, using=None, keep_parents=False) -> tuple[int, dict]:
        """Permanently remove the record from the database."""
        return super().delete(using=using, keep_parents=keep_parents)

    def restore(self) -> None:
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


class AuditLog(models.Model):
    """
    System-wide audit log.

    Records every significant state change or API action performed by
    authenticated users. Used for compliance, debugging, and security review.
    """

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        READ = "READ", "Read"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"
        PREDICT = "PREDICT", "Predict"
        EXPORT = "EXPORT", "Export"
        TRAIN = "TRAIN", "Train Model"

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        db_index=True,
    )
    action = models.CharField(
        max_length=20,
        choices=Action.choices,
        db_index=True,
    )
    resource_type = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Model/resource name (e.g. 'Patient', 'Prediction').",
    )
    resource_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Primary key of the affected resource.",
    )
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["resource_type", "resource_id"]),
            models.Index(fields=["action", "timestamp"]),
        ]
        ordering = ["-timestamp"]

    def __str__(self) -> str:
        return f"[{self.timestamp}] {self.action} {self.resource_type} by {self.user}"
