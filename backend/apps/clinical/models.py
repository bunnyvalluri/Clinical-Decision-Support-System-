"""
Clinical models — encounters, vital signs, and physiological measurements.
"""
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel, SoftDeleteModel


class EncounterType(models.TextChoices):
    ROUTINE = "ROUTINE", "Routine Checkup"
    OUTPATIENT = "OUTPATIENT", "Outpatient Clinic"
    INPATIENT = "INPATIENT", "Inpatient Ward"
    EMERGENCY = "EMERGENCY", "Emergency Department"
    ICU = "ICU", "Intensive Care Unit"


class ClinicalRecord(SoftDeleteModel):
    """
    Clinical measurement snapshot for a patient encounter.

    Captures physiological parameters, laboratory results, and observational data
    independent of demographic patient identifiers.
    """

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="clinical_records",
        help_text="Patient associated with this clinical record.",
    )
    recorded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recorded_clinical_records",
        help_text="Clinician who recorded or verified these vitals.",
    )
    recorded_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="Timestamp of observation measurement.",
    )
    encounter_type = models.CharField(
        max_length=50,
        choices=EncounterType.choices,
        default=EncounterType.OUTPATIENT,
        db_index=True,
    )

    # Cardiovascular & Hemodynamic Vitals
    systolic_bp = models.IntegerField(
        null=True,
        blank=True,
        help_text="Systolic blood pressure (mmHg).",
    )
    diastolic_bp = models.IntegerField(
        null=True,
        blank=True,
        help_text="Diastolic blood pressure (mmHg).",
    )
    heart_rate = models.IntegerField(
        null=True,
        blank=True,
        help_text="Pulse rate (beats per minute).",
    )
    respiratory_rate = models.IntegerField(
        null=True,
        blank=True,
        help_text="Breathing rate (breaths per minute).",
    )
    body_temperature = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Core body temperature (°C).",
    )
    oxygen_saturation = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Pulse oximetry SpO2 percentage (0-100%).",
    )

    # Metabolic & Lab Parameters
    glucose_level = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Blood glucose level (mg/dL).",
    )
    cholesterol_total = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Total cholesterol (mg/dL).",
    )
    bmi = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Body Mass Index (kg/m²).",
    )

    # Core Laboratory Biomarkers (Model-Supported)
    creatinine = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Serum creatinine level (mg/dL).",
    )
    sodium = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Serum sodium concentration (mmol/L or mEq/L).",
    )
    calcium = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Serum calcium concentration (mg/dL).",
    )
    lactic_acid = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Serum lactic acid / lactate concentration (mmol/L).",
    )

    # Narrative & Semistructured Lab Data
    symptoms = models.TextField(
        blank=True,
        help_text="Reported symptoms and clinical presentation.",
    )
    clinical_notes = models.TextField(
        blank=True,
        help_text="Attending physician notes and impressions.",
    )
    lab_results = models.JSONField(
        default=dict,
        blank=True,
        help_text="Comprehensive structured laboratory panel results.",
    )

    class Meta:
        db_table = "clinical_records"
        verbose_name = "Clinical Record"
        verbose_name_plural = "Clinical Records"
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["patient", "recorded_at"]),
            models.Index(fields=["recorded_at"]),
            models.Index(fields=["encounter_type", "recorded_at"]),
            models.Index(fields=["recorded_by", "recorded_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=(models.Q(systolic_bp__isnull=True) | models.Q(systolic_bp__gt=0)),
                name="check_systolic_bp_positive",
            ),
            models.CheckConstraint(
                check=(models.Q(diastolic_bp__isnull=True) | models.Q(diastolic_bp__gt=0)),
                name="check_diastolic_bp_positive",
            ),
            models.CheckConstraint(
                check=(models.Q(heart_rate__isnull=True) | models.Q(heart_rate__gt=0)),
                name="check_heart_rate_positive",
            ),
            models.CheckConstraint(
                check=(
                    models.Q(oxygen_saturation__isnull=True)
                    | (models.Q(oxygen_saturation__gte=0) & models.Q(oxygen_saturation__lte=100))
                ),
                name="check_oxygen_saturation_range",
            ),
            models.CheckConstraint(
                check=(models.Q(creatinine__isnull=True) | models.Q(creatinine__gte=0)),
                name="check_creatinine_non_negative",
            ),
            models.CheckConstraint(
                check=(models.Q(sodium__isnull=True) | models.Q(sodium__gte=0)),
                name="check_sodium_non_negative",
            ),
            models.CheckConstraint(
                check=(models.Q(calcium__isnull=True) | models.Q(calcium__gte=0)),
                name="check_calcium_non_negative",
            ),
            models.CheckConstraint(
                check=(models.Q(lactic_acid__isnull=True) | models.Q(lactic_acid__gte=0)),
                name="check_lactic_acid_non_negative",
            ),
        ]

    def __str__(self) -> str:
        return f"Encounter {self.encounter_type} - {self.patient.mrn} @ {self.recorded_at.strftime('%Y-%m-%d %H:%M')}"


