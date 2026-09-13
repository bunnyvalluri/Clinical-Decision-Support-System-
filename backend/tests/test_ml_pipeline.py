"""
Automated test suite for the Machine Learning Pipeline.

Tests:
1. Preprocessing consistency (missing values, unseen categories, feature reordering, scaling)
2. Train/Test separation and data leakage avoidance
3. Model training across SVM, Random Forest, and AdaBoost
4. Multi-class evaluation metrics (accuracy, precision, recall, F1, ROC-AUC, confusion matrix)
5. Inference engine consistency between single record and batch
6. Explainability and clinical risk factor attributions
"""
import numpy as np
import pandas as pd
import pytest

from ml.data.loader import load_and_split_data
from ml.evaluation.evaluator import evaluate_model
from ml.explainability.explainer import explain_prediction, get_clinical_risk_description
from ml.features.schema import (
    CATEGORICAL_FEATURES,
    FEATURE_NAMES,
    NUMERICAL_FEATURES,
    TARGET_CLASSES,
    validate_features,
)
from ml.inference.engine import InferenceEngine
from ml.preprocessing.pipeline import build_preprocessing_pipeline
from ml.registry.model_registry import ModelRegistry
from ml.training.train import get_model_estimator, train_and_evaluate_model


# ---------------------------------------------------------------------------
# 1. Preprocessing Consistency Tests
# ---------------------------------------------------------------------------
class TestPreprocessingPipeline:
    def test_handles_missing_numerical_and_categorical_values(self):
        preprocessor = build_preprocessing_pipeline()

        # Training data
        train_df = pd.DataFrame([
            {
                "age": 50.0, "systolic_bp": 120, "diastolic_bp": 80, "heart_rate": 72,
                "respiratory_rate": 16, "body_temperature": 37.0, "oxygen_saturation": 98.0,
                "glucose_level": 95.0, "cholesterol_total": 190.0, "bmi": 24.0,
                "creatinine": 1.0, "sodium": 140.0, "calcium": 9.5, "lactic_acid": 1.2,
                "gender": "MALE", "encounter_type": "ROUTINE",
            },
            {
                "age": 60.0, "systolic_bp": 140, "diastolic_bp": 90, "heart_rate": 88,
                "respiratory_rate": 20, "body_temperature": 37.5, "oxygen_saturation": 95.0,
                "glucose_level": 130.0, "cholesterol_total": 220.0, "bmi": 28.0,
                "creatinine": 1.4, "sodium": 138.0, "calcium": 9.0, "lactic_acid": 2.0,
                "gender": "FEMALE", "encounter_type": "OUTPATIENT",
            },
        ])

        preprocessor.fit(train_df)

        # Incomplete test data with NaNs and None
        test_df = pd.DataFrame([
            {
                "age": np.nan, "systolic_bp": 130, "diastolic_bp": 85, "heart_rate": np.nan,
                "respiratory_rate": 18, "body_temperature": 37.2, "oxygen_saturation": 96.0,
                "glucose_level": np.nan, "cholesterol_total": None, "bmi": 26.0,
                "creatinine": 1.2, "sodium": np.nan, "calcium": 9.2, "lactic_acid": 1.5,
                "gender": None, "encounter_type": np.nan,
            }
        ])

        transformed = preprocessor.transform(test_df)
        assert transformed is not None
        assert not np.isnan(transformed).any(), "Preprocessing should impute all NaNs"

    def test_handles_unseen_categorical_levels_gracefully(self):
        preprocessor = build_preprocessing_pipeline()

        train_df = pd.DataFrame([
            {**{f: 50.0 for f in NUMERICAL_FEATURES}, "gender": "MALE", "encounter_type": "ROUTINE"},
            {**{f: 60.0 for f in NUMERICAL_FEATURES}, "gender": "FEMALE", "encounter_type": "OUTPATIENT"},
        ])
        preprocessor.fit(train_df)

        # Completely novel, unseen categorical values
        test_df = pd.DataFrame([
            {**{f: 55.0 for f in NUMERICAL_FEATURES}, "gender": "NOVEL_GENDER", "encounter_type": "SPACE_CLINIC"},
        ])

        transformed = preprocessor.transform(test_df)
        assert transformed.shape[0] == 1
        assert not np.isnan(transformed).any()

    def test_feature_reordering_resilience(self):
        # Shuffled keys vs canonical order
        shuffled_dict = {
            "encounter_type": "EMERGENCY",
            "glucose_level": 110.0,
            "age": 45.0,
            "gender": "FEMALE",
            "systolic_bp": 130,
            "heart_rate": 78,
            "diastolic_bp": 82,
            "calcium": 9.3,
            "sodium": 141.0,
            "lactic_acid": 1.4,
            "creatinine": 1.1,
            "bmi": 25.4,
            "respiratory_rate": 17,
            "body_temperature": 36.9,
            "oxygen_saturation": 97.5,
            "cholesterol_total": 195.0,
        }

        df_shuffled = validate_features(shuffled_dict)
        assert list(df_shuffled.columns) == FEATURE_NAMES


# ---------------------------------------------------------------------------
# 2. Train/Test Separation & Data Leakage Tests
# ---------------------------------------------------------------------------
class TestDataSeparation:
    def test_train_test_split_disjoint_and_stratified(self):
        X_train, X_test, y_train, y_test = load_and_split_data(test_size=0.25, random_state=42)

        # 1. Zero index overlap (strict disjointness)
        assert len(set(X_train.index).intersection(set(X_test.index))) == 0

        # 2. Stratification: All target classes present in both splits
        for cls in TARGET_CLASSES:
            assert (y_train == cls).sum() > 0
            assert (y_test == cls).sum() > 0

        # 3. Ratio check (approximately 75/25)
        total_samples = len(X_train) + len(X_test)
        assert abs(len(X_test) / total_samples - 0.25) < 0.02


