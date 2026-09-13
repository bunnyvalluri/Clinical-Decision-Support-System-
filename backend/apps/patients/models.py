"""
Patients models — normalized demographic and administrative patient entities.

Clinical measurements and vitals are intentionally isolated into the
apps.clinical module for strict separation of concerns.
"""
from django.db import models

from apps.core.models import SoftDeleteModel


class Gender(models.TextChoices):
    MALE = "MALE", "Male"
    FEMALE = "FEMALE", "Female"
    OTHER = "OTHER", "Other"
    UNKNOWN = "UNKNOWN", "Unknown"


class BloodGroup(models.TextChoices):
    A_POS = "A+", "A Positive"
    A_NEG = "A-", "A Negative"
    B_POS = "B+", "B Positive"
    B_NEG = "B-", "B Negative"
    AB_POS = "AB+", "AB Positive"
    AB_NEG = "AB-", "AB Negative"
    O_POS = "O+", "O Positive"
    O_NEG = "O-", "O Negative"
    UNKNOWN = "UNKNOWN", "Unknown"


class Patient(SoftDeleteModel):
    """
    Patient master demographic entity.

    Separated from physiological measurements and encounters. Uses soft deletion
    to ensure medical record audit compliance without accidental data loss.
    """

    mrn = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique Medical Record Number (e.g. MRN-2026-0001).",
    )
    first_name = models.CharField(max_length=100, db_index=True)
    last_name = models.CharField(max_length=100, db_index=True)
    date_of_birth = models.DateField(db_index=True)
    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        default=Gender.UNKNOWN,
    )
    blood_group = models.CharField(
        max_length=10,
        choices=BloodGroup.choices,
        default=BloodGroup.UNKNOWN,
        blank=True,
    )
    phone_number = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)

    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=30, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)

    # Care Team
    primary_physician = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_patients",
        help_text="Attending physician responsible for this patient.",
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Active hospital patient status.",
    )

    class Meta:
        db_table = "patients"
        verbose_name = "Patient"
        verbose_name_plural = "Patients"
        ordering = ["last_name", "first_name"]
        indexes = [
            models.Index(fields=["last_name", "first_name"]),
            models.Index(fields=["mrn"]),
            models.Index(fields=["date_of_birth"]),
            models.Index(fields=["is_active", "is_deleted"]),
            models.Index(fields=["primary_physician", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.mrn})"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def age(self) -> int | None:
        """Calculate age from date of birth."""
        if not self.date_of_birth:
            return None
        from datetime import date

        today = date.today()
        return (
            today.year
            - self.date_of_birth.year
            - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        )