class TriageState(models.TextChoices):
    WAITING = "WAITING", "Waiting for Triage"
    TRIAGE_IN_PROGRESS = "TRIAGE_IN_PROGRESS", "Triage in Progress"
    TRIAGED = "TRIAGED", "Triaged / Bed Assigned"
    ESCALATED = "ESCALATED", "Escalated to Physician"
    COMPLETED = "COMPLETED", "Triage Completed"


class TriageRecord(SoftDeleteModel):
    """
    Emergency and ward triage queue record managed by nursing staff.
    """

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="triage_records",
        help_text="Patient undergoing triage.",
    )
    nurse = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nurse_triage_records",
        help_text="Triage nurse managing patient intake.",
    )
    state = models.CharField(
        max_length=30,
        choices=TriageState.choices,
        default=TriageState.WAITING,
        db_index=True,
    )
    acuity_level = models.IntegerField(
        default=3,
        help_text="Emergency Severity Index: 1 (Resuscitation) to 5 (Non-urgent).",
    )
    chief_complaint = models.CharField(max_length=255, blank=True)
    bed_assignment = models.CharField(max_length=50, blank=True)
    arrival_time = models.DateTimeField(default=timezone.now, db_index=True)
    reassessment_due = models.DateTimeField(null=True, blank=True)
    triage_notes = models.TextField(blank=True)

    class Meta:
        db_table = "triage_records"
        verbose_name = "Triage Record"
        verbose_name_plural = "Triage Records"
        ordering = ["acuity_level", "arrival_time"]

    def __str__(self) -> str:
        return f"Triage {self.patient.mrn} [{self.state}] ESI: {self.acuity_level}"


class TaskType(models.TextChoices):
    VITALS_CHECK = "VITALS_CHECK", "Vital Signs Check"
    MEDICATION_ADMIN = "MEDICATION_ADMIN", "Medication Administration"
    TRIAGE_REASSESS = "TRIAGE_REASSESS", "Triage Reassessment"
    LAB_DRAW = "LAB_DRAW", "Stat Laboratory Draw"
    DISCHARGE_PREP = "DISCHARGE_PREP", "Discharge Preparation"


class TaskPriority(models.TextChoices):
    ROUTINE = "ROUTINE", "Routine"
    URGENT = "URGENT", "Urgent"
    STAT = "STAT", "Emergency / STAT"


class TaskStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    COMPLETED = "COMPLETED", "Completed"


class ClinicalTask(SoftDeleteModel):
    """
    Bedside clinical task assignment for nursing staff.
    """

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="clinical_tasks",
    )
    assigned_to = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_tasks",
    )
    title = models.CharField(max_length=200)
    task_type = models.CharField(
        max_length=30,
        choices=TaskType.choices,
        default=TaskType.VITALS_CHECK,
    )
    priority = models.CharField(
        max_length=20,
        choices=TaskPriority.choices,
        default=TaskPriority.ROUTINE,
    )
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING,
        db_index=True,
    )
    due_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "clinical_tasks"
        verbose_name = "Clinical Task"
        verbose_name_plural = "Clinical Tasks"
        ordering = ["due_at", "-created_at"]

    def __str__(self) -> str:
        return f"{self.title} [{self.status}] -> {self.patient.mrn}"


class EscalationPriority(models.TextChoices):
    HIGH = "HIGH", "High Priority"
    CRITICAL = "CRITICAL", "Critical / STAT Alert"


class EscalationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Review"
    ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged by Doctor"
    RESOLVED = "RESOLVED", "Resolved"


