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
        ]

    def __str__(self) -> str:
        return f"Encounter {self.encounter_type} - {self.patient.mrn} @ {self.recorded_at.strftime('%Y-%m-%d %H:%M')}"
