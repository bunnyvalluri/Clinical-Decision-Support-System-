"""
Filters for patients app.
Enables query filtering on demographics, care team assignment, and date ranges.
"""
from django_filters import rest_framework as filters

from apps.patients.models import BloodGroup, Gender, Patient


class PatientFilter(filters.FilterSet):
    first_name = filters.CharFilter(lookup_expr="icontains")
    last_name = filters.CharFilter(lookup_expr="icontains")
    mrn = filters.CharFilter(lookup_expr="icontains")
    gender = filters.ChoiceFilter(choices=Gender.choices)
    blood_group = filters.ChoiceFilter(choices=BloodGroup.choices)
    is_active = filters.BooleanFilter()
    primary_physician = filters.UUIDFilter(field_name="primary_physician__id")
    dob_from = filters.DateFilter(field_name="date_of_birth", lookup_expr="gte")
    dob_to = filters.DateFilter(field_name="date_of_birth", lookup_expr="lte")
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Patient
        fields = [
            "first_name",
            "last_name",
            "mrn",
            "gender",
            "blood_group",
            "is_active",
            "primary_physician",
            "dob_from",
            "dob_to",
            "created_after",
            "created_before",
        ]