class Escalation(SoftDeleteModel):
    """
    Direct nurse-to-physician patient deterioration escalation.
    """

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="escalations",
    )
    escalated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="nurse_escalations",
    )
    assigned_doctor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="doctor_escalations",
    )
    prediction = models.ForeignKey(
        "predictions.Prediction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="escalations",
    )
    reason = models.TextField(help_text="Clinical justification for urgent escalation.")
    priority = models.CharField(
        max_length=20,
        choices=EscalationPriority.choices,
        default=EscalationPriority.HIGH,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=EscalationStatus.choices,
        default=EscalationStatus.PENDING,
        db_index=True,
    )
    doctor_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "clinical_escalations"
        verbose_name = "Clinical Escalation"
        verbose_name_plural = "Clinical Escalations"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Escalation for {self.patient.mrn} by {self.escalated_by.username} [{self.status}]"


class DataQualityIssueType(models.TextChoices):
    INVALID_VALUE = "INVALID_VALUE", "Physiologically Invalid Value"
    OUTLIER = "OUTLIER", "Statistical Outlier"
    MISSING_CRITICAL = "MISSING_CRITICAL", "Missing Critical Clinical Feature"
    UNIT_MISMATCH = "UNIT_MISMATCH", "Inconsistent Units"
    DUPLICATE = "DUPLICATE", "Duplicate Encounter Record"
    SCHEMA_MISMATCH = "SCHEMA_MISMATCH", "Schema Mismatch"
    DISTRIBUTION_DRIFT = "DISTRIBUTION_DRIFT", "Distribution Drift"


class DataQualitySeverity(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    CRITICAL = "CRITICAL", "Critical"


class DataQualityStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    INVESTIGATING = "INVESTIGATING", "Investigating"
    RESOLVED = "RESOLVED", "Resolved"
    DISMISSED = "DISMISSED", "Dismissed"


class DataQualityIssue(SoftDeleteModel):
    """
    Granular clinical data quality anomaly record.
    Tracks missing values, outliers, invalid physiological bounds, and schema drift.
    """

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="data_quality_issues",
        help_text="Patient record linked to this data anomaly.",
    )
    clinical_record = models.ForeignKey(
        ClinicalRecord,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="data_quality_issues",
        help_text="Clinical record containing anomalous measurement.",
    )
    issue_type = models.CharField(
        max_length=50,
        choices=DataQualityIssueType.choices,
        default=DataQualityIssueType.INVALID_VALUE,
        db_index=True,
    )
    severity = models.CharField(
        max_length=20,
        choices=DataQualitySeverity.choices,
        default=DataQualitySeverity.MEDIUM,
        db_index=True,
    )
    feature_name = models.CharField(max_length=100, db_index=True)
    observed_value = models.TextField(blank=True)
    expected_range = models.CharField(max_length=100, blank=True)
    source = models.CharField(max_length=100, default="ClinicalRecord")
    status = models.CharField(
        max_length=30,
        choices=DataQualityStatus.choices,
        default=DataQualityStatus.OPEN,
        db_index=True,
    )
    assigned_to = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_data_issues",
        help_text="Clinician or informaticist assigned to audit/remediate the issue.",
    )
    resolution = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "clinical_data_quality_issues"
        verbose_name = "Clinical Data Quality Issue"
        verbose_name_plural = "Clinical Data Quality Issues"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "severity"]),
            models.Index(fields=["patient", "status"]),
        ]

    def __str__(self) -> str:
        return f"DataQualityIssue [{self.severity}] {self.feature_name}: {self.issue_type} ({self.status})"


