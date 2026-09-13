"""
Serializers for clinical reports and async task responses.
"""
from rest_framework import serializers

from apps.patients.models import Patient
from apps.predictions.models import Prediction
from apps.reports.models import Report, ReportFormat, ReportStatus, ReportType


class ReportCreateRequestSerializer(serializers.Serializer):
    """Payload for requesting asynchronous report compilation."""

    patient_id = serializers.UUIDField(required=True)
    prediction_id = serializers.UUIDField(required=False, allow_null=True)
    report_type = serializers.ChoiceField(
        choices=ReportType.choices,
        default=ReportType.RISK_ASSESSMENT,
    )
    format = serializers.ChoiceField(
        choices=ReportFormat.choices,
        default=ReportFormat.PDF,
    )
    parameters = serializers.JSONField(required=False, default=dict)

    def validate_patient_id(self, value):
        if not Patient.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Patient with id '{value}' does not exist.")
        return value

    def validate_prediction_id(self, value):
        if value and not Prediction.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Prediction with id '{value}' does not exist.")
        return value


class ReportSerializer(serializers.ModelSerializer):
    """Detailed report model serializer with download URL."""

    download_url = serializers.SerializerMethodField()
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "patient",
            "patient_mrn",
            "prediction",
            "generated_by",
            "report_type",
            "format",
            "status",
            "file_path",
            "file_size_bytes",
            "parameters",
            "generated_at",
            "created_at",
            "download_url",
        ]
        read_only_fields = [
            "id",
            "generated_by",
            "file_path",
            "file_size_bytes",
            "generated_at",
            "created_at",
            "download_url",
        ]

    def get_download_url(self, obj: Report) -> str | None:
        if obj.status == ReportStatus.COMPLETED and obj.file_path:
            return f"/api/v1/reports/{obj.id}/download/"
        return None


class TaskStatusResponseSerializer(serializers.Serializer):
    """Immediate 202 Accepted response containing the tracking task_id."""

    task_id = serializers.CharField()
    report_id = serializers.UUIDField(required=False)
    status = serializers.CharField()
    message = serializers.CharField(required=False)
