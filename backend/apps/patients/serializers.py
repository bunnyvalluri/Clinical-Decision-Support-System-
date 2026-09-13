"""
Serializers for patients app — patient registration, demographics, and medical profile.
"""
from rest_framework import serializers

from apps.patients.models import BloodGroup, Gender, Patient


class PatientSerializer(serializers.ModelSerializer):
    """Full representation of a patient demographic profile."""

    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    primary_physician_name = serializers.CharField(
        source="primary_physician.full_name",
        read_only=True,
    )

    class Meta:
        model = Patient
        fields = [
            "id",
            "mrn",
            "first_name",
            "last_name",
            "full_name",
            "date_of_birth",
            "age",
            "gender",
            "blood_group",
            "phone_number",
            "email",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relation",
            "primary_physician",
            "primary_physician_name",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "mrn", "created_at", "updated_at", "full_name", "age"]


class PatientRegistrationSerializer(serializers.ModelSerializer):
    """Serializer used by Staff and Clinicians to register a new clinical patient."""

    class Meta:
        model = Patient
        fields = [
            "id",
            "mrn",
            "first_name",
            "last_name",
            "date_of_birth",
            "gender",
            "blood_group",
            "phone_number",
            "email",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relation",
            "primary_physician",
        ]
        read_only_fields = ["id"]

    def validate_mrn(self, value: str) -> str:
        value = value.strip().upper()
        if Patient.objects.filter(mrn=value).exists():
            raise serializers.ValidationError("A patient with this Medical Record Number (MRN) already exists.")
        return value