class ClinicalFeatureDefinition(SoftDeleteModel):
    """
    Configurable clinical feature definition schema.
    Controls clinical input validation, bounds, units, and preprocessing strategies.
    """

    class DataType(models.TextChoices):
        NUMERICAL = "NUMERICAL", "Numerical / Continuous"
        CATEGORICAL = "CATEGORICAL", "Categorical / Discrete"
        BOOLEAN = "BOOLEAN", "Boolean Flag"

    class PreprocessingStrategy(models.TextChoices):
        STANDARD_SCALER = "STANDARD_SCALER", "Standard Scaler + Median Impute"
        ROBUST_SCALER = "ROBUST_SCALER", "Robust Scaler + Median Impute"
        ONE_HOT = "ONE_HOT", "One-Hot Encoding"
        PASS_THROUGH = "PASS_THROUGH", "Pass Through"

    class ClinicalCategory(models.TextChoices):
        DEMOGRAPHIC = "DEMOGRAPHIC", "Demographic"
        CARDIOVASCULAR = "CARDIOVASCULAR", "Cardiovascular"
        RESPIRATORY = "RESPIRATORY", "Respiratory"
        VITAL = "VITAL", "Vital Signs"
        METABOLIC = "METABOLIC", "Metabolic"
        ELECTROLYTE = "ELECTROLYTE", "Electrolytes"
        RENAL = "RENAL", "Renal Function"
        ENCOUNTER = "ENCOUNTER", "Encounter Details"

    name = models.CharField(max_length=100, unique=True, db_index=True)
    display_name = models.CharField(max_length=150)
    data_type = models.CharField(max_length=30, choices=DataType.choices, default=DataType.NUMERICAL)
    unit = models.CharField(max_length=50, blank=True)
    required = models.BooleanField(default=True)
    min_value = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    max_value = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    allowed_values = models.JSONField(default=list, blank=True)
    preprocessing_strategy = models.CharField(
        max_length=50,
        choices=PreprocessingStrategy.choices,
        default=PreprocessingStrategy.STANDARD_SCALER,
    )
    clinical_category = models.CharField(
        max_length=50,
        choices=ClinicalCategory.choices,
        default=ClinicalCategory.VITAL,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    version = models.CharField(max_length=50, default="1.0.0")

    class Meta:
        db_table = "clinical_feature_definitions"
        verbose_name = "Clinical Feature Definition"
        verbose_name_plural = "Clinical Feature Definitions"
        ordering = ["clinical_category", "name"]

    def __str__(self) -> str:
        return f"{self.display_name} ({self.name}) [{self.data_type}]"


class ClinicalRule(SoftDeleteModel):
    """
    Deterministic clinical scoring and alert rules (e.g. qSOFA, NEWS2, acute bounds).
    Operates strictly deterministically with human review gates.
    """

    class Severity(models.TextChoices):
        ROUTINE = "ROUTINE", "Routine Observation"
        MONITOR = "MONITOR", "Increased Monitoring"
        URGENT = "URGENT", "Urgent Clinical Review"
        CRITICAL = "CRITICAL", "Critical Emergency / STAT Alert"

    class ActionType(models.TextChoices):
        BEDSIDE_EVALUATION = "BEDSIDE_EVALUATION", "Immediate Bedside Evaluation"
        ICU_TRANSFER = "ICU_TRANSFER", "ICU / Specialist Consult"
        REASSESS_1H = "REASSESS_1H", "Serial Reassessment in 1 Hour"
        SEPSIS_BUNDLE = "SEPSIS_BUNDLE", "Initiate Sepsis Resuscitation Bundle"
        NOTIFY_DOCTOR = "NOTIFY_DOCTOR", "Notify Attending Physician"

    rule_name = models.CharField(max_length=150, unique=True, db_index=True)
    rule_id = models.CharField(max_length=64, blank=True, db_index=True, help_text="Deterministic rule code (e.g. RULE-QSOFA-01).")
    description = models.TextField(blank=True)
    condition_expression = models.JSONField(default=dict, help_text="Structured rule predicates.")
    severity = models.CharField(max_length=30, choices=Severity.choices, default=Severity.URGENT)
    action_type = models.CharField(max_length=50, choices=ActionType.choices, default=ActionType.BEDSIDE_EVALUATION)
    version = models.CharField(max_length=50, default="1.0.0")
    effective_from = models.DateTimeField(default=timezone.now)
    effective_to = models.DateTimeField(null=True, blank=True)
    approval_status = models.CharField(max_length=30, default="APPROVED")
    verified_source = models.CharField(max_length=255, blank=True, help_text="Verified clinical guideline/protocol source.")

    class Meta:
        db_table = "clinical_rules"
        verbose_name = "Clinical Rule"
        verbose_name_plural = "Clinical Rules"
        ordering = ["-severity", "rule_name"]

    def __str__(self) -> str:
        return f"Rule: {self.rule_name} [{self.severity}]"


class EvidenceSource(SoftDeleteModel):
    """
    Approved clinical evidence, publication, or consensus guideline source.
    """

    class TrustLevel(models.TextChoices):
        OFFICIAL_CONSENSUS = "OFFICIAL_CONSENSUS", "Official Consensus (AHA, ACC, WHO, NICE)"
        PEER_REVIEWED = "PEER_REVIEWED", "Peer-Reviewed Literature"
        INSTITUTIONAL = "INSTITUTIONAL", "Hospital Institutional Protocol"
        REGULATORY = "REGULATORY", "Regulatory Agency / FDA"

    class VerificationStatus(models.TextChoices):
        VERIFIED = "VERIFIED", "Verified Source"
        SOURCE_NOT_VERIFIED = "SOURCE_NOT_VERIFIED", "SOURCE NOT VERIFIED"

    name = models.CharField(max_length=255, unique=True, db_index=True)
    organization = models.CharField(max_length=255, db_index=True)
    source_url = models.URLField(max_length=512, blank=True)
    publisher = models.CharField(max_length=255, blank=True)
    publication_date = models.DateField(null=True, blank=True)
    retrieved_date = models.DateField(default=timezone.now)
    trust_level = models.CharField(
        max_length=32,
        choices=TrustLevel.choices,
        default=TrustLevel.OFFICIAL_CONSENSUS,
    )
    jurisdiction = models.CharField(max_length=100, default="GLOBAL")
    specialty = models.CharField(max_length=100, default="GENERAL_MEDICINE", db_index=True)
    is_verified = models.BooleanField(default=True, db_index=True)
    verification_status = models.CharField(
        max_length=32,
        choices=VerificationStatus.choices,
        default=VerificationStatus.VERIFIED,
    )

    class Meta:
        db_table = "evidence_sources"
        verbose_name = "Evidence Source"
        verbose_name_plural = "Evidence Sources"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.organization}) [{self.verification_status}]"


