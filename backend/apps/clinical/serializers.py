"""
Serializers for clinical app — clinical encounters, vital signs, and laboratory measurements.
Implements strong physiological and laboratory validation, range limits, impossible value prevention,
and categorical integrity.
"""
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers

from apps.clinical.models import ClinicalFeatureDefinition, ClinicalRecord, ClinicalRule, EncounterType


class ClinicalRecordValidationMixin:
    """Rigorous physiological and biochemical range validation for clinical observation parameters."""

    def validate_encounter_type(self, value: str) -> str:
        if value not in EncounterType.values:
            raise serializers.ValidationError(
                f"Invalid encounter type '{value}'. Must be one of: {', '.join(EncounterType.values)}."
            )
        return value

    def validate_recorded_at(self, value):
        if value:
            # Allow at most 5 minutes into the future to handle minor client/server clock skew
            if value > (timezone.now() + timedelta(minutes=5)):
                raise serializers.ValidationError("Observation timestamp cannot be in the future.")
        return value

    def validate_systolic_bp(self, value: int | None) -> int | None:
        if value is not None:
            if value <= 0:
                raise serializers.ValidationError("Systolic blood pressure must be a positive integer.")
            if value < 40 or value > 300:
                raise serializers.ValidationError(
                    f"Systolic blood pressure {value} mmHg is outside viable physiological limits (40 - 300 mmHg)."
                )
        return value

    def validate_diastolic_bp(self, value: int | None) -> int | None:
        if value is not None:
            if value <= 0:
                raise serializers.ValidationError("Diastolic blood pressure must be a positive integer.")
            if value < 20 or value > 200:
                raise serializers.ValidationError(
                    f"Diastolic blood pressure {value} mmHg is outside viable physiological limits (20 - 200 mmHg)."
                )
        return value

    def validate_heart_rate(self, value: int | None) -> int | None:
        if value is not None:
            if value <= 0:
                raise serializers.ValidationError("Heart rate must be a positive integer.")
            if value < 20 or value > 300:
                raise serializers.ValidationError(
                    f"Heart rate {value} bpm is outside viable physiological limits (20 - 300 bpm)."
                )
        return value

    def validate_respiratory_rate(self, value: int | None) -> int | None:
        if value is not None:
            if value <= 0:
                raise serializers.ValidationError("Respiratory rate must be a positive integer.")
            if value < 4 or value > 100:
                raise serializers.ValidationError(
                    f"Respiratory rate {value} breaths/min is outside viable physiological limits (4 - 100)."
                )
        return value

    def validate_body_temperature(self, value: Decimal | None) -> Decimal | None:
        if value is not None:
            if value < Decimal("25.0") or value > Decimal("45.0"):
                raise serializers.ValidationError(
                    f"Body temperature {value} °C is outside viable human biological limits (25.0 - 45.0 °C)."
                )
        return value

    def validate_oxygen_saturation(self, value: Decimal | None) -> Decimal | None:
        if value is not None:
            if value < Decimal("0.0") or value > Decimal("100.0"):
                raise serializers.ValidationError(
                    f"Oxygen saturation {value}% must be between 0.0% and 100.0%."
                )
        return value

    def validate_glucose_level(self, value: Decimal | None) -> Decimal | None:
        if value is not None:
            if value <= Decimal("0.0") or value > Decimal("1500.0"):
                raise serializers.ValidationError(
                    f"Blood glucose level {value} mg/dL is outside possible clinical limits (1.0 - 1500.0 mg/dL)."
                )
        return value

    def validate_cholesterol_total(self, value: Decimal | None) -> Decimal | None:
        if value is not None:
            if value <= Decimal("0.0") or value > Decimal("1200.0"):
                raise serializers.ValidationError(
                    f"Total cholesterol {value} mg/dL is outside possible clinical limits (1.0 - 1200.0 mg/dL)."
                )
        return value

    def validate_bmi(self, value: Decimal | None) -> Decimal | None:
        if value is not None:
            if value < Decimal("5.0") or value > Decimal("120.0"):
                raise serializers.ValidationError(
                    f"Body Mass Index {value} kg/m² is outside viable physiological limits (5.0 - 120.0)."
                )
        return value

    def validate_creatinine(self, value: Decimal | None) -> Decimal | None:
        if value is not None:
            if value <= Decimal("0.0") or value > Decimal("30.0"):
                raise serializers.ValidationError(
                    f"Serum creatinine {value} mg/dL is outside viable physiological limits (0.1 - 30.0 mg/dL)."
                )
        return value

    def validate_sodium(self, value: Decimal | None) -> Decimal | None:
        if value is not None:
            if value < Decimal("80.0") or value > Decimal("200.0"):
                raise serializers.ValidationError(
                    f"Serum sodium {value} mmol/L is outside viable physiological limits (80.0 - 200.0 mmol/L)."
                )
        return value

    def validate_calcium(self, value: Decimal | None) -> Decimal | None:
        if value is not None:
            if value < Decimal("2.0") or value > Decimal("25.0"):
                raise serializers.ValidationError(
                    f"Serum calcium {value} mg/dL is outside viable physiological limits (2.0 - 25.0 mg/dL)."
                )
        return value

    def validate_lactic_acid(self, value: Decimal | None) -> Decimal | None:
        if value is not None:
            if value < Decimal("0.0") or value > Decimal("35.0"):
                raise serializers.ValidationError(
                    f"Serum lactic acid {value} mmol/L is outside viable physiological limits (0.0 - 35.0 mmol/L)."
                )
        return value

    def validate_lab_results(self, value: dict) -> dict:
        if value is not None and not isinstance(value, dict):
            raise serializers.ValidationError("Laboratory results panel must be a structured key-value JSON object.")
        return value

    def validate(self, attrs: dict) -> dict:
        # Cross-field blood pressure validation: Systolic must be strictly greater than diastolic
        systolic = attrs.get("systolic_bp")
        diastolic = attrs.get("diastolic_bp")

        # In partial updates (PATCH), retrieve the existing instance values if not supplied in attrs
        if systolic is None and self.instance:
            systolic = self.instance.systolic_bp
        if diastolic is None and self.instance:
            diastolic = self.instance.diastolic_bp

        if systolic is not None and diastolic is not None:
            if systolic <= diastolic:
                raise serializers.ValidationError(
                    {
                        "systolic_bp": [
                            f"Systolic blood pressure ({systolic} mmHg) must be strictly greater than "
                            f"diastolic blood pressure ({diastolic} mmHg)."
                        ]
                    }
                )

        return attrs


