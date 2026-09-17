"""
Authoritative relational data models for Clinical Whiteboards,
versioned Excalidraw documents, collaboration sessions, shares, and audit logs.
Sole authoritative store: Neon PostgreSQL.
"""
import hashlib
import json
import secrets
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class WhiteboardType(models.TextChoices):
    CARE_PLAN = "CARE_PLAN", "Care Plan"
    CLINICAL_WORKFLOW = "CLINICAL_WORKFLOW", "Clinical Workflow"
    PATIENT_JOURNEY = "PATIENT_JOURNEY", "Patient Journey"
    TRIAGE_WORKFLOW = "TRIAGE_WORKFLOW", "Triage Workflow"
    RISK_ANALYSIS = "RISK_ANALYSIS", "Risk Analysis"
    DECISION_TREE = "DECISION_TREE", "Decision Tree"
    CLINICAL_EDUCATION = "CLINICAL_EDUCATION", "Clinical Education"
    TEAM_COLLABORATION = "TEAM_COLLABORATION", "Team Collaboration"
    ML_WORKFLOW = "ML_WORKFLOW", "ML Workflow"
    AI_WORKFLOW = "AI_WORKFLOW", "AI Workflow"
    DATA_LINEAGE = "DATA_LINEAGE", "Data Lineage"
    SYSTEM_ARCHITECTURE = "SYSTEM_ARCHITECTURE", "System Architecture"
    INCIDENT_RESPONSE = "INCIDENT_RESPONSE", "Incident Response"
    GENERAL = "GENERAL", "General"


class DataClassification(models.TextChoices):
    PUBLIC = "PUBLIC", "Public"
    INTERNAL = "INTERNAL", "Internal"
    SENSITIVE = "SENSITIVE", "Sensitive"
    PHI = "PHI", "Protected Health Information (PHI)"
    RESTRICTED = "RESTRICTED", "Restricted"


class WhiteboardStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    IN_REVIEW = "IN_REVIEW", "In Review"
    APPROVED = "APPROVED", "Approved"
    ARCHIVED = "ARCHIVED", "Archived"
    DELETED_PENDING_RETENTION = "DELETED_PENDING_RETENTION", "Deleted Pending Retention"
    PURGED = "PURGED", "Purged"


class ClinicalWhiteboard(models.Model):
    """
    Clinical Whiteboard container model.
    Adheres strictly to the clinical non-authoritativeness invariant:
    Diagram annotations are non-authoritative visualization artifacts.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, default="")
    type = models.CharField(
        max_length=50,
        choices=WhiteboardType.choices,
        default=WhiteboardType.GENERAL,
        db_index=True,
    )
    classification = models.CharField(
        max_length=20,
        choices=DataClassification.choices,
        default=DataClassification.INTERNAL,
        db_index=True,
    )
    status = models.CharField(
        max_length=30,
        choices=WhiteboardStatus.choices,
        default=WhiteboardStatus.DRAFT,
        db_index=True,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_whiteboards",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_whiteboards",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_whiteboards",
    )
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clinical_whiteboards",
        help_text="Optional linked patient record. Enforces PHI classification when set.",
    )
    organization_id = models.CharField(max_length=64, blank=True, default="")
    current_version = models.IntegerField(default=1)
    is_locked = models.BooleanField(default=False)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="locked_whiteboards",
    )
    locked_at = models.DateTimeField(null=True, blank=True)
    
    # Clinical governance & human sign-off
    clinical_reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_whiteboards",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, default="")

    tags = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Arbitrary clinical or ML references, non-authoritative annotations.",
    )
    thumbnail_data = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "clinical_whiteboards"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["type", "classification"]),
            models.Index(fields=["status", "updated_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.type}, v{self.current_version})"

    @property
    def is_phi(self) -> bool:
        return self.classification == DataClassification.PHI or self.patient is not None


class WhiteboardDocument(models.Model):
    """
    Versioned document storing Excalidraw elements, appState, and files.
    Every update or checkpoint generates a verifiable SHA-256 content hash.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    whiteboard = models.ForeignKey(
        ClinicalWhiteboard,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    version_number = models.IntegerField(db_index=True)
    elements = models.JSONField(default=list, help_text="Excalidraw elements array")
    app_state = models.JSONField(default=dict, blank=True, help_text="Excalidraw appState dictionary")
    files = models.JSONField(default=dict, blank=True, help_text="Excalidraw binary files mapping")
    content_hash = models.CharField(max_length=64, db_index=True)
    size_bytes = models.IntegerField(default=0)
    schema_version = models.IntegerField(default=2)
    is_checkpoint = models.BooleanField(default=False)
    checkpoint_summary = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="whiteboard_documents",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "whiteboard_documents"
        ordering = ["-version_number"]
        unique_together = ("whiteboard", "version_number")

    def __str__(self) -> str:
        return f"{self.whiteboard.title} - v{self.version_number}"

    @staticmethod
    def calculate_hash(elements, app_state, files) -> str:
        payload = json.dumps(
            {"elements": elements, "app_state": app_state, "files": files},
            sort_keys=True,
            default=str,
        )
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class WhiteboardAsset(models.Model):
    """
    Attached binary asset (images, SVG components, embedded diagrams).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    whiteboard = models.ForeignKey(
        ClinicalWhiteboard,
        on_delete=models.CASCADE,
        related_name="assets",
    )
    file = models.FileField(upload_to="whiteboards/assets/%Y/%m/")
    file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    size_bytes = models.IntegerField(default=0)
    sha256_checksum = models.CharField(max_length=64)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "whiteboard_assets"


class WhiteboardShare(models.Model):
    """
    Cryptographically secure share token granting controlled access.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    whiteboard = models.ForeignKey(
        ClinicalWhiteboard,
        on_delete=models.CASCADE,
        related_name="shares",
    )
    share_token = models.CharField(max_length=64, unique=True, db_index=True)
    target_role = models.CharField(max_length=50, blank=True, default="")
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_whiteboard_shares",
    )
    allow_edit = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_whiteboard_shares",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "whiteboard_shares"

    @classmethod
    def generate_token(cls) -> str:
        return secrets.token_hex(32)

    @property
    def is_valid(self) -> bool:
        if self.is_revoked:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True


class WhiteboardSession(models.Model):
    """
    Active live collaboration session tracker.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    whiteboard = models.ForeignKey(
        ClinicalWhiteboard,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="whiteboard_sessions",
    )
    channel_name = models.CharField(max_length=255)
    client_color = models.CharField(max_length=20, default="#0284c7")
    last_heartbeat = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "whiteboard_sessions"


class WhiteboardComment(models.Model):
    """
    Clinician discussion threads anchored to diagram element coordinates.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    whiteboard = models.ForeignKey(
        ClinicalWhiteboard,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    element_id = models.CharField(max_length=100, blank=True, default="")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="whiteboard_comments",
    )
    text = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "whiteboard_comments"
        ordering = ["created_at"]


class WhiteboardAuditEvent(models.Model):
    """
    Immutable audit event logging every creation, mutation, export, share, restore, and sign-off.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    whiteboard = models.ForeignKey(
        ClinicalWhiteboard,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="whiteboard_audit_events",
    )
    user_role = models.CharField(max_length=50, blank=True, default="")
    action = models.CharField(max_length=50, db_index=True)
    version_number = models.IntegerField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "whiteboard_audit_events"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Audit: {self.action} by {self.user} at {self.created_at}"
