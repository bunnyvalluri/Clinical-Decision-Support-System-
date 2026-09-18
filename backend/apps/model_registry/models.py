"""
Model registry models — versioned machine learning model artifacts, metadata, and lifecycle governance.
Enforces strict 13-state model deployment lifecycles, cryptographic SHA-256 artifact integrity,
immutable audit trails, and Neon PostgreSQL authoritative source of truth.
"""
from django.db import models, transaction
from django.utils import timezone

from apps.core.models import AuditLog, BaseModel


class ModelStatus(models.TextChoices):
    # 13 Lifecycle States (Prompt 30 requirement)
    DRAFT = "DRAFT", "Draft"
    TRAINING = "TRAINING", "Training"
    EVALUATING = "EVALUATING", "Evaluating"
    VALIDATION_FAILED = "VALIDATION_FAILED", "Validation Failed"
    PENDING_REVIEW = "PENDING_REVIEW", "Pending Review"
    APPROVED = "APPROVED", "Approved"
    STAGED = "STAGED", "Staged"
    CANARY = "CANARY", "Canary"
    PRODUCTION = "PRODUCTION", "Production"
    DEPRECATED = "DEPRECATED", "Deprecated"
    ROLLED_BACK = "ROLLED_BACK", "Rolled Back"
    REJECTED = "REJECTED", "Rejected"
    ARCHIVED = "ARCHIVED", "Archived"

    # Compatibility Aliases
    ACTIVE = "ACTIVE", "Active (Production)"
    CANDIDATE = "CANDIDATE", "Candidate"
    STAGING = "STAGING", "Staging"
    RETIRED = "RETIRED", "Retired"
    FAILED = "FAILED", "Failed"


