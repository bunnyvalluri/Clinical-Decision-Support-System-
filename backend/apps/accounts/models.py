"""
Accounts models — custom User with role-based access control.

The User model is the AUTH_USER_MODEL for the entire project.
All other models that need to reference users should use
``settings.AUTH_USER_MODEL`` or ``get_user_model()``.
"""
import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    """
    Clinical role taxonomy.

    ADMIN      — System administrators with full access to users, roles, audit logs, models.
    CLINICIAN  — Physicians & clinicians who manage authorized patients, request predictions.
    STAFF      — Clinical staff who register patients and perform limited operations.
    PATIENT    — Patients who access strictly their own authorized records and predictions.
    """

    ADMIN = "ADMIN", "Administrator"
    CLINICIAN = "CLINICIAN", "Clinician"
    STAFF = "STAFF", "Staff"
    PATIENT = "PATIENT", "Patient"
    # Backwards compatibility aliases
    DOCTOR = "DOCTOR", "Doctor"
    NURSE = "NURSE", "Nurse"
    ANALYST = "ANALYST", "Analyst"


class Role(models.Model):
    """
    Normalized relational role model for clinical permissions and access management.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier (UUID v4).",
    )
    name = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Role name (e.g. ADMIN, DOCTOR, NURSE, ANALYST).",
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of clinical responsibilities and access level.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "roles"
        verbose_name = "Role"
        verbose_name_plural = "Roles"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    """
    Custom user model for BPY-CSE-2666.

    Replaces the integer primary key with a UUID and adds clinical
    role assignment and department metadata.

    NOTE: ``username`` is kept for compatibility with Django's admin
    and ``AbstractUser``; ``email`` is enforced as unique and is the
    primary authentication credential.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier (UUID v4).",
    )
    email = models.EmailField(
        unique=True,
        db_index=True,
        help_text="Email address — used as the login credential.",
    )
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.DOCTOR,
        db_index=True,
        help_text="Clinical role determining access permissions.",
    )
    role_obj = models.ForeignKey(
        Role,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_users",
        help_text="Normalized relational role foreign key.",
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        help_text="Contact phone number (optional).",
    )
    department = models.CharField(
        max_length=150,
        blank=True,
        help_text="Hospital department (e.g. Cardiology, ICU).",
    )
    profile_picture = models.ImageField(
        upload_to="profiles/",
        null=True,
        blank=True,
        help_text="Profile picture upload.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Designates whether this user account is active.",
    )
    is_email_verified = models.BooleanField(
        default=False,
        help_text="Designates whether this user has verified their email address.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )
    updated_at = models.DateTimeField(auto_now=True)

    # Use email as the login field
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        db_table = "accounts_user"
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=["email", "role"]),
            models.Index(fields=["role", "is_active"]),
        ]
        ordering = ["last_name", "first_name"]

    def __str__(self) -> str:
        return f"{self.get_full_name()} <{self.email}> [{self.role}]"

    @property
    def full_name(self) -> str:
        """Return the user's full name."""
        return self.get_full_name() or self.email

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_clinician(self) -> bool:
        return self.role in (UserRole.CLINICIAN, UserRole.DOCTOR)

    @property
    def is_staff_member(self) -> bool:
        return self.role in (UserRole.STAFF, UserRole.NURSE)

    @property
    def is_patient(self) -> bool:
        return self.role == UserRole.PATIENT

    @property
    def is_doctor(self) -> bool:
        return self.is_clinician

    @property
    def is_nurse(self) -> bool:
        return self.is_staff_member

    @property
    def is_analyst(self) -> bool:
        return self.role == UserRole.ANALYST

    @property
    def is_clinical_staff(self) -> bool:
        """True for roles that have direct clinical responsibilities."""
        return self.role in (UserRole.CLINICIAN, UserRole.DOCTOR, UserRole.STAFF, UserRole.NURSE)