class EvidenceReference(SoftDeleteModel):
    """
    Specific reference/citation linked to clinical knowledge or decision rules.
    """

    class EvidenceLevel(models.TextChoices):
        LEVEL_A = "LEVEL_A", "Level A: High-quality randomized controlled trials"
        LEVEL_B = "LEVEL_B", "Level B: Well-designed non-randomized / observational studies"
        LEVEL_C = "LEVEL_C", "Level C: Consensus opinion of experts / clinical standard"
        EXPERT_OPINION = "EXPERT_OPINION", "Expert Opinion / Institutional Guideline"

    source = models.ForeignKey(
        EvidenceSource,
        on_delete=models.CASCADE,
        related_name="references",
    )
    citation_text = models.TextField(help_text="Standard medical citation text (e.g. NLM / Vancouver format).")
    doi_or_url = models.CharField(max_length=512, blank=True)
    evidence_level = models.CharField(
        max_length=32,
        choices=EvidenceLevel.choices,
        default=EvidenceLevel.LEVEL_A,
    )
    recommendation_grade = models.CharField(max_length=50, blank=True, default="CLASS_I")

    class Meta:
        db_table = "evidence_references"
        verbose_name = "Evidence Reference"
        verbose_name_plural = "Evidence References"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Ref: {self.citation_text[:80]}... [{self.evidence_level}]"


