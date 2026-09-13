"""
Model registry models — versioned machine learning model artifacts and metadata.
Enforces strict model deployment lifecycles (CANDIDATE, ACTIVE, ARCHIVED),
in-memory caching invalidation, and immutable audit trails.
"""
from django.db import models, transaction
from django.utils import timezone

from apps.core.models import AuditLog, BaseModel


class ModelStatus(models.TextChoices):
    CANDIDATE = "CANDIDATE", "Candidate"
    ACTIVE = "ACTIVE", "Active (Production)"
    ARCHIVED = "ARCHIVED", "Archived"
    STAGING = "STAGING", "Staging"
    RETIRED = "RETIRED", "Retired"
    FAILED = "FAILED", "Failed"


class ModelVersion(BaseModel):
    """
    Registry of trained machine learning model versions.

    Tracks algorithmic architecture, evaluation metrics, serialised artifact
    pointers, and training dataset provenance.
    """

    model_name = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Clinical target identifier (e.g. 'random_forest_risk_model').",
    )
    algorithm = models.CharField(
        max_length=100,
        help_text="Algorithm family (e.g. 'RandomForestClassifier', 'AdaBoost', 'SVM').",
    )
    version = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Semantic version string (e.g. '1.0.0').",
    )
    status = models.CharField(
        max_length=30,
        choices=ModelStatus.choices,
        default=ModelStatus.CANDIDATE,
        db_index=True,
        help_text="Deployment lifecycle status.",
    )
    artifact_location = models.CharField(
        max_length=500,
        help_text="Persistent storage URI or filesystem artifact path.",
    )
    training_dataset_identifier = models.CharField(
        max_length=150,
        default="clinical_risk_v1",
        db_index=True,
        help_text="Unique identifier of the dataset used for training.",
    )
    feature_schema_version = models.CharField(
        max_length=50,
        default="v1.0",
        help_text="Expected input feature schema version.",
    )
    preprocessing_version = models.CharField(
        max_length=50,
        default="v1.0",
        help_text="Preprocessing pipeline version applied to inputs.",
    )

    # Core Evaluation Metrics
    accuracy = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Overall accuracy on test partition (0.0000 - 1.0000).",
    )
    precision = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Macro-averaged precision metric (0.0000 - 1.0000).",
    )
    recall = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Macro-averaged recall metric (0.0000 - 1.0000).",
    )
    f1_score = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Macro-averaged F1 score (0.0000 - 1.0000).",
    )
    roc_auc = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Area under ROC curve where mathematically applicable.",
    )

    # Performance & Provenance
    metrics = models.JSONField(
        default=dict,
        blank=True,
        help_text="Validation metrics: accuracy, roc_auc, f1, precision, recall, confusion_matrix.",
    )
    hyperparameters = models.JSONField(
        default=dict,
        blank=True,
        help_text="Model hyperparameter configuration.",
    )
    training_dataset_info = models.JSONField(
        default=dict,
        blank=True,
        help_text="Dataset metadata: name, sample_count, feature_count, balance_ratio.",
    )

    # Lifecycle Timestamps & Users
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registered_models",
        help_text="User who triggered or registered this model build.",
    )
    activated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when this version was promoted to production.",
    )
    activated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activated_models",
        help_text="Clinician or administrator who approved production deployment.",
    )
    retired_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when this version was retired/archived.",
    )

    class Meta:
        db_table = "model_versions"
        verbose_name = "Model Version"
        verbose_name_plural = "Model Versions"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["model_name", "version"],
                name="unique_model_name_version",
            ),
        ]
        indexes = [
            models.Index(fields=["model_name", "version"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["model_name", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.model_name} v{self.version} [{self.status}]"

    @property
    def is_active(self) -> bool:
        return self.status == ModelStatus.ACTIVE

    @property
    def artifact_path(self) -> str:
        return self.artifact_location

    @artifact_path.setter
    def artifact_path(self, value: str) -> None:
        self.artifact_location = value

    def activate(self, activated_by=None, reason: str = "Model promoted to active") -> None:
        """
        Atomically activate this model version for production predictions.
        Deactivates any currently active version of the same model_name to ARCHIVED.
        Never replaces a production model silently: logs audit entry and invalidates cache.
        """
        now = timezone.now()
        with transaction.atomic():
            # 1. Identify currently active models for this model_name
            active_models = ModelVersion.objects.select_for_update().filter(
                model_name=self.model_name,
                status=ModelStatus.ACTIVE,
            ).exclude(pk=self.pk)

            prior_versions = list(active_models.values_list("version", flat=True))

            # 2. Archive prior active versions
            active_models.update(
                status=ModelStatus.ARCHIVED,
                retired_at=now,
            )

            # 3. Promote this version to ACTIVE
            self.status = ModelStatus.ACTIVE
            self.activated_at = now
            self.activated_by = activated_by
            self.retired_at = None
            self.save(update_fields=["status", "activated_at", "activated_by", "retired_at", "updated_at"])

            # 4. Audit Log
            try:
                AuditLog.objects.create(
                    user=activated_by,
                    action=AuditLog.Action.UPDATE,
                    resource_type="ModelVersion",
                    resource_id=str(self.id),
                    description=f"Promoted {self.model_name} v{self.version} to ACTIVE. Replaced: {prior_versions or 'None'}. Reason: {reason}",
                    metadata={
                        "model_name": self.model_name,
                        "version": self.version,
                        "prior_active_versions": prior_versions,
                        "reason": reason,
                    },
                )
            except Exception:
                pass

        # 5. Invalidate in-memory cache
        try:
            from services.model_loader import ModelLoaderService
            ModelLoaderService.invalidate_cache(self.model_name)
        except Exception:
            pass

    def rollback(self, to_version: str, user=None, reason: str = "Rollback to prior version") -> "ModelVersion":
        """
        Rollback from current active model to a specified previous model version.
        """
        target = ModelVersion.objects.get(model_name=self.model_name, version=to_version)
        target.activate(activated_by=user, reason=f"Rollback to v{to_version}. {reason}")
        return target

    def archive(self, user=None, reason: str = "Model archived") -> None:
        """Retire/archive this model version."""
        self.status = ModelStatus.ARCHIVED
        self.retired_at = timezone.now()
        self.save(update_fields=["status", "retired_at", "updated_at"])

        try:
            from services.model_loader import ModelLoaderService
            ModelLoaderService.invalidate_cache(self.model_name)
        except Exception:
            pass

