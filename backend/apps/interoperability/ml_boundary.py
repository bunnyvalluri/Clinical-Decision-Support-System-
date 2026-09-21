"""
FHIR-to-ML Controlled Boundary — BPY-CSE-2666 (Section 25).
Enforces the mandatory pipeline:
FHIR Data -> Clinical Data Validation -> Approved Feature Engineering -> Feature Validation -> Model Input -> Prediction.
Guarantees that raw, unvalidated FHIR data is NEVER fed directly into an ML inference model.
"""
from typing import Any, Dict, List, Optional, Tuple
from decimal import Decimal
from django.utils import timezone

from apps.clinical.models import ClinicalRecord
from apps.interoperability.domain.exceptions import ClinicalBoundsViolationError, InteroperabilityError
from apps.interoperability.validators.clinical_bounds_validator import ClinicalBoundsValidator
from apps.model_registry.models import ModelVersion
from apps.predictions.models import Prediction, RiskLevel


class FHIRMLBoundaryGate:
    """
    Guards ML model inputs from unvalidated or corrupt external FHIR observations.
    Maintains complete dataset and feature transformation lineage.
    """

    FEATURE_SCHEMA_VERSION = "v1.4.0-fhir-curated"

    @classmethod
    def prepare_and_validate_features(
        cls,
        clinical_record: ClinicalRecord,
        model_version: ModelVersion,
    ) -> Tuple[Dict[str, float], Dict[str, Any]]:
        """
        Extracts, validates, and engineers features strictly through approved clinical transformations.
        Returns:
            (validated_features_dict, transformation_lineage_metadata)
        """
        # Step 1: Clinical Data Validation (Physiological bounds)
        vitals_dict = {
            "systolic_bp": clinical_record.systolic_bp,
            "diastolic_bp": clinical_record.diastolic_bp,
            "heart_rate": clinical_record.heart_rate,
            "respiratory_rate": clinical_record.respiratory_rate,
            "body_temperature": clinical_record.body_temperature,
            "oxygen_saturation": clinical_record.oxygen_saturation,
            "glucose_level": clinical_record.glucose_level,
            "cholesterol_total": clinical_record.cholesterol_total,
            "bmi": clinical_record.bmi,
            "creatinine": clinical_record.creatinine,
            "sodium": clinical_record.sodium,
            "calcium": clinical_record.calcium,
            "lactic_acid": clinical_record.lactic_acid,
        }
        violations = ClinicalBoundsValidator.validate_clinical_dict(vitals_dict, raise_exception=False)
        if violations:
            violation_summary = "; ".join(v["message"] for v in violations)
            raise ClinicalBoundsViolationError(
                message=f"FHIR clinical data failed physiological validation for ML: {violation_summary}",
                feature_name=violations[0]["feature"],
                value=violations[0]["value"],
            )

        # Step 2: Approved Feature Engineering
        patient = clinical_record.patient
        age = patient.age if patient and patient.age is not None else 50.0

        engineered_features: Dict[str, float] = {}

        # Safe numeric casting & median fallback defaults from approved schema
        engineered_features["age"] = float(age)
        engineered_features["systolic_bp"] = float(clinical_record.systolic_bp or 120.0)
        engineered_features["diastolic_bp"] = float(clinical_record.diastolic_bp or 80.0)
        engineered_features["heart_rate"] = float(clinical_record.heart_rate or 75.0)
        engineered_features["respiratory_rate"] = float(clinical_record.respiratory_rate or 16.0)
        engineered_features["body_temperature"] = float(clinical_record.body_temperature or 37.0)
        engineered_features["oxygen_saturation"] = float(clinical_record.oxygen_saturation or 98.0)
        engineered_features["glucose_level"] = float(clinical_record.glucose_level or 100.0)
        engineered_features["bmi"] = float(clinical_record.bmi or 25.0)

        # Derived hemodynamic indicator: Pulse Pressure
        engineered_features["pulse_pressure"] = engineered_features["systolic_bp"] - engineered_features["diastolic_bp"]

        # Derived: Mean Arterial Pressure (MAP) = (2 * DBP + SBP) / 3
        engineered_features["mean_arterial_pressure"] = round(
            (2 * engineered_features["diastolic_bp"] + engineered_features["systolic_bp"]) / 3.0, 2
        )

        # Step 3: Feature Validation against Model Requirements
        required_features = model_version.feature_names or list(engineered_features.keys())
        for req in required_features:
            if req in engineered_features:
                val = engineered_features[req]
                if val is None or val != val:  # NaN check
                    raise InteroperabilityError(f"Engineered feature '{req}' contains invalid NaN value.")

        # Step 4: Lineage Metadata
        lineage = {
            "source_record_id": str(clinical_record.id),
            "source_patient_mrn": patient.mrn if patient else None,
            "feature_schema_version": cls.FEATURE_SCHEMA_VERSION,
            "transformation_pipeline": "FHIRMLBoundaryGate.prepare_and_validate_features",
            "model_version_id": str(model_version.id),
            "model_name": model_version.name,
            "engineered_at": timezone.now().isoformat(),
        }

        return engineered_features, lineage
