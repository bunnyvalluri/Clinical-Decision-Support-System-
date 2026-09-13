"""
Filters for clinical app.
Enables query filtering by encounter type, patient ID, clinician, and observation timeline.
"""
from django_filters import rest_framework as filters

from apps.clinical.models import ClinicalRecord, EncounterType


class ClinicalRecordFilter(filters.FilterSet):
    encounter_type = filters.ChoiceFilter(choices=EncounterType.choices)
    patient = filters.UUIDFilter(field_name="patient__id")
    recorded_by = filters.UUIDFilter(field_name="recorded_by__id")
    recorded_after = filters.DateTimeFilter(field_name="recorded_at", lookup_expr="gte")
    recorded_before = filters.DateTimeFilter(field_name="recorded_at", lookup_expr="lte")
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = ClinicalRecord
        fields = [
            "encounter_type",
            "patient",
            "recorded_by",
            "recorded_after",
            "recorded_before",
            "created_after",
            "created_before",
        ]
