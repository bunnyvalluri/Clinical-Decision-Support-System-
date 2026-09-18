"""
Seed Clinical Feature Definitions and Deterministic Clinical Rules.
Populates standard clinical bounds, metadata, and deterministic rules
derived from the active patient risk dataset (BPY-CSE-2666).
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.clinical.models import ClinicalFeatureDefinition, ClinicalRule


FEATURES_DATA = [
    {
        "name": "age",
        "display_name": "Age",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "years",
        "required": True,
        "min_value": Decimal("0.0"),
        "max_value": Decimal("125.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.DEMOGRAPHIC,
    },
    {
        "name": "gender",
        "display_name": "Gender",
        "data_type": ClinicalFeatureDefinition.DataType.CATEGORICAL,
        "unit": "",
        "required": True,
        "min_value": None,
        "max_value": None,
        "allowed_values": ["MALE", "FEMALE", "OTHER"],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.ONE_HOT,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.DEMOGRAPHIC,
    },
    {
        "name": "encounter_type",
        "display_name": "Encounter Setting",
        "data_type": ClinicalFeatureDefinition.DataType.CATEGORICAL,
        "unit": "",
        "required": True,
        "min_value": None,
        "max_value": None,
        "allowed_values": ["ROUTINE", "OUTPATIENT", "INPATIENT", "EMERGENCY", "ICU"],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.ONE_HOT,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.ENCOUNTER,
    },
    {
        "name": "systolic_bp",
        "display_name": "Systolic Blood Pressure",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "mmHg",
        "required": True,
        "min_value": Decimal("40.0"),
        "max_value": Decimal("300.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.CARDIOVASCULAR,
    },
    {
        "name": "diastolic_bp",
        "display_name": "Diastolic Blood Pressure",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "mmHg",
        "required": True,
        "min_value": Decimal("20.0"),
        "max_value": Decimal("200.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.CARDIOVASCULAR,
    },
    {
        "name": "heart_rate",
        "display_name": "Heart Rate",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "bpm",
        "required": True,
        "min_value": Decimal("20.0"),
        "max_value": Decimal("260.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.CARDIOVASCULAR,
    },
    {
        "name": "respiratory_rate",
        "display_name": "Respiratory Rate",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "breaths/min",
        "required": True,
        "min_value": Decimal("6.0"),
        "max_value": Decimal("70.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.RESPIRATORY,
    },
    {
        "name": "body_temperature",
        "display_name": "Body Temperature",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "°C",
        "required": True,
        "min_value": Decimal("30.0"),
        "max_value": Decimal("45.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.VITAL,
    },
    {
        "name": "oxygen_saturation",
        "display_name": "Oxygen Saturation (SpO2)",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "%",
        "required": True,
        "min_value": Decimal("50.0"),
        "max_value": Decimal("100.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.RESPIRATORY,
    },
    {
        "name": "glucose_level",
        "display_name": "Blood Glucose Level",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "mg/dL",
        "required": True,
        "min_value": Decimal("20.0"),
        "max_value": Decimal("1000.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.METABOLIC,
    },
    {
        "name": "cholesterol_total",
        "display_name": "Total Cholesterol",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "mg/dL",
        "required": True,
        "min_value": Decimal("50.0"),
        "max_value": Decimal("600.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.METABOLIC,
    },
    {
        "name": "bmi",
        "display_name": "Body Mass Index (BMI)",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "kg/m²",
        "required": True,
        "min_value": Decimal("10.0"),
        "max_value": Decimal("80.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.VITAL,
    },
    {
        "name": "creatinine",
        "display_name": "Serum Creatinine",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "mg/dL",
        "required": False,
        "min_value": Decimal("0.1"),
        "max_value": Decimal("25.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.RENAL,
    },
    {
        "name": "sodium",
        "display_name": "Serum Sodium",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "mmol/L",
        "required": False,
        "min_value": Decimal("100.0"),
        "max_value": Decimal("180.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.ELECTROLYTE,
    },
    {
        "name": "calcium",
        "display_name": "Serum Calcium",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "mg/dL",
        "required": False,
        "min_value": Decimal("4.0"),
        "max_value": Decimal("18.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.ELECTROLYTE,
    },
    {
        "name": "lactic_acid",
        "display_name": "Lactic Acid / Lactate",
        "data_type": ClinicalFeatureDefinition.DataType.NUMERICAL,
        "unit": "mmol/L",
        "required": False,
        "min_value": Decimal("0.2"),
        "max_value": Decimal("30.0"),
        "allowed_values": [],
        "preprocessing_strategy": ClinicalFeatureDefinition.PreprocessingStrategy.STANDARD_SCALER,
        "clinical_category": ClinicalFeatureDefinition.ClinicalCategory.METABOLIC,
    },
]

RULES_DATA = [
    {
        "rule_name": "qSOFA Sepsis Risk Flag",
        "description": "quick Sepsis-related Organ Failure Assessment. Flags acute mortality risk if >= 2 criteria are met: RR>=22, SBP<=100, altered mental status.",
        "condition_expression": {
            "type": "composite_score",
            "score_threshold": 2,
            "criteria": [
                {"field": "respiratory_rate", "op": "gte", "value": 22},
                {"field": "systolic_bp", "op": "lte", "value": 100},
                {"field": "altered_mental_status", "op": "eq", "value": True},
            ],
        },
        "severity": ClinicalRule.Severity.CRITICAL,
        "action_type": ClinicalRule.ActionType.SEPSIS_BUNDLE,
    },
    {
        "rule_name": "NEWS2 Deterioration Alert",
        "description": "National Early Warning Score 2 composite physiological deterioration alert. Score >= 7 triggers emergency clinical review.",
        "condition_expression": {
            "type": "news2_aggregate",
            "threshold": 7,
        },
        "severity": ClinicalRule.Severity.CRITICAL,
        "action_type": ClinicalRule.ActionType.BEDSIDE_EVALUATION,
    },
    {
        "rule_name": "Severe Hypoxemia Alert",
        "description": "Oxygen saturation (SpO2) <= 88% indicating acute respiratory failure or severe hypoxemic distress.",
        "condition_expression": {
            "type": "threshold",
            "field": "oxygen_saturation",
            "op": "lte",
            "value": 88.0,
        },
        "severity": ClinicalRule.Severity.CRITICAL,
        "action_type": ClinicalRule.ActionType.BEDSIDE_EVALUATION,
    },
    {
        "rule_name": "Hypertensive Crisis Alert",
        "description": "Systolic blood pressure >= 180 mmHg or diastolic >= 120 mmHg indicating hypertensive emergency/urgency.",
        "condition_expression": {
            "type": "any",
            "conditions": [
                {"field": "systolic_bp", "op": "gte", "value": 180},
                {"field": "diastolic_bp", "op": "gte", "value": 120},
            ],
        },
        "severity": ClinicalRule.Severity.CRITICAL,
        "action_type": ClinicalRule.ActionType.BEDSIDE_EVALUATION,
    },
    {
        "rule_name": "Severe Lactic Acidemia",
        "description": "Serum lactate >= 4.0 mmol/L indicating severe tissue hypoperfusion or cellular metabolic collapse.",
        "condition_expression": {
            "type": "threshold",
            "field": "lactic_acid",
            "op": "gte",
            "value": 4.0,
        },
        "severity": ClinicalRule.Severity.CRITICAL,
        "action_type": ClinicalRule.ActionType.SEPSIS_BUNDLE,
    },
]


class Command(BaseCommand):
    help = "Seed 16 Clinical Feature Definitions and Deterministic Clinical Rules"

    def handle(self, *args, **options):
        feature_count = 0
        for item in FEATURES_DATA:
            obj, created = ClinicalFeatureDefinition.objects.update_or_create(
                name=item["name"],
                defaults=item,
            )
            feature_count += 1

        rule_count = 0
        for item in RULES_DATA:
            obj, created = ClinicalRule.objects.update_or_create(
                rule_name=item["rule_name"],
                defaults=item,
            )
            rule_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {feature_count} clinical feature definitions and {rule_count} clinical rules."
            )
        )