class ClinicalRecordSerializer(ClinicalRecordValidationMixin, serializers.ModelSerializer):
    """Full representation of a clinical observation record."""

    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_age = serializers.IntegerField(source="patient.age", read_only=True)
    patient_gender = serializers.CharField(source="patient.gender", read_only=True)
    recorded_by_name = serializers.CharField(
        source="recorded_by.full_name",
        read_only=True,
        default=None,
    )

    class Meta:
        model = ClinicalRecord
        fields = [
            "id",
            "patient",
            "patient_mrn",
            "patient_name",
            "patient_age",
            "patient_gender",
            "recorded_by",
            "recorded_by_name",
            "recorded_at",
            "encounter_type",
            "systolic_bp",
            "diastolic_bp",
            "heart_rate",
            "respiratory_rate",
            "body_temperature",
            "oxygen_saturation",
            "glucose_level",
            "cholesterol_total",
            "bmi",
            "creatinine",
            "sodium",
            "calcium",
            "lactic_acid",
            "symptoms",
            "clinical_notes",
            "lab_results",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClinicalRecordCreateUpdateSerializer(ClinicalRecordValidationMixin, serializers.ModelSerializer):
    """Serializer used for recording new patient vitals encounters or updating existing ones."""

    class Meta:
        model = ClinicalRecord
        fields = [
            "id",
            "patient",
            "recorded_at",
            "encounter_type",
            "systolic_bp",
            "diastolic_bp",
            "heart_rate",
            "respiratory_rate",
            "body_temperature",
            "oxygen_saturation",
            "glucose_level",
            "cholesterol_total",
            "bmi",
            "creatinine",
            "sodium",
            "calcium",
            "lactic_acid",
            "symptoms",
            "clinical_notes",
            "lab_results",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "patient": {"required": False},  # When creating via nested /patients/{id}/clinical-records/, populated automatically
        }


class ClinicalFeatureDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for dynamic clinical feature definitions and validation boundaries."""

    class Meta:
        model = ClinicalFeatureDefinition
        fields = [
            "id",
            "name",
            "display_name",
            "data_type",
            "unit",
            "required",
            "min_value",
            "max_value",
            "allowed_values",
            "preprocessing_strategy",
            "clinical_category",
            "is_active",
            "version",
            "created_at",
            "updated_at",
        ]


class ClinicalRuleSerializer(serializers.ModelSerializer):
    """Serializer for deterministic clinical safety rules."""

    class Meta:
        model = ClinicalRule
        fields = [
            "id",
            "rule_name",
            "description",
            "condition_expression",
            "severity",
            "action_type",
            "version",
            "effective_from",
            "effective_to",
            "approval_status",
            "created_at",
            "updated_at",
        ]


class DataQualityIssueSerializer(serializers.ModelSerializer):
    """Serializer for granular clinical data quality anomalies."""

    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.get_full_name", read_only=True)

    class Meta:
        from apps.clinical.models import DataQualityIssue
        model = DataQualityIssue
        fields = [
            "id",
            "patient",
            "patient_mrn",
            "clinical_record",
            "issue_type",
            "severity",
            "feature_name",
            "observed_value",
            "expected_range",
            "source",
            "status",
            "assigned_to",
            "assigned_to_name",
            "resolution",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

