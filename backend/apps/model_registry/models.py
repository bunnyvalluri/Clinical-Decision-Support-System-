"""
Model registry models — versioned machine learning model artifacts and metadata.
"""
from django.db import models

from apps.core.models import BaseModel


class ModelStatus(models.TextChoices):
    CANDIDATE = "CANDIDATE", "Candidate"
    STAGING = "STAGING", "Staging"
    ACTIVE = "ACTIVE", "Active (Production)"
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
        help_text="Clinical target identifier (e.g. 'maternal_mortality_ensemble').",
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
    feature_schema_version = models.CharField(
        max_length=50,
        default="v1.0",
        help_text="Expected input feature schema version.",
    )

    # Performance & Provenance
    metrics = models.JSONField(
        default=dict,
        blank=True,
        help_text="Validation metrics: accuracy, roc_auc, f1, precision, recall, brier_score.",
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

    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registered_models",
        help_text="User who triggered or registered this model build.",
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
        ]

    def __str__(self) -> str:
        return f"{self.model_name} v{self.version} [{self.status}]"

    @property
    def is_active(self) -> bool:
        return self.status == ModelStatus.ACTIVE