class ClinicalKnowledgeDocument(SoftDeleteModel):
    """
    Authoritative clinical knowledge document, guideline, or institutional protocol.
    Guarantees that unapproved guidelines never appear as active clinical recommendations.
    """

    class DocumentType(models.TextChoices):
        GUIDELINE = "GUIDELINE", "Clinical Practice Guideline"
        INSTITUTIONAL_PROTOCOL = "INSTITUTIONAL_PROTOCOL", "Institutional Protocol"
        DECISION_RULE = "DECISION_RULE", "Deterministic Decision Rule"
        CONSENSUS_STATEMENT = "CONSENSUS_STATEMENT", "Consensus Statement"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        APPROVED = "APPROVED", "Approved"
        PUBLISHED = "PUBLISHED", "Published"
        DEPRECATED = "DEPRECATED", "Deprecated"
        ARCHIVED = "ARCHIVED", "Archived"
        REJECTED = "REJECTED", "Rejected"

    document_id = models.CharField(max_length=64, unique=True, db_index=True)
    title = models.CharField(max_length=512)
    document_type = models.CharField(
        max_length=64,
        choices=DocumentType.choices,
        default=DocumentType.GUIDELINE,
        db_index=True,
    )
    organization = models.CharField(max_length=256, db_index=True)
    jurisdiction = models.CharField(max_length=100, default="GLOBAL")
    specialty = models.CharField(max_length=100, default="GENERAL_MEDICINE", db_index=True)
    summary = models.TextField(blank=True)
    content = models.TextField()
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.APPROVED,
        db_index=True,
    )
    current_version = models.CharField(max_length=32, default="1.0.0")
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_clinical_knowledge",
    )
    reviewer = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_clinical_knowledge",
    )
    effective_date = models.DateField(default=timezone.now, db_index=True)
    review_date = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Scheduled review date for stale-knowledge detection.",
    )
    evidence_source = models.ForeignKey(
        EvidenceSource,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="knowledge_documents",
    )
    evidence_references = models.ManyToManyField(
        EvidenceReference,
        blank=True,
        related_name="knowledge_documents",
    )
    provenance = models.JSONField(
        default=dict,
        blank=True,
        help_text="Immutable provenance metadata (retrieval date, source hash, publisher, verification).",
    )

    class Meta:
        db_table = "clinical_knowledge_documents"
        verbose_name = "Clinical Knowledge Document"
        verbose_name_plural = "Clinical Knowledge Documents"
        ordering = ["-effective_date", "document_id"]
        indexes = [
            models.Index(fields=["status", "is_active"]),
            models.Index(fields=["document_type", "specialty"]),
        ]

    def __str__(self) -> str:
        return f"[{self.document_id}] {self.title[:60]} (v{self.current_version}) [{self.status}]"

    @property
    def is_stale(self) -> bool:
        """True if the review date has arrived or passed."""
        if self.review_date and self.review_date <= timezone.now().date():
            return True
        return False


class ClinicalKnowledgeVersion(SoftDeleteModel):
    """
    Immutable version snapshot for every modification of a clinical knowledge document.
    """

    document = models.ForeignKey(
        ClinicalKnowledgeDocument,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version = models.CharField(max_length=32, db_index=True)
    previous_version = models.CharField(max_length=32, blank=True)
    status = models.CharField(
        max_length=32,
        choices=ClinicalKnowledgeDocument.Status.choices,
        default=ClinicalKnowledgeDocument.Status.APPROVED,
    )
    content_snapshot = models.TextField()
    changed_fields = models.JSONField(default=list, blank=True)
    change_reason = models.TextField(blank=True)
    reviewer = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_knowledge_versions",
    )
    approved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_knowledge_versions",
    )
    approval_event = models.CharField(max_length=128, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    review_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "clinical_knowledge_versions"
        verbose_name = "Clinical Knowledge Version"
        verbose_name_plural = "Clinical Knowledge Versions"
        unique_together = ("document", "version")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.document.document_id} v{self.version} [{self.status}]"


class Guideline(ClinicalKnowledgeDocument):
    """
    Proxy model representing Clinical Guidelines specifically.
    """

    class Meta:
        proxy = True
        verbose_name = "Guideline"
        verbose_name_plural = "Guidelines"


class GuidelineVersion(ClinicalKnowledgeVersion):
    """
    Proxy model representing Guideline Versions specifically.
    """

    class Meta:
        proxy = True
        verbose_name = "Guideline Version"
        verbose_name_plural = "Guideline Versions"


class ClinicalRuleVersion(SoftDeleteModel):
    """
    Version history for deterministic clinical scoring and alert rules.
    """

    rule = models.ForeignKey(
        ClinicalRule,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version = models.CharField(max_length=50, db_index=True)
    previous_version = models.CharField(max_length=50, blank=True)
    condition_expression = models.JSONField(default=dict)
    severity = models.CharField(max_length=30)
    action_type = models.CharField(max_length=50)
    change_reason = models.TextField(blank=True)
    changed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="changed_rule_versions",
    )
    approved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_rule_versions",
    )
    effective_from = models.DateTimeField(default=timezone.now)
    effective_to = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "clinical_rule_versions"
        verbose_name = "Clinical Rule Version"
        verbose_name_plural = "Clinical Rule Versions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.rule.rule_name} v{self.version}"


