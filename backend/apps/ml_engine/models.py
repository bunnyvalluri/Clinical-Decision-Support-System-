"""
ML Engine models — model versioning and registry.

MLModel stores metadata about every trained model artifact,
enabling versioned predictions and reproducible results.
Full implementation in Stage 4.
"""
from django.db import models

from apps.core.models import BaseModel


class ModelType(models.TextChoices):
    SVM = "SVM", "Support Vector Machine"
    RANDOM_FOREST = "RANDOM_FOREST", "Random Forest"
    ADABOOST = "ADABOOST", "AdaBoost"


class ModelStatus(models.TextChoices):
    TRAINING = "TRAINING", "Training"
    TRAINED = "TRAINED", "Trained"
    EVALUATING = "EVALUATING", "Evaluating"
    ACTIVE = "ACTIVE", "Active (Production)"
    ARCHIVED = "ARCHIVED", "Archived"
    FAILED = "FAILED", "Failed"


class MLModel(BaseModel):
    """
    Registry of trained ML model artifacts.

    Each record corresponds to a saved joblib artifact file on disk.
    Only one model of each type/dataset combination should be ACTIVE at a time.
    """

    name = models.CharField(max_length=255, help_text="Human-readable model name.")
    model_type = models.CharField(
        max_length=30, choices=ModelType.choices, db_index=True
    )
    dataset_name = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Name of the dataset used for training (e.g. 'pima_diabetes').",
    )
    version = models.CharField(
        max_length=50,
        help_text="Semantic version string (e.g. '1.0.0').",
    )
    status = models.CharField(
        max_length=20,
        choices=ModelStatus.choices,
        default=ModelStatus.TRAINING,
        db_index=True,
    )
    artifact_path = models.CharField(
        max_length=500,
        blank=True,
        help_text="Relative path to the joblib artifact file.",
    )
    # Evaluation metrics stored as JSON
    metrics = models.JSONField(
        default=dict,
        blank=True,
        help_text="Model evaluation metrics (accuracy, F1, ROC-AUC, etc.).",
    )
    hyperparameters = models.JSONField(
        default=dict,
        blank=True,
        help_text="Hyperparameters used during training.",
    )
    feature_names = models.JSONField(
        default=list,
        blank=True,
        help_text="Ordered list of feature names expected by the model.",
    )
    trained_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="trained_models",
    )
    training_started_at = models.DateTimeField(null=True, blank=True)
    training_completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "ml_models"
        unique_together = [("model_type", "dataset_name", "version")]
        indexes = [
            models.Index(fields=["status", "model_type"]),
            models.Index(fields=["dataset_name", "status"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} v{self.version} [{self.status}]"

    @property
    def is_active(self) -> bool:
        return self.status == ModelStatus.ACTIVE
