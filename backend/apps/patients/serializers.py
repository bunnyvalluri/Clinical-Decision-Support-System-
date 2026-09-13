"""
Serializers for patients app — patient registration, demographics, and medical profile.
Includes strong domain validation for dates, ranges, categorical fields, and physician roles.
"""
from datetime import date
import re
import uuid
from rest_framework import serializers

from apps.accounts.models import UserRole
from apps.patients.models import BloodGroup, Gender, Patient


PHONE_REGEX = re.compile(r"^\+?[0-9\s\-\(\)\.]{7,25}$")


class PatientValidationMixin:
    """Shared validation rules for patient records."""

    def validate_first_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("First name cannot be blank or whitespace.")
        if len(value) > 100:
            raise serializers.ValidationError("First name cannot exceed 100 characters.")
        if value.isdigit():
            raise serializers.ValidationError("First name cannot consist entirely of numbers.")
        return value

    def validate_last_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Last name cannot be blank or whitespace.")
        if len(value) > 100:
            raise serializers.ValidationError("Last name cannot exceed 100 characters.")
        if value.isdigit():
            raise serializers.ValidationError("Last name cannot consist entirely of numbers.")
        return value

    def validate_date_of_birth(self, value: date) -> date:
        today = date.today()
        if value > today:
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        if (today.year - value.year) > 130:
            raise serializers.ValidationError("Date of birth cannot indicate an age greater than 130 years.")
        return value

    def validate_gender(self, value: str) -> str:
        if not value:
            return Gender.UNKNOWN
        value_upper = value.upper()
        if value_upper not in Gender.values:
            raise serializers.ValidationError(
                f"Invalid gender '{value}'. Must be one of: {', '.join(Gender.values)}."
            )
        return value_upper

    def validate_blood_group(self, value: str) -> str:
        if not value:
            return BloodGroup.UNKNOWN
        value_upper = value.upper()
        if value_upper not in BloodGroup.values:
            raise serializers.ValidationError(
                f"Invalid blood group '{value}'. Must be one of: {', '.join(BloodGroup.values)}."
            )
        return value_upper

    def validate_phone_number(self, value: str) -> str:
        if not value:
            return ""
        cleaned = value.strip()
        if cleaned and not PHONE_REGEX.match(cleaned):
            raise serializers.ValidationError(
                "Invalid phone number format. Must contain 7 to 25 characters including digits and standard separators."
            )
        return cleaned

    def validate_email(self, value: str) -> str:
        if not value:
            return ""
        return value.strip().lower()

    def validate_primary_physician(self, value):
        if value is not None:
            if not value.is_active:
                raise serializers.ValidationError("Assigned primary physician account is inactive.")
            if value.role not in (UserRole.CLINICIAN, UserRole.DOCTOR, UserRole.ADMIN):
                raise serializers.ValidationError(
                    f"Selected user '{value.email}' does not possess clinical privileges."
                )
        return value


class PatientSerializer(PatientValidationMixin, serializers.ModelSerializer):
    """Full representation of a patient demographic profile."""

    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    primary_physician_name = serializers.CharField(
        source="primary_physician.full_name",
        read_only=True,
        default=None,
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


class PatientRegistrationSerializer(PatientValidationMixin, serializers.ModelSerializer):
    """Serializer used by Staff and Clinicians to register a new clinical patient."""

    mrn = serializers.CharField(required=False, allow_blank=True, max_length=50)

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
        if not value:
            return ""
        value = value.strip().upper()
        if Patient.objects.filter(mrn=value).exists():
            raise serializers.ValidationError("A patient with this Medical Record Number (MRN) already exists.")
        return value

    def create(self, validated_data: dict) -> Patient:
        # Auto-generate MRN if not provided
        mrn = validated_data.get("mrn")
        if not mrn:
            current_year = date.today().year
            while True:
                candidate = f"MRN-{current_year}-{uuid.uuid4().hex[:6].upper()}"
                if not Patient.objects.filter(mrn=candidate).exists():
                    validated_data["mrn"] = candidate
                    break
        else:
            validated_data["mrn"] = mrn.strip().upper()

        return super().create(validated_data)


class PatientUpdateSerializer(PatientValidationMixin, serializers.ModelSerializer):
    """Serializer for updating patient demographic details."""

    class Meta:
        model = Patient
        fields = [
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
            "is_active",
        ]
