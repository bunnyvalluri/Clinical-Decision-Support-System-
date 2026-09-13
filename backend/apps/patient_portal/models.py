"""
Patient portal models — user self-service health records, appointments, messaging,
consent ledger, and patient-initiated risk assessments.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class RiskAssessmentStatus(models.TextChoices):
    PREPARING = "PREPARING", "Preparing Assessment"
    PROCESSING = "PROCESSING", "Inference in Progress"
    COMPLETED = "COMPLETED", "Completed"
    CLINICAL_REVIEW_REQUIRED = "CLINICAL_REVIEW_REQUIRED", "Clinical Review Required"
    FAILED = "FAILED", "Failed"


class VitalSource(models.TextChoices):
    USER_ENTERED = "USER_ENTERED", "Patient Self-Reported"
    DEVICE = "DEVICE", "Connected Medical Device"
    CLINICIAN = "CLINICIAN", "Clinical Staff Verified"
    IMPORTED = "IMPORTED", "EHR Import"


class AppointmentStatus(models.TextChoices):
    SCHEDULED = "SCHEDULED", "Scheduled"
    CONFIRMED = "CONFIRMED", "Confirmed"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class ConversationStatus(models.TextChoices):
    OPEN = "OPEN", "Active Discussion"
    RESOLVED = "RESOLVED", "Resolved"
    ARCHIVED = "ARCHIVED", "Archived"


class ConsentType(models.TextChoices):
    AI_DECISION_SUPPORT = "AI_DECISION_SUPPORT", "AI Clinical Decision Support"
    DATA_SHARING = "DATA_SHARING", "Clinical Data Exchange"
    SMS_NOTIFICATIONS = "SMS_NOTIFICATIONS", "SMS & Real-time Alerts"
    TELEHEALTH = "TELEHEALTH", "Telehealth Audio/Video Encounters"


class TaskType(models.TextChoices):
    LOG_VITALS = "LOG_VITALS", "Log Daily Vitals"
    QUESTIONNAIRE = "QUESTIONNAIRE", "Health Questionnaire"
    MEDICATION_CONFIRM = "MEDICATION_CONFIRM", "Medication Confirmation"
    APPOINTMENT_PREP = "APPOINTMENT_PREP", "Appointment Preparation"


class TaskStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    COMPLETED = "COMPLETED", "Completed"


class UserRiskAssessment(models.Model):
    """
    Patient self-service risk assessment submission.
    Feeds patient measurements into approved clinical ML inference pipelines.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="user_assessments",
    )
    symptoms = models.JSONField(default=list, blank=True)
    chest_pain_type = models.CharField(max_length=50, default="ASYMPTOMATIC")
    resting_bp = models.IntegerField(null=True, blank=True)
    cholesterol = models.IntegerField(null=True, blank=True)
    fasting_blood_sugar = models.CharField(max_length=20, default="< 120 mg/dl")
    resting_ecg = models.CharField(max_length=50, default="Normal")
    max_heart_rate = models.IntegerField(null=True, blank=True)
    exercise_angina = models.CharField(max_length=20, default="No")
    st_depression = models.DecimalField(max_digits=4, decimal_places=2, default=0.0)
    
    status = models.CharField(
        max_length=40,
        choices=RiskAssessmentStatus.choices,
        default=RiskAssessmentStatus.PREPARING,
        db_index=True,
    )
    prediction = models.ForeignKey(
        "predictions.Prediction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patient_assessments",
    )
    patient_notes = models.TextField(blank=True)
    correlation_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "user_risk_assessments"
        ordering = ["-created_at"]


class UserVitalRecord(models.Model):
    """
    Physiological vital sign entry recorded directly by the patient or synced device.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="user_vitals",
    )
    systolic_bp = models.IntegerField(null=True, blank=True)
    diastolic_bp = models.IntegerField(null=True, blank=True)
    heart_rate = models.IntegerField(null=True, blank=True)
    spo2 = models.IntegerField(null=True, blank=True)
    blood_glucose = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    temperature_c = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    source = models.CharField(
        max_length=30,
        choices=VitalSource.choices,
        default=VitalSource.USER_ENTERED,
    )
    notes = models.TextField(blank=True)
    recorded_at = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_vital_records"
        ordering = ["-recorded_at"]


class Appointment(models.Model):
    """
    Clinical appointment between patient and attending provider.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    clinician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patient_appointments",
    )
    department = models.CharField(max_length=100, default="Cardiology Clinic")
    scheduled_time = models.DateTimeField(db_index=True)
    duration_minutes = models.IntegerField(default=30)
    status = models.CharField(
        max_length=30,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.SCHEDULED,
        db_index=True,
    )
    location_or_link = models.CharField(max_length=255, default="Suite 402 - Heart & Vascular Center")
    reason_for_visit = models.CharField(max_length=255, default="Cardiovascular Follow-up")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "patient_appointments"
        ordering = ["scheduled_time"]


class Conversation(models.Model):
    """
    Secure care-team communication thread.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="conversations",
    )
    assigned_clinician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clinician_conversations",
    )
    subject = models.CharField(max_length=200, default="General Clinical Inquiry")
    status = models.CharField(
        max_length=20,
        choices=ConversationStatus.choices,
        default=ConversationStatus.OPEN,
    )
    last_message_at = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "patient_conversations"
        ordering = ["-last_message_at"]


class Message(models.Model):
    """
    Message inside a care-team conversation thread.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    content = models.TextField()
    read_by_patient = models.BooleanField(default=False)
    read_by_clinician = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "patient_messages"
        ordering = ["created_at"]


class ConsentRecord(models.Model):
    """
    Immutable HIPAA consent ledger tracking opt-ins and telemetry sharing.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="consent_records",
    )
    consent_type = models.CharField(
        max_length=50,
        choices=ConsentType.choices,
        db_index=True,
    )
    is_granted = models.BooleanField(default=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "patient_consent_records"
        ordering = ["-created_at"]


class UserTask(models.Model):
    """
    Patient-assigned daily health tasks and reminders.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="portal_tasks",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    task_type = models.CharField(
        max_length=40,
        choices=TaskType.choices,
        default=TaskType.LOG_VITALS,
    )
    due_date = models.DateTimeField(db_index=True)
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING,
        db_index=True,
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "patient_portal_tasks"
        ordering = ["status", "due_date"]
