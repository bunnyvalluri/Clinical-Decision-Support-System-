"""Admin configuration for clinical app."""
from django.contrib import admin

from apps.clinical.models import ClinicalRecord


@admin.register(ClinicalRecord)
class ClinicalRecordAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "patient",
        "encounter_type",
        "systolic_bp",
        "diastolic_bp",
        "heart_rate",
        "body_temperature",
        "oxygen_saturation",
        "recorded_at",
    )
    list_filter = ("encounter_type", "recorded_at")
    search_fields = ("patient__mrn", "patient__first_name", "patient__last_name", "symptoms")
    readonly_fields = ("id", "created_at", "updated_at")
