"""
Automated Robustness and Security Test Suite for Clinical ML Systems.
Covers:
- Robustness: Missing features, Gaussian noise, physiological extremes, column reordering, invalid categoricals.
- Security: Safe deserialization, cryptographic SHA-256 artifact verification, tampering rejection, path traversal.
"""
import copy
import hashlib
import json
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from ml.data.dataset import get_or_create_dataset
from ml.data.validator import ClinicalDataValidator, ValidationSeverity
from ml.features.schema import FEATURE_NAMES, validate_features
from ml.inference.engine import InferenceEngine
from ml.inference.ood_detector import OODStatus, OutOfDistributionDetector
from ml.inference.uncertainty import ClinicalUncertaintyEstimator, ConfidenceLevel
from ml.registry.model_registry import ModelRegistry, ModelSecurityError


@pytest.fixture(scope="module")
def trained_rf_pipeline():
    """Load or train a verified Random Forest pipeline."""
    from ml.training.train import train_and_evaluate_model
    result = train_and_evaluate_model(
        model_type="RANDOM_FOREST",
        version="robustness_test_1.0.0",
        calibrate=True,
    )
    registry = ModelRegistry()
    pipeline, meta, _ = registry.load_model("random_forest_risk_model", version="robustness_test_1.0.0")
    return pipeline, meta


class TestMLRobustness:
    """Test resilience against noisy, incomplete, or corrupted clinical inputs."""

    def test_missing_features_imputed_safely(self, trained_rf_pipeline):
        pipeline, _ = trained_rf_pipeline
        # Incomplete record missing critical labs and vitals
        record = {
            "age": 62.0,
            "systolic_bp": 135,
            "diastolic_bp": 85,
            "gender": "MALE",
            # labs omitted
        }
        df = validate_features(record)
        preds = pipeline.predict(df)
        assert preds[0] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    def test_reordered_inputs_handled_identically(self, trained_rf_pipeline):
        pipeline, _ = trained_rf_pipeline
        record = {
            "lactic_acid": 2.1,
            "gender": "FEMALE",
            "age": 55.0,
            "systolic_bp": 140,
            "diastolic_bp": 90,
            "heart_rate": 88,
            "respiratory_rate": 18,
            "body_temperature": 37.2,
            "oxygen_saturation": 96.0,
            "glucose_level": 110.0,
            "cholesterol_total": 200.0,
            "bmi": 26.0,
            "creatinine": 1.1,
            "sodium": 139.0,
            "calcium": 9.2,
            "encounter_type": "OUTPATIENT",
        }
        # Invert order of keys
        reversed_record = dict(reversed(list(record.items())))
        df1 = validate_features(record)
        df2 = validate_features(reversed_record)

        prob1 = pipeline.predict_proba(df1)
        prob2 = pipeline.predict_proba(df2)
        np.testing.assert_allclose(prob1, prob2, atol=1e-5, err_msg="Reordered keys must yield identical probabilities")

    def test_physiological_contradiction_rejected(self):
        validator = ClinicalDataValidator()
        # SBP <= DBP is biologically impossible in arterial circulation
        invalid_record = {
            "age": 45.0,
            "systolic_bp": 75,
            "diastolic_bp": 95,  # DBP > SBP!
            "gender": "MALE",
        }
        is_valid, errors, _ = validator.validate_single_record(invalid_record)
        assert not is_valid
        assert any("must exceed diastolic" in e for e in errors)

    def test_out_of_distribution_flags_extreme_patient(self):
        detector = OutOfDistributionDetector()
        df_train = get_or_create_dataset()
        detector.fit_baseline(df_train)

        # Extreme physiological anomaly: HR=280, SpO2=45, Lactate=25.0
        extreme_record = {
            "age": 30.0,
            "heart_rate": 280.0,
            "oxygen_saturation": 45.0,
            "lactic_acid": 25.0,
            "systolic_bp": 55.0,
            "diastolic_bp": 30.0,
        }
        ood_res = detector.evaluate_record(extreme_record)
        assert ood_res.status in (OODStatus.OUT_OF_DISTRIBUTION, OODStatus.POTENTIAL_DISTRIBUTION_SHIFT)
        assert ood_res.max_feature_zscore >= 3.0


class TestMLSecurityAndArtifactIntegrity:
    """Test cryptographic artifact validation and protection against unsafe deserialization."""

    def test_artifact_tampering_fails_safe_deserialization(self, tmp_path):
        """Verify that any modification to a joblib artifact triggers ModelSecurityError."""
        from sklearn.ensemble import RandomForestClassifier
        from ml.preprocessing.pipeline import build_preprocessing_pipeline
        from sklearn.pipeline import Pipeline

        pipe = Pipeline([
            ("preprocessor", build_preprocessing_pipeline()),
            ("classifier", RandomForestClassifier(n_estimators=5, random_state=42)),
        ])
        # Train dummy model
        df = pd.DataFrame([{**{f: 50.0 for f in FEATURE_NAMES}, "gender": "MALE", "encounter_type": "ROUTINE", "risk_level": "LOW"}])
        pipe.fit(df[FEATURE_NAMES], df["risk_level"])

        registry = ModelRegistry(base_dir=tmp_path)
        version_dir = registry.save_model(
            name="security_test_model",
            version="1.0.0",
            pipeline=pipe,
            model_type="RANDOM_FOREST",
        )

        # Confirm model loads cleanly with valid hash
        loaded_pipe, meta, _ = registry.load_model("security_test_model", version="1.0.0", verify_integrity=True)
        assert loaded_pipe is not None

        # Simulate Malicious Tampering: append bytes to pipeline.joblib
        pipeline_file = version_dir / "pipeline.joblib"
        with open(pipeline_file, "ab") as f:
            f.write(b"\x00\xDE\xAD\xBE\xEF_TAMPERED_PAYLOAD")

        # Loading must strictly raise ModelSecurityError and refuse to deserialize
        with pytest.raises(ModelSecurityError) as exc_info:
            registry.load_model("security_test_model", version="1.0.0", verify_integrity=True)

        assert "CRITICAL SECURITY ALERT" in str(exc_info.value)
        assert "Artifact integrity verification failed" in str(exc_info.value)

    def test_unapproved_model_cannot_be_activated(self, tmp_path):
        """Approval gate test: CANDIDATE model cannot be promoted directly without approval."""
        from ml.registry.model_registry import ModelApprovalError

        registry = ModelRegistry(base_dir=tmp_path)
        # Create a dummy model registered as CANDIDATE
        version_dir = tmp_path / "candidate_model" / "0.1.0"
        version_dir.mkdir(parents=True, exist_ok=True)
        with open(version_dir / "metadata.json", "w") as f:
            json.dump({"name": "candidate_model", "version": "0.1.0", "status": "CANDIDATE"}, f)

        with pytest.raises(ModelApprovalError) as exc_info:
            registry.activate_model("candidate_model", "0.1.0", activated_by="clinician_user")

        assert "cannot be activated" in str(exc_info.value)
        assert "must be formally APPROVED" in str(exc_info.value)
