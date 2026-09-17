"""
Comprehensive tests for MLOps Domain Services & Security — BPY-CSE-2666.
"""
import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import RandomForestClassifier

from ml.features.schema import FEATURE_NAMES, NUMERICAL_FEATURES
from ml.mlops.security import ModelArtifactSecurity, ModelSecurityError
from ml.mlops.services import (
    DatasetService,
    DeploymentService,
    DriftService,
    ExplainabilityService,
    FairnessService,
    FeatureService,
    PredictionService,
    RollbackService,
    TrainingService,
)


def test_dataset_service_phi_scanning():
    """Verify PHI scanning detects forbidden patient identifiers."""
    df_clean = pd.DataFrame({"age": [45, 60], "systolic_bp": [120, 140]})
    assert len(DatasetService.scan_for_phi(df_clean)) == 0

    df_phi = pd.DataFrame({"patient_name": ["Alice", "Bob"], "ssn": ["000-00-0000", "111-11-1111"]})
    detected = DatasetService.scan_for_phi(df_phi)
    assert "patient_name" in detected
    assert "ssn" in detected


def test_dataset_service_patient_split():
    """Verify patient-level split prevents cross-split patient contamination."""
    df = pd.DataFrame({
        "patient_id": [f"PT-{i // 3}" for i in range(30)],
        "age": np.random.randint(20, 80, 30),
        "systolic_bp": np.random.randint(100, 180, 30),
        "risk_level": ["LOW"] * 15 + ["HIGH"] * 15,
    })
    train_df, test_df = DatasetService.split_by_patient(df, patient_col="patient_id", test_size=0.20)
    train_pts = set(train_df["patient_id"].unique())
    test_pts = set(test_df["patient_id"].unique())
    assert len(train_pts.intersection(test_pts)) == 0


def test_feature_service_consistency():
    """Verify feature contract validation and canonical ordering."""
    raw_data = {"age": 62, "systolic_bp": 140, "diastolic_bp": 85, "gender": "male"}
    df = FeatureService.prepare_features(raw_data)
    assert list(df.columns) == FEATURE_NAMES
    assert df["age"].iloc[0] == 62.0
    assert df["gender"].iloc[0] == "MALE"


def test_prediction_service_ood_and_inference():
    """Verify PredictionService flags physiological contradictions as OOD / REVIEW_REQUIRED."""
    # Dummy fitted model
    clf = RandomForestClassifier(n_estimators=5, random_state=42)
    X_dummy = pd.DataFrame(np.zeros((10, len(NUMERICAL_FEATURES))), columns=NUMERICAL_FEATURES)
    y_dummy = np.array(["LOW"] * 5 + ["HIGH"] * 5)
    clf.fit(X_dummy, y_dummy)

    pred_service = PredictionService(clf, algorithm="RandomForest", model_version="1.0.0")

    # Contradictory blood pressure
    obs = {"systolic_bp": 110, "diastolic_bp": 130}
    res = pred_service.predict(obs)
    assert res["is_ood"] is True
    assert res["status"] == "REVIEW_REQUIRED"
    assert "Physiological contradiction" in res["ood_reason"]


def test_drift_service_psi():
    """Verify Population Stability Index calculation."""
    baseline = np.random.normal(120, 10, 1000)
    current_stable = np.random.normal(120, 10, 1000)
    psi_stable = DriftService.calculate_psi(baseline, current_stable)
    assert psi_stable < 0.10

    current_drifted = np.random.normal(150, 15, 1000)
    psi_drifted = DriftService.calculate_psi(baseline, current_drifted)
    assert psi_drifted > 0.15


def test_fairness_service_parity():
    """Verify 80% rule demographic parity."""
    assert FairnessService.check_disparity(0.95, 0.90, threshold=0.80) is True
    assert FairnessService.check_disparity(0.95, 0.60, threshold=0.80) is False


def test_explainability_clinical_framing():
    """Verify explanation phrasing adheres to clinical safety standard."""
    attributions = {"systolic_bp": 0.45, "oxygen_saturation": -0.30}
    exps = ExplainabilityService.format_clinical_explanation(attributions)
    assert len(exps) == 2
    assert "caused" not in exps[0]["clinical_framing"].lower()
    assert "contributed" not in exps[0]["clinical_framing"].lower() or "predicted risk" in exps[0]["clinical_framing"].lower()


def test_deployment_gates():
    """Verify production promotion requires approval and minimum metrics."""
    ok, msg = DeploymentService.can_promote_to_production("APPROVED", has_approval=False, metrics={"f1_score": 0.95})
    assert ok is False
    assert "requires human clinician approval" in msg

    ok, msg = DeploymentService.can_promote_to_production("APPROVED", has_approval=True, metrics={"f1_score": 0.95}, min_f1=0.90)
    assert ok is True