class ClinicalAlert(SoftDeleteModel):
    """
    High-priority clinical alert generated by deterministic rules, ML thresholds, or data anomalies.
    """

    class Severity(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        MONITOR = "MONITOR", "Routine Monitoring"
        URGENT = "URGENT", "Urgent Clinical Review"
        CRITICAL = "CRITICAL", "Critical Emergency / STAT Alert"

    class Source(models.TextChoices):
        DETERMINISTIC_RULE = "DETERMINISTIC_RULE", "Deterministic Rule (qSOFA/NEWS2)"
        ML_PREDICTION = "ML_PREDICTION", "ML Risk Assessment"
        DATA_QUALITY = "DATA_QUALITY", "Clinical Data Quality Anomaly"
        STALE_KNOWLEDGE = "STALE_KNOWLEDGE", "Stale Clinical Knowledge Flag"
        SYSTEM_SAFETY = "SYSTEM_SAFETY", "AI Safety Gate Flag"

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="clinical_alerts",
    )
    alert_type = models.CharField(max_length=100, db_index=True)
    severity = models.CharField(
        max_length=30,
        choices=Severity.choices,
        default=Severity.URGENT,
        db_index=True,
    )
    source = models.CharField(
        max_length=50,
        choices=Source.choices,
        default=Source.DETERMINISTIC_RULE,
        db_index=True,
    )
    message = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    is_acknowledged = models.BooleanField(default=False, db_index=True)
    acknowledged_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acknowledged_alerts",
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    is_resolved = models.BooleanField(default=False, db_index=True)
    resolved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_alerts",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "clinical_alerts"
        verbose_name = "Clinical Alert"
        verbose_name_plural = "Clinical Alerts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["patient", "is_resolved"]),
            models.Index(fields=["severity", "is_acknowledged"]),
        ]

    def __str__(self) -> str:
        return f"Alert [{self.severity}] for {self.patient.mrn}: {self.alert_type}"


class PatientTimelineEvent(BaseModel):
    """
    Unified, chronological, and auditable clinical timeline event.
    Enforces Phase 3 controlled event taxonomy and role-based authorization scoping.
    """

    class EventType(models.TextChoices):
        # Controlled Phase 3 Taxonomy
        ENCOUNTER = "ENCOUNTER", "Clinical Encounter"
        OBSERVATION = "OBSERVATION", "Clinical Observation"
        VITAL = "VITAL", "Vital Signs Measurement"
        CONDITION = "CONDITION", "Medical Condition / Diagnosis"
        DIAGNOSTIC_REPORT = "DIAGNOSTIC_REPORT", "Diagnostic Lab / Imaging Report"
        MEDICATION = "MEDICATION", "Medication Administration / Order"
        FHIR_IMPORT = "FHIR_IMPORT", "FHIR Interoperability Import"
        FHIR_UPDATE = "FHIR_UPDATE", "FHIR Resource Update"
        RISK_PREDICTION = "RISK_PREDICTION", "ML Risk Level Prediction"
        PREDICTION_REVIEW = "PREDICTION_REVIEW", "Clinician Prediction Review"
        PREDICTION_OVERRIDE = "PREDICTION_OVERRIDE", "Clinician Prediction Override"
        CLINICAL_ALERT = "CLINICAL_ALERT", "Clinical Safety Alert"
        ESCALATION = "ESCALATION", "Clinical Deterioration Escalation"
        DATA_QUALITY_EVENT = "DATA_QUALITY_EVENT", "Clinical Data Quality Event"
        CONSENT_EVENT = "CONSENT_EVENT", "Patient Consent Event"
        CLINICAL_NOTE = "CLINICAL_NOTE", "Clinician Progress / Consultation Note"
        MODEL_EVENT = "MODEL_EVENT", "ML Model Lifecycle / Drift Event"

        # Compatibility Aliases for Earlier Prompts
        PATIENT_ADMISSION = "PATIENT_ADMISSION", "Patient Admission"
        VITAL_OBSERVATION = "VITAL_OBSERVATION", "Vital Signs Observation"
        LAB_RESULT = "LAB_RESULT", "Laboratory Result"
        CLINICAL_REVIEW = "CLINICAL_REVIEW", "Physician Clinical Review"
        NURSE_TRIAGE = "NURSE_TRIAGE", "Nursing Triage & Acuity"
        GUIDELINE_APPLIED = "GUIDELINE_APPLIED", "Guideline Applied"
        AI_INTERACTION = "AI_INTERACTION", "AI Decision Support Interaction"
        AUDIT_EVENT = "AUDIT_EVENT", "Clinical Audit Event"

    class AuthorizationScope(models.TextChoices):
        PUBLIC_PATIENT = "PUBLIC_PATIENT", "Public / Patient Portal Visible"
        CLINICAL_STAFF = "CLINICAL_STAFF", "Clinical Staff (Doctor / Nurse)"
        INFORMATICIST_ADMIN = "INFORMATICIST_ADMIN", "Medical Informaticist & Admin Only"

    class EventStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active / Validated"
        SUPERSEDED = "SUPERSEDED", "Superseded"
        DISMISSED = "DISMISSED", "Dismissed"
        REQUIRES_REVIEW = "REQUIRES_REVIEW", "Requires Review"

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="timeline_events",
    )
    event_type = models.CharField(
        max_length=64,
        choices=EventType.choices,
        db_index=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    actor = models.CharField(max_length=255, default="System")
    actor_user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="timeline_events",
    )
    source = models.CharField(max_length=100, default="ClinicalRecord")
    severity = models.CharField(max_length=32, default="NORMAL", db_index=True)
    status = models.CharField(
        max_length=32,
        choices=EventStatus.choices,
        default=EventStatus.ACTIVE,
        db_index=True,
    )
    authorization_scope = models.CharField(
        max_length=32,
        choices=AuthorizationScope.choices,
        default=AuthorizationScope.CLINICAL_STAFF,
        db_index=True,
    )
    provenance = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    correlation_id = models.CharField(max_length=64, blank=True, db_index=True)

    class Meta:
        db_table = "patient_timeline_events"
        verbose_name = "Patient Timeline Event"
        verbose_name_plural = "Patient Timeline Events"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["patient", "timestamp"]),
            models.Index(fields=["patient", "event_type"]),
            models.Index(fields=["authorization_scope", "status"]),
        ]

    def __str__(self) -> str:
        return f"Timeline [{self.event_type}] for {self.patient.mrn} @ {self.timestamp.isoformat()}"


