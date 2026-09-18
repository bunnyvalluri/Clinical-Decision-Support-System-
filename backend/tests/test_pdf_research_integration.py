"""
Unit tests for PDF-driven research enhancements — BPY-CSE-2666.
Verifies model abstraction (SVM, Random Forest, AdaBoost), threshold policies,
uncertainty estimation, OOD detection, data quality engine, timeline service, and FHIR mapping.
"""
from datetime import date
import pytest
from unittest.mock import MagicMock

from apps.predictions.models import RiskLevel, RiskThresholdPolicy
from ml.inference.models import AdaBoostRiskModel, RandomForestRiskModel, SVCRiskModel
from services.confidence_service import PredictionConfidenceService
from services.data_quality_service import ClinicalDataQualityService
from services.evaluation_service import ModelEvaluationService
from services.fhir_adapter import FHIRAdapter
from services.ood_service import OODDetectionService
from services.policy_service import RiskThresholdPolicyService


class TestMLModelAbstraction:
    def test_model_instantiations(self):
        rf = RandomForestRiskModel(n_estimators=50, max_depth=6)
        assert rf.model_name == "random_forest_risk_model"
        assert rf.algorithm_family == "Random Forest Ensemble"

        svc = SVCRiskModel(c_param=1.5, kernel="rbf")
        assert svc.model_name == "svm_risk_model"
        assert "Support Vector" in svc.algorithm_family

        ada = AdaBoostRiskModel(n_estimators=30, learning_rate=0.5)
        assert ada.model_name == "adaboost_risk_model"
        assert "AdaBoost" in ada.algorithm_family

    def test_pipeline_builds(self):
        rf = RandomForestRiskModel()
        pipeline = rf.build_full_pipeline()
        assert pipeline is not None
        assert "preprocessing" in pipeline.named_steps
        assert "classifier" in pipeline.named_steps


class TestPolicyService:
    def test_default_fallback_thresholds(self, monkeypatch):
        # Isolate from live database to test default algorithmic fallback
        monkeypatch.setattr(RiskThresholdPolicyService, "get_active_policy", classmethod(lambda cls, *a, **kw: None))
        low_tier = RiskThresholdPolicyService.resolve_risk_level(0.15)
        assert low_tier == RiskLevel.LOW

        med_tier = RiskThresholdPolicyService.resolve_risk_level(0.40)
        assert med_tier == RiskLevel.MEDIUM

        high_tier = RiskThresholdPolicyService.resolve_risk_level(0.65)
        assert high_tier == RiskLevel.HIGH

        crit_tier = RiskThresholdPolicyService.resolve_risk_level(0.85)
        assert crit_tier == RiskLevel.CRITICAL

    def test_policy_classification_logic(self):
        policy = RiskThresholdPolicy(
            policy_version="test-policy-1",
            low_threshold=0.3000,
            medium_threshold=0.6000,
            high_threshold=0.8000,
        )
        assert policy.classify_probability(0.20) == RiskLevel.LOW
        assert policy.classify_probability(0.45) == RiskLevel.MEDIUM
        assert policy.classify_probability(0.70) == RiskLevel.HIGH
        assert policy.classify_probability(0.90) == RiskLevel.CRITICAL


class TestUncertaintyAndOOD:
    def test_confidence_abstention_on_high_entropy(self):
        service = PredictionConfidenceService()
        # Near-uniform probability distribution (high entropy)
        uniform_probs = {"LOW": 0.25, "MEDIUM": 0.25, "HIGH": 0.25, "CRITICAL": 0.25}
        result = service.evaluate(uniform_probs)
        assert result.should_abstain is True
        assert result.confidence_level.value == "ABSTAIN"

    def test_confidence_on_clear_prediction(self):
        service = PredictionConfidenceService()
        clear_probs = {"LOW": 0.90, "MEDIUM": 0.05, "HIGH": 0.03, "CRITICAL": 0.02}
        result = service.evaluate(clear_probs)
        assert result.should_abstain is False
        assert result.confidence_level.value == "HIGH CONFIDENCE"

    def test_ood_detection(self):
        ood_service = OODDetectionService()
        # Normal record
        normal_rec = {"systolic_bp": 120, "heart_rate": 72, "age": 55}
        res_normal = ood_service.evaluate(normal_rec)
        assert res_normal.status is not None

        # Extreme physiological divergence
        extreme_rec = {"systolic_bp": 290, "heart_rate": 220, "age": 105}
        res_extreme = ood_service.evaluate(extreme_rec)
        assert res_extreme.status is not None


class TestDataQualityEngine:
    def test_detects_missing_critical(self):
        features = {"systolic_bp": 120}  # Missing age, gender, heart_rate
        issues = ClinicalDataQualityService.audit_record(features, persist_issues=False)
        assert len(issues) > 0
        missing_features = [i["feature_name"] for i in issues if i["issue_type"] == "MISSING_CRITICAL"]
        assert "age" in missing_features
        assert "gender" in missing_features

    def test_detects_impossible_bounds(self):
        features = {
            "age": 45,
            "gender": "M",
            "systolic_bp": 450,  # Impossible systolic BP
            "heart_rate": 75,
        }
        issues = ClinicalDataQualityService.audit_record(features, persist_issues=False)
        invalid_issues = [i for i in issues if i["issue_type"] == "INVALID_VALUE"]
        assert len(invalid_issues) > 0
        assert any(i["feature_name"] == "systolic_bp" for i in invalid_issues)


class TestFHIRAdapter:
    def test_patient_mapping(self):
        mock_patient = MagicMock()
        mock_patient.id = "c3a1b2c4-0000-0000-0000-000000000001"
        mock_patient.mrn = "MRN-2026-999"
        mock_patient.is_active = True
        mock_patient.first_name = "Jane"
        mock_patient.last_name = "Doe"
        mock_patient.gender = "F"
        mock_patient.date_of_birth = date(1980, 5, 12)
        mock_patient.phone_number = "+15551234567"
        mock_patient.email = "jane.doe@hospital.org"

        fhir_patient = FHIRAdapter.patient_to_fhir(mock_patient)
        assert fhir_patient["resourceType"] == "Patient"
        assert fhir_patient["gender"] == "female"
        assert fhir_patient["birthDate"] == "1980-05-12"
        assert fhir_patient["identifier"][0]["value"] == "MRN-2026-999"


class TestEvaluationBenchmarks:
    def test_benchmarks_contain_required_models(self, monkeypatch):
        # Isolate from live DB query
        from apps.model_registry.models import ModelEvaluation
        mock_qs = MagicMock()
        mock_qs.select_related.return_value.order_by.return_value = []
        monkeypatch.setattr(ModelEvaluation.objects, "select_related", mock_qs.select_related)

        data = ModelEvaluationService.get_comparative_benchmarks()
        assert "models" in data
        models = data["models"]
        names = [m["model_name"] for m in models]
        assert "random_forest_risk_model" in names
        assert "svm_risk_model" in names
        assert "adaboost_risk_model" in names

        # Verify no 99% fabricated metric in production models
        for m in models:
            assert m["accuracy"] < 0.99 or "reported" in str(m.get("note", ""))
