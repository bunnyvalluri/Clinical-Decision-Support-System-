"""
Clinical models — encounters, vital signs, and physiological measurements.
"""
from django.db import models
from django.utils import timezone

from apps.core.models import SoftDeleteModel


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