# ---------------------------------------------------------------------------
# 3. Model Training & Evaluation Tests
# ---------------------------------------------------------------------------
class TestModelTrainingAndEvaluation:
    @pytest.mark.parametrize("model_type", ["SVM", "RANDOM_FOREST", "ADABOOST"])
    def test_train_and_evaluate_all_model_types(self, tmp_path, model_type):
        registry = ModelRegistry(base_dir=tmp_path)
        res = train_and_evaluate_model(
            model_type=model_type,
            version="1.0.0",
            registry=registry,
        )

        assert res["name"] == f"{model_type.lower()}_risk_model"
        assert res["version"] == "1.0.0"
        metrics = res["metrics"]

        # Global metrics presence and validity
        assert 0.0 <= metrics["accuracy"] <= 1.0
        assert 0.0 <= metrics["precision_macro"] <= 1.0
        assert 0.0 <= metrics["recall_macro"] <= 1.0
        assert 0.0 <= metrics["f1_macro"] <= 1.0
        assert len(metrics["confusion_matrix"]) == len(TARGET_CLASSES)
        assert metrics["class_labels"] == TARGET_CLASSES

        # Class-wise metrics presence
        for cls in TARGET_CLASSES:
            assert cls in metrics["class_wise_metrics"]
            cls_m = metrics["class_wise_metrics"][cls]
            assert "precision" in cls_m
            assert "recall" in cls_m
            assert "f1_score" in cls_m
            assert cls_m["support"] > 0


# ---------------------------------------------------------------------------
# 4. Inference Consistency & Explainability Tests
# ---------------------------------------------------------------------------
class TestInferenceAndExplainability:
    def test_inference_engine_single_and_batch_consistency(self):
        engine = InferenceEngine(model_name="random_forest_risk_model", version="1.0.0")

        sample_record_1 = {
            "age": 28.0,
            "systolic_bp": 118,
            "diastolic_bp": 75,
            "heart_rate": 68,
            "respiratory_rate": 15,
            "body_temperature": 36.7,
            "oxygen_saturation": 99.0,
            "glucose_level": 88.0,
            "cholesterol_total": 175.0,
            "bmi": 22.0,
            "creatinine": 0.85,
            "sodium": 141.0,
            "calcium": 9.6,
            "lactic_acid": 0.95,
            "gender": "FEMALE",
            "encounter_type": "ROUTINE",
        }

        sample_record_2 = {
            "age": 72.0,
            "systolic_bp": 185,
            "diastolic_bp": 110,
            "heart_rate": 135,
            "respiratory_rate": 32,
            "body_temperature": 39.5,
            "oxygen_saturation": 82.0,
            "glucose_level": 280.0,
            "cholesterol_total": 240.0,
            "bmi": 32.5,
            "creatinine": 3.4,
            "sodium": 129.0,
            "calcium": 7.9,
            "lactic_acid": 5.2,
            "gender": "MALE",
            "encounter_type": "ICU",
        }

        # 1. Single prediction
        pred_single_1 = engine.predict_record(sample_record_1)
        assert pred_single_1["prediction"] in TARGET_CLASSES
        assert pred_single_1["confidence"] >= 0.25
        assert pred_single_1["inference_latency_ms"] >= 0.0
        assert abs(sum(pred_single_1["probabilities"].values()) - 1.0) < 0.01

        # 2. Critical patient prediction should detect severe instability
        pred_single_2 = engine.predict_record(sample_record_2)
        assert pred_single_2["prediction"] in ("HIGH", "CRITICAL")

        # 3. Batch prediction matching
        batch_results = engine.predict_batch([sample_record_1, sample_record_2])
        assert len(batch_results) == 2
        assert batch_results[0]["prediction"] == pred_single_1["prediction"]
        assert batch_results[1]["prediction"] == pred_single_2["prediction"]

    def test_explainability_attributions(self):
        engine = InferenceEngine(model_name="random_forest_risk_model", version="1.0.0")

        severe_patient = {
            "age": 68.0,
            "systolic_bp": 82,
            "diastolic_bp": 50,
            "heart_rate": 138,
            "respiratory_rate": 30,
            "body_temperature": 35.2,
            "oxygen_saturation": 84.0,
            "glucose_level": 290.0,
            "cholesterol_total": 210.0,
            "bmi": 30.0,
            "creatinine": 3.8,
            "sodium": 128.0,
            "calcium": 7.6,
            "lactic_acid": 5.8,
            "gender": "MALE",
            "encounter_type": "EMERGENCY",
        }

        explanation = explain_prediction(
            pipeline=engine.pipeline,
            input_data=severe_patient,
            predicted_class="CRITICAL",
        )

        assert "top_risk_factors" in explanation
        assert len(explanation["top_risk_factors"]) > 0
        top_factor = explanation["top_risk_factors"][0]
        assert "feature" in top_factor
        assert "importance" in top_factor
        assert "clinical_description" in top_factor

    def test_clinical_risk_description_formatting(self):
        desc_spo2 = get_clinical_risk_description("oxygen_saturation", 88.0)
        assert "Hypoxemia" in desc_spo2

        desc_hr = get_clinical_risk_description("heart_rate", 130)
        assert "Tachycardia" in desc_hr

        desc_lactate = get_clinical_risk_description("lactic_acid", 4.5)
        assert "hyperlactatemia" in desc_lactate