class ModelVersion(BaseModel):
    """
    Registry of trained machine learning model versions.

    Tracks algorithmic architecture, evaluation metrics, serialised artifact
    pointers, SHA-256 cryptographic checksums, and training dataset provenance.
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
        default=ModelStatus.DRAFT,
        db_index=True,
        help_text="Deployment lifecycle status.",
    )
    artifact_location = models.CharField(
        max_length=500,
        help_text="Persistent storage URI or filesystem artifact path.",
    )
    checksum = models.CharField(
        max_length=64,
        blank=True,
        default="",
        help_text="Cryptographic SHA-256 artifact hash for integrity verification.",
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
        return self.status in (ModelStatus.ACTIVE, ModelStatus.PRODUCTION)

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
            active_models = ModelVersion.objects.select_for_update().filter(
                model_name=self.model_name,
                status__in=[ModelStatus.ACTIVE, ModelStatus.PRODUCTION],
            ).exclude(pk=self.pk)

            prior_versions = list(active_models.values_list("version", flat=True))

            active_models.update(
                status=ModelStatus.ARCHIVED,
                retired_at=now,
            )

            self.status = ModelStatus.PRODUCTION
            self.activated_at = now
            self.activated_by = activated_by
            self.retired_at = None
            self.save(update_fields=["status", "activated_at", "activated_by", "retired_at", "updated_at"])

            try:
                AuditLog.objects.create(
                    user=activated_by,
                    action=AuditLog.Action.UPDATE,
                    resource_type="ModelVersion",
                    resource_id=str(self.id),
                    description=f"Promoted {self.model_name} v{self.version} to PRODUCTION. Replaced: {prior_versions or 'None'}. Reason: {reason}",
                    metadata={
                        "model_name": self.model_name,
                        "version": self.version,
                        "prior_active_versions": prior_versions,
                        "reason": reason,
                    },
                )
            except Exception:
                pass

        try:
            from services.model_loader import ModelLoaderService
            ModelLoaderService.invalidate_cache(self.model_name)
        except Exception:
            pass

    def rollback(self, to_version: str, user=None, reason: str = "Rollback to prior version") -> "ModelVersion":
        """Rollback from current active model to a specified previous model version."""
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


class DatasetVersion(BaseModel):
    """
    Versioned clinical datasets used for model training and benchmark evaluations.
    """
    dataset_identifier = models.CharField(max_length=150, unique=True, db_index=True)
    version = models.CharField(max_length=50, default="1.0.0")
    source = models.CharField(max_length=200, default="Inpatient EHR Cohort")
    sha256_hash = models.CharField(max_length=64, help_text="SHA-256 fingerprint of dataset contents.")
    sample_count = models.PositiveIntegerField(default=0)
    feature_count = models.PositiveIntegerField(default=14)
    approval_status = models.CharField(max_length=30, default="APPROVED")
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = "dataset_versions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.dataset_identifier} (v{self.version})"


class ModelEvaluation(BaseModel):
    """
    Audited evaluation runs comparing candidate models against validation cohorts.
    """
    model_version = models.ForeignKey(ModelVersion, on_delete=models.CASCADE, related_name="evaluations")
    dataset_version = models.ForeignKey(DatasetVersion, on_delete=models.SET_NULL, null=True, blank=True)
    metrics = models.JSONField(default=dict)
    fairness_metrics = models.JSONField(default=dict)
    brier_score = models.DecimalField(max_digits=6, decimal_places=5, null=True, blank=True)
    passed_safety_gates = models.BooleanField(default=True)
    evaluated_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = "model_evaluations"
        ordering = ["-created_at"]


class ModelApproval(BaseModel):
    """
    Human clinician sign-off records required prior to production promotion.
    """
    model_version = models.ForeignKey(ModelVersion, on_delete=models.CASCADE, related_name="approvals")
    approved_by = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    role = models.CharField(max_length=50, default="Medical Informaticist")
    status = models.CharField(max_length=30, default="APPROVED")
    clinical_rationale = models.TextField()

    class Meta:
        db_table = "model_approvals"
        ordering = ["-created_at"]


class ModelDeployment(BaseModel):
    """
    Deployment history tracking staging, canary, and production transitions.
    """
    model_version = models.ForeignKey(ModelVersion, on_delete=models.CASCADE, related_name="deployments")
    stage = models.CharField(max_length=30, default="PRODUCTION")
    traffic_percentage = models.PositiveIntegerField(default=100)
    deployed_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=30, default="ACTIVE")

    class Meta:
        db_table = "model_deployments"
        ordering = ["-created_at"]


class ModelRollback(BaseModel):
    """
    Audit log of emergency or scheduled model rollbacks.
    """
    previous_model = models.ForeignKey(ModelVersion, on_delete=models.CASCADE, related_name="rollbacks_from")
    target_model = models.ForeignKey(ModelVersion, on_delete=models.CASCADE, related_name="rollbacks_to")
    reason = models.TextField()
    operator = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = "model_rollbacks"
        ordering = ["-created_at"]


class DataQualityReport(BaseModel):
    """
    Periodic data quality audits recording missingness, anomalies, and schema validation.
    """
    dataset_identifier = models.CharField(max_length=150, default="clinical_risk_v1")
    total_records = models.PositiveIntegerField(default=0)
    integrity_score = models.DecimalField(max_digits=5, decimal_places=2, default=99.0)
    missingness_summary = models.JSONField(default=dict)
    passed_quality_gate = models.BooleanField(default=True)

    class Meta:
        db_table = "data_quality_reports"
        ordering = ["-created_at"]


class DriftStatus(models.TextChoices):
    NORMAL = "NORMAL", "Normal (No Drift)"
    WARNING = "WARNING", "Warning (Moderate Distribution Shift)"
    CRITICAL = "CRITICAL", "Critical (Significant Drift Detected)"


class DriftReport(BaseModel):
    """
    Periodic feature, prediction, and calibration drift evaluations.
    """
    model_version = models.ForeignKey(
        ModelVersion,
        on_delete=models.CASCADE,
        related_name="drift_reports",
    )
    evaluation_timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=DriftStatus.choices,
        default=DriftStatus.NORMAL,
        db_index=True,
    )
    feature_drift_scores = models.JSONField(
        default=dict,
        help_text="Feature-level PSI and KS-test statistics.",
    )
    prediction_drift_score = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=0.0,
    )
    features_drifted = models.JSONField(
        default=list,
        help_text="List of feature names that exceeded drift thresholds.",
    )
    summary = models.TextField(blank=True)
    evaluated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conducted_drift_reports",
    )

    class Meta:
        db_table = "model_drift_reports"
        ordering = ["-evaluation_timestamp"]


class FairnessEvaluation(BaseModel):
    """
    Audited fairness and subgroup parity evaluations across patient cohorts.
    """
    model_version = models.ForeignKey(
        ModelVersion,
        on_delete=models.CASCADE,
        related_name="fairness_evaluations",
    )
    subgroup_field = models.CharField(max_length=50, default="gender", db_index=True)
    subgroup_metrics = models.JSONField(
        default=dict,
        help_text="Per-subgroup accuracy, sensitivity, specificity, FPR, FNR, sample_size.",
    )
    disparate_impact_ratio = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
    )
    sample_size_warnings = models.JSONField(default=list)
    evaluated_at = models.DateTimeField(default=timezone.now, db_index=True)
    evaluated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conducted_fairness_evaluations",
    )

    class Meta:
        db_table = "model_fairness_evaluations"
        ordering = ["-evaluated_at"]


# =============================================================================
# KAGGLE DATASET INTELLIGENCE & GOVERNANCE MODELS (Prompt 56)
# =============================================================================

class DatasetLifecycleStatus(models.TextChoices):
    DISCOVERED = "DISCOVERED", "Discovered"
    METADATA_COLLECTED = "METADATA_COLLECTED", "Metadata Collected"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    VALIDATING = "VALIDATING", "Validating"
    VALIDATED = "VALIDATED", "Validated"
    APPROVED = "APPROVED", "Approved"
    INGESTING = "INGESTING", "Ingesting"
    INGESTED = "INGESTED", "Ingested"
    REJECTED = "REJECTED", "Rejected"
    FAILED = "FAILED", "Failed"
    DEPRECATED = "DEPRECATED", "Deprecated"
    ARCHIVED = "ARCHIVED", "Archived"


class ApprovalTier(models.TextChoices):
    PENDING = "PENDING", "Pending Review"
    REJECTED = "REJECTED", "Rejected"
    APPROVED_FOR_RESEARCH = "APPROVED_FOR_RESEARCH", "Approved for Research & Benchmarking"
    APPROVED_FOR_TRAINING = "APPROVED_FOR_TRAINING", "Approved for ML Model Training"
    APPROVED_FOR_PRODUCTION = "APPROVED_FOR_PRODUCTION", "Approved for Production Deployment"


class PrivacyClassification(models.TextChoices):
    PUBLIC = "PUBLIC", "Public / Open Data"
    SENSITIVE = "SENSITIVE", "Sensitive Non-PHI"
    HEALTH_DATA = "HEALTH_DATA", "Healthcare Observation Data"
    PHI = "PHI", "Protected Health Information (Blocked)"
    SYNTHETIC = "SYNTHETIC", "Synthetically Generated"
    DE_IDENTIFIED = "DE_IDENTIFIED", "De-Identified Clinical Cohort"
    UNKNOWN = "UNKNOWN", "Unclassified / Pending Scan"


class KaggleDataset(BaseModel):
    """
    Catalog of candidate and registered external Kaggle datasets.
    Kaggle is an external data provider; Neon PostgreSQL is the sole authoritative store.
    """
    kaggle_owner = models.CharField(max_length=150, db_index=True)
    kaggle_slug = models.CharField(max_length=200, db_index=True)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default="")
    dataset_url = models.URLField(max_length=500)
    version_number = models.PositiveIntegerField(default=1)
    version_identifier = models.CharField(max_length=100, blank=True, default="1.0.0")
    license_name = models.CharField(max_length=150, default="Unknown", db_index=True)
    license_url = models.URLField(max_length=500, blank=True, null=True)
    author = models.CharField(max_length=200, blank=True, default="")
    source = models.CharField(max_length=200, default="Kaggle Dataset API")
    size_bytes = models.BigIntegerField(default=0)
    file_count = models.PositiveIntegerField(default=1)
    discovered_at = models.DateTimeField(default=timezone.now, db_index=True)
    last_checked_at = models.DateTimeField(auto_now=True)

    status = models.CharField(
        max_length=30,
        choices=DatasetLifecycleStatus.choices,
        default=DatasetLifecycleStatus.DISCOVERED,
        db_index=True,
    )
    relevance_score = models.DecimalField(max_digits=4, decimal_places=3, default=0.500)
    quality_status = models.CharField(max_length=30, default="PENDING", db_index=True)
    clinical_suitability_status = models.CharField(max_length=30, default="PENDING", db_index=True)
    approval_status = models.CharField(
        max_length=35,
        choices=ApprovalTier.choices,
        default=ApprovalTier.PENDING,
        db_index=True,
    )
    tags = models.JSONField(default=list, blank=True)
    raw_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "kaggle_datasets"
        ordering = ["-discovered_at"]
        constraints = [
            models.UniqueConstraint(fields=["kaggle_owner", "kaggle_slug"], name="unique_kaggle_dataset_ref"),
        ]
        indexes = [
            models.Index(fields=["kaggle_owner", "kaggle_slug"]),
            models.Index(fields=["status", "approval_status"]),
        ]

    def __str__(self) -> str:
        return f"{self.kaggle_owner}/{self.kaggle_slug} [{self.status}]"


class KaggleDatasetVersion(BaseModel):
    """
    Immutable snapshots of downloaded and validated dataset versions.
    Tracks file hashes, schema fingerprints, row counts, and synthetic data attributes.
    """
    dataset = models.ForeignKey(KaggleDataset, on_delete=models.CASCADE, related_name="versions")
    version_identifier = models.CharField(max_length=50, default="1.0.0", db_index=True)
    version_number = models.PositiveIntegerField(default=1)
    download_timestamp = models.DateTimeField(default=timezone.now)
    dataset_hash = models.CharField(max_length=64, help_text="SHA-256 fingerprint of sanitized dataset.")
    schema_hash = models.CharField(max_length=64, blank=True, default="")
    row_count = models.PositiveIntegerField(default=0)
    column_count = models.PositiveIntegerField(default=0)
    license_name = models.CharField(max_length=150, default="Unknown")

    is_synthetic = models.BooleanField(default=False)
    synthetic_confidence = models.DecimalField(max_digits=4, decimal_places=3, default=0.0)
    synthetic_reason = models.TextField(blank=True, default="")

    raw_file_path = models.CharField(max_length=500, blank=True, default="")
    sanitized_file_path = models.CharField(max_length=500, blank=True, default="")
    storage_uri = models.CharField(max_length=500, blank=True, default="")

    split_strategy = models.CharField(max_length=100, default="PATIENT_LEVEL_STRATIFIED")
    split_seed = models.PositiveIntegerField(default=42)
    train_hash = models.CharField(max_length=64, blank=True, default="")
    val_hash = models.CharField(max_length=64, blank=True, default="")
    test_hash = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        db_table = "kaggle_dataset_versions"
        ordering = ["-version_number", "-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["dataset", "version_number"], name="unique_dataset_version_num"),
        ]

    def __str__(self) -> str:
        return f"{self.dataset.kaggle_slug} v{self.version_number} ({self.dataset_hash[:8]})"


class KaggleDatasetFile(BaseModel):
    """Manifest of individual files contained in a dataset version."""
    version = models.ForeignKey(KaggleDatasetVersion, on_delete=models.CASCADE, related_name="files")
    filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size_bytes = models.BigIntegerField(default=0)
    sha256_checksum = models.CharField(max_length=64)
    mime_type = models.CharField(max_length=100, default="text/csv")
    row_count = models.PositiveIntegerField(null=True, blank=True)
    column_count = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = "kaggle_dataset_files"


class DatasetLicenseReview(BaseModel):
    """Legal and compliance audit of dataset licensing terms and restrictions."""
    dataset = models.OneToOneField(KaggleDataset, on_delete=models.CASCADE, related_name="license_review")
    license_name = models.CharField(max_length=150)
    permissions = models.JSONField(default=list, blank=True)
    restrictions = models.JSONField(default=list, blank=True)
    attribution_required = models.BooleanField(default=False)
    redistribution_allowed = models.BooleanField(default=True)
    commercial_use_allowed = models.BooleanField(default=False)
    research_use_allowed = models.BooleanField(default=True)
    competition_rules = models.TextField(blank=True, default="")
    legal_review_status = models.CharField(max_length=30, default="PENDING", db_index=True)
    reviewer = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "dataset_license_reviews"


class DatasetQualityFinding(BaseModel):
    """Granular quality issues recorded by the DatasetQualityEngine."""
    dataset_version = models.ForeignKey(KaggleDatasetVersion, on_delete=models.CASCADE, related_name="quality_findings")
    feature_name = models.CharField(max_length=150, null=True, blank=True, db_index=True)
    issue_type = models.CharField(max_length=100, db_index=True)
    severity = models.CharField(max_length=20, default="WARNING", db_index=True)
    message = models.TextField()
    record_count = models.PositiveIntegerField(default=0)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "dataset_quality_findings"
        ordering = ["-created_at"]


class DatasetPrivacyAssessment(BaseModel):
    """Audited HIPAA Safe Harbor and PHI scanning assessment."""
    dataset_version = models.OneToOneField(KaggleDatasetVersion, on_delete=models.CASCADE, related_name="privacy_assessment")
    classification = models.CharField(
        max_length=30,
        choices=PrivacyClassification.choices,
        default=PrivacyClassification.UNKNOWN,
        db_index=True,
    )
    has_unredacted_phi = models.BooleanField(default=False)
    approval_gate = models.CharField(max_length=30, default="BLOCKED")
    direct_identifiers_found = models.JSONField(default=list, blank=True)
    assessed_at = models.DateTimeField(default=timezone.now)
    assessor = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    scan_summary = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "dataset_privacy_assessments"


class DatasetLeakageFinding(BaseModel):
    """Target leakage, post-outcome, and contamination findings."""
    dataset_version = models.ForeignKey(KaggleDatasetVersion, on_delete=models.CASCADE, related_name="leakage_findings")
    feature_name = models.CharField(max_length=150, db_index=True)
    leakage_type = models.CharField(max_length=100, db_index=True)
    severity = models.CharField(max_length=20, default="WARNING", db_index=True)
    evidence = models.TextField()
    recommendation = models.TextField()
    reviewer_status = models.CharField(max_length=30, default="PENDING")

    class Meta:
        db_table = "dataset_leakage_findings"


class DatasetClinicalValidation(BaseModel):
    """Physiological range and biological contradiction audit report."""
    dataset_version = models.OneToOneField(KaggleDatasetVersion, on_delete=models.CASCADE, related_name="clinical_validation")
    physiological_violations_count = models.PositiveIntegerField(default=0)
    biological_contradictions_count = models.PositiveIntegerField(default=0)
    has_blocking_violations = models.BooleanField(default=False)
    clinical_suitability_status = models.CharField(max_length=30, default="REVIEW_REQUIRED", db_index=True)
    range_findings = models.JSONField(default=list, blank=True)
    contradiction_findings = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "dataset_clinical_validations"


class DatasetFeatureDefinition(BaseModel):
    """Feature dictionary encoding semantic clinical meaning, ranges, and leakage tags."""
    dataset_version = models.ForeignKey(KaggleDatasetVersion, on_delete=models.CASCADE, related_name="features")
    name = models.CharField(max_length=150, db_index=True)
    data_type = models.CharField(max_length=50)
    physical_unit = models.CharField(max_length=50, blank=True, default="")
    min_value = models.FloatField(null=True, blank=True)
    max_value = models.FloatField(null=True, blank=True)
    missing_pct = models.FloatField(default=0.0)
    clinical_meaning = models.TextField(blank=True, default="")
    source_field = models.CharField(max_length=150, blank=True, default="")
    transformation_rule = models.CharField(max_length=255, blank=True, default="")
    leakage_status = models.CharField(max_length=30, default="SAFE")
    privacy_classification = models.CharField(max_length=30, default="PUBLIC")

    class Meta:
        db_table = "dataset_feature_definitions"


class DatasetLineage(BaseModel):
    """Complete provenance trace from external Kaggle source to clinical predictions."""
    dataset_version = models.OneToOneField(KaggleDatasetVersion, on_delete=models.CASCADE, related_name="lineage")
    source_url = models.URLField(max_length=500)
    raw_checksum = models.CharField(max_length=64)
    clean_checksum = models.CharField(max_length=64)
    feature_checksum = models.CharField(max_length=64, blank=True, default="")
    split_checksum = models.CharField(max_length=64, blank=True, default="")
    lineage_graph = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "dataset_lineages"


class DatasetValidationJob(BaseModel):
    """Audit tracking of Celery background validation and ingestion jobs."""
    dataset = models.ForeignKey(KaggleDataset, on_delete=models.CASCADE, related_name="validation_jobs")
    version = models.ForeignKey(KaggleDatasetVersion, on_delete=models.SET_NULL, null=True, blank=True)
    job_type = models.CharField(max_length=50, default="FULL_VALIDATION")
    status = models.CharField(max_length=30, default="QUEUED", db_index=True)
    progress_pct = models.PositiveIntegerField(default=0)
    celery_task_id = models.CharField(max_length=64, blank=True, default="")
    logs = models.JSONField(default=list, blank=True)
    error_message = models.TextField(blank=True, default="")
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dataset_validation_jobs"
        ordering = ["-started_at"]


class DatasetApproval(BaseModel):
    """Human informaticist/clinician sign-off record."""
    dataset = models.ForeignKey(KaggleDataset, on_delete=models.CASCADE, related_name="approvals")
    version = models.ForeignKey(KaggleDatasetVersion, on_delete=models.CASCADE, related_name="approvals")
    approval_tier = models.CharField(max_length=35, choices=ApprovalTier.choices, default=ApprovalTier.PENDING)
    clinical_rationale = models.TextField()
    intended_use = models.TextField(default="Offline benchmark evaluation and algorithmic research.")
    reviewer = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    approved_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "dataset_approvals"
        ordering = ["-approved_at"]


class TrainingRun(BaseModel):
    """
    Audited ML model training execution.
    Strict contract: DatasetVersion + FeatureSchema + Preprocessing + Algorithm + Hyperparams + Seed = TrainingRun.
    """
    dataset_version = models.ForeignKey(KaggleDatasetVersion, on_delete=models.CASCADE, related_name="training_runs")
    model_version = models.ForeignKey(ModelVersion, on_delete=models.SET_NULL, null=True, blank=True, related_name="kaggle_training_runs")
    algorithm = models.CharField(max_length=50, default="RandomForestClassifier")
    hyperparameters = models.JSONField(default=dict, blank=True)
    random_seed = models.PositiveIntegerField(default=42)
    status = models.CharField(max_length=30, default="QUEUED", db_index=True)
    metrics = models.JSONField(default=dict, blank=True)
    calibration_method = models.CharField(max_length=30, default="sigmoid")
    brier_score = models.DecimalField(max_digits=6, decimal_places=5, null=True, blank=True)
    shap_summary = models.JSONField(default=dict, blank=True)
    fairness_metrics = models.JSONField(default=dict, blank=True)
    artifact_path = models.CharField(max_length=500, blank=True, default="")
    artifact_checksum = models.CharField(max_length=64, blank=True, default="")
    git_commit_sha = models.CharField(max_length=40, blank=True, default="")
    celery_task_id = models.CharField(max_length=64, blank=True, default="")
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "kaggle_training_runs"
        ordering = ["-created_at"]