class AISafetyEvent(BaseModel):
    """
    Immutable audit record for every AI safety gate validation and intervention.
    """

    class EventType(models.TextChoices):
        INPUT_VALIDATION = "INPUT_VALIDATION", "Input Validation"
        PHI_REDACTION = "PHI_REDACTION", "PHI / PII Redaction"
        PROMPT_INJECTION_BLOCKED = "PROMPT_INJECTION_BLOCKED", "Prompt Injection Attempt Blocked"
        RETRIEVAL_VALIDATION = "RETRIEVAL_VALIDATION", "RAG Retrieval Trust Validation"
        OUTPUT_SUPPRESSED = "OUTPUT_SUPPRESSED", "Output Suppressed by Guardrail"
        AUTONOMOUS_DIAGNOSIS_BLOCKED = "AUTONOMOUS_DIAGNOSIS_BLOCKED", "Autonomous Diagnosis / Prescription Blocked"
        UNCERTAINTY_FLAG = "UNCERTAINTY_FLAG", "Predictive / Knowledge Uncertainty Flag"
        KILL_SWITCH_TRIGGERED = "KILL_SWITCH_TRIGGERED", "Emergency Kill Switch Enforced"

    class ActionTaken(models.TextChoices):
        ALLOW = "ALLOW", "Allow"
        FLAG_REVIEW = "FLAG_REVIEW", "Flag for Clinician Review"
        BLOCK = "BLOCK", "Block Request"
        SUPPRESS = "SUPPRESS", "Suppress Output"

    correlation_id = models.CharField(max_length=64, db_index=True)
    event_type = models.CharField(
        max_length=64,
        choices=EventType.choices,
        db_index=True,
    )
    severity = models.CharField(max_length=32, default="LOW", db_index=True)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="safety_events",
    )
    user_role = models.CharField(max_length=32, default="USER")
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="safety_events",
    )
    details = models.JSONField(default=dict, blank=True)
    action_taken = models.CharField(
        max_length=32,
        choices=ActionTaken.choices,
        default=ActionTaken.ALLOW,
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "ai_safety_events"
        verbose_name = "AI Safety Event"
        verbose_name_plural = "AI Safety Events"
        ordering = ["-timestamp"]

    def __str__(self) -> str:
        return f"AISafetyEvent [{self.event_type}] ({self.action_taken}) - {self.correlation_id}"



