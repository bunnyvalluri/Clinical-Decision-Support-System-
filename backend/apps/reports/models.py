"""
Reports models — generated clinical decision support summaries and documents.
"""
from django.db import models

from apps.core.models import BaseModel


class ReportType(models.TextChoices):
    RISK_ASSESSMENT = "RISK_ASSESSMENT", "Patient Risk Assessment Summary"
    DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY", "Discharge & Trend Summary"
    CLINICAL_AUDIT = "CLINICAL_AUDIT", "Clinical Department Audit"
    MODEL_PERFORMANCE = "MODEL_PERFORMANCE", "ML Model Accuracy Report"


class ReportFormat(models.TextChoices):
    PDF = "PDF", "PDF Document"
    CSV = "CSV", "CSV Spreadsheet"
    JSON = "JSON", "JSON Data Export"


class ReportStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"


class Report(BaseModel):
    """
    Generated clinical decision support report record.
    """

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.CASCADE,
        related_name="reports",
        help_text="Patient associated with this report.",
    )
    prediction = models.ForeignKey(
        "predictions.Prediction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
        help_text="Specific prediction evaluated in this report.",
    )
    generated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_reports",
        help_text="Staff member who generated or scheduled this report.",
    )
    report_type = models.CharField(
        max_length=50,
        choices=ReportType.choices,
        default=ReportType.RISK_ASSESSMENT,
    )
    format = models.CharField(
        max_length=10,
        choices=ReportFormat.choices,
        default=ReportFormat.PDF,
    )
    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.PENDING,
        db_index=True,
    )
    file_path = models.CharField(
        max_length=500,
        blank=True,
        help_text="Storage location of the compiled report file.",
    )
    file_size_bytes = models.IntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes.",
    )
    parameters = models.JSONField(
        default=dict,
        blank=True,
        help_text="Generation options and filter criteria.",
    )
    generated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "reports"
        verbose_name = "Report"
        verbose_name_plural = "Reports"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["patient", "created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Report {self.report_type} ({self.format}) - {self.patient.mrn} [{self.status}]"
