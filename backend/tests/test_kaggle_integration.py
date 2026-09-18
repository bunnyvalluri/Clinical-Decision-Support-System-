import pytest
import pandas as pd
import numpy as np
import tempfile
import os
import zipfile
from pathlib import Path
from integrations.kaggle.authentication import KaggleAuthService
from integrations.kaggle.validators import KaggleSecurityValidator, KaggleSecurityError
from integrations.kaggle.client import KaggleClient
from ml.data.quality_engine import DatasetQualityEngine
from ml.data.clinical_validator import ClinicalRangeValidator
from ml.data.leakage_detector import DataLeakageDetector
from ml.data.privacy_classifier import HealthcareDataClassifier
from ml.data.synthetic_detector import SyntheticDataDetector


class TestKaggleClientAndAuth:
    def test_auth_resolver_fallback(self):
        # Even without explicit credentials, auth service safely handles unauthenticated status
        auth = KaggleAuthService()
        has_auth = auth.is_authenticated()
        assert isinstance(has_auth, bool)

    def test_offline_catalog_fallback(self):
        client = KaggleClient()
        candidates = client.search_datasets("diabetes")
        assert len(candidates) > 0
        assert any("diabetes" in c.kaggle_slug.lower() for c in candidates)
        assert candidates[0].usability_rating > 0.8

    def test_search_datasets_uses_catalog_gracefully(self):
        client = KaggleClient()
        results = client.search_datasets("stroke")
        assert len(results) >= 1
        assert "stroke" in results[0].kaggle_slug.lower()


class TestKaggleSecurityValidators:
    def test_csv_formula_injection_sanitization(self):
        dirty_csv = "patient_id,name,calculation\n1,Alice,=SUM(A1:A10)\n2,Bob,@COMMAND\n3,Charlie,+12345\n4,Dave,-1+1\n"
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False, mode="w") as f:
            f.write(dirty_csv)
            raw_path = Path(f.name)

        clean_path = raw_path.with_name(raw_path.stem + "_clean.csv")
        KaggleSecurityValidator.sanitize_csv_file(raw_path, clean_path)

        with open(clean_path, "r", encoding="utf-8") as f:
            content = f.read()

        assert "'=SUM" in content
        assert "'@COMMAND" in content
        if raw_path.exists():
            raw_path.unlink()
        if clean_path.exists():
            clean_path.unlink()

    def test_dangerous_extension_detection(self):
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as f:
            zip_path = Path(f.name)

        # Write a zip with an executable inside
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("malicious.exe", b"MZexecutabledata")

        with pytest.raises(KaggleSecurityError, match="Prohibited executable"):
            KaggleSecurityValidator.validate_archive_safety(zip_path)

        if zip_path.exists():
            zip_path.unlink()


class TestHealthcareMLValidationEngines:
    def test_quality_engine_metrics(self):
        df = pd.DataFrame({
            "age": [45, 50, 60, None],
            "constant_col": [1, 1, 1, 1],
            "dup_id": [101, 102, 102, 104],
            "outcome": [0, 1, 0, 1]
        })
        res = DatasetQualityEngine.evaluate_dataframe(df, target_column="outcome")

        assert res["total_rows"] == 4
        assert res["total_columns"] == 4
        assert res["overall_completeness"] > 90.0
        assert "constant_col" in res["constant_columns"]

    def test_clinical_range_validator_bounds_and_contradictions(self):
        df = pd.DataFrame({
            "systolic_bp": [120, 90, 310],  # 310 > physiological max 260
            "diastolic_bp": [80, 100, 70],  # row 1: SBP(90) <= DBP(100) -> contradiction
            "heart_rate": [72, 85, 260],   # 260 > max 250
            "oxygen_saturation": [98, 105, 96]  # 105% > biological max 100%
        })
        report = ClinicalRangeValidator.validate_dataframe(df)

        assert report["has_blocking_violations"] is True
        assert len(report["range_violations"]) >= 1
        assert len(report["biological_contradictions"]) >= 1
        assert any(c["type"] == "BLOOD_PRESSURE_INVERSION" for c in report["biological_contradictions"])

    def test_data_leakage_detector(self):
        df = pd.DataFrame({
            "patient_ssn": ["123-45-6789", "987-65-4321", "555-55-5555"],
            "glucose": [110, 140, 200],
            "diabetes_outcome": [0, 1, 1],
            "diabetes_outcome_copy": [0, 1, 1]  # Exact correlation leak
        })
        findings = DataLeakageDetector.detect_leakage(df, target_column="diabetes_outcome")

        assert findings["leakage_findings_count"] >= 1
        assert any("diabetes_outcome_copy" in f.get("feature", "") for f in findings["findings"])

    def test_hipaa_privacy_classifier(self):
        phi_df = pd.DataFrame({
            "patient_mrn": ["MRN-10029", "MRN-10030"],
            "email": ["john.doe@clinic.org", "jane.doe@hospital.edu"],
            "systolic_bp": [120, 135]
        })
        assessment = HealthcareDataClassifier.scan_dataframe(phi_df)

        assert assessment["has_unredacted_phi"] is True
        assert assessment["classification"] == "PHI"
        assert assessment["approval_gate"] == "BLOCKED"

        clean_df = pd.DataFrame({
            "age": [45, 52, 60],
            "bmi": [24.5, 28.2, 31.0],
            "outcome": [0, 1, 0]
        })
        clean_assessment = HealthcareDataClassifier.scan_dataframe(clean_df)
        assert clean_assessment["has_unredacted_phi"] is False
        assert clean_assessment["approval_gate"] == "PERMITTED"

    def test_synthetic_data_detector(self):
        df = pd.DataFrame({"feat_a": [1, 2, 3], "feat_b": [4, 5, 6]})
        desc = "This dataset was generated using CTGAN synthetic data generator for research."
        result = SyntheticDataDetector.analyze_dataset(df, description=desc, dataset_title="Synthetic Patient Cohort")

        assert result["dataset_is_synthetic"] is True
        assert result["synthetic_confidence"] >= 0.85
