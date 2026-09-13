"""
Model Training and Calibration Orchestrator.
Builds end-to-end scikit-learn Pipelines combining preprocessing transformers and estimators.
Enforces:
- Patient-level group-aware 3-way split (Train 60%, Validation 20%, Test 20%)
- Preprocessing fit ONLY on training data (zero data leakage)
- Post-hoc probability calibration on held-out validation set
- Multi-class discrimination, calibration, and clinical error evaluation on held-out test set
- Demographic fairness assessment across protected subgroups
- Cryptographic SHA-256 artifact hashing and registration into ModelRegistry
- Structured experiment tracking
"""
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union
import numpy as np
from sklearn.ensemble import AdaBoostClassifier, RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC

from ml.calibration.calibrator import ClinicalProbabilityCalibrator
from ml.data.loader import load_and_split_data
from ml.evaluation.evaluator import evaluate_model
from ml.evaluation.fairness import ClinicalFairnessEvaluator
from ml.features.schema import FEATURE_NAMES
from ml.mlops.experiment_tracker import ExperimentTracker
from ml.preprocessing.pipeline import build_preprocessing_pipeline
from ml.registry.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


def get_model_estimator(
    model_type: str, hyperparameters: Optional[Dict[str, Any]] = None
) -> Any:
    """Instantiate scikit-learn estimator with reproducible hyperparameters."""
    model_type = model_type.upper()
    params = hyperparameters or {}

    if model_type == "SVM":
        return SVC(
            probability=True,
            kernel=params.get("kernel", "rbf"),
            C=params.get("C", 1.0),
            class_weight=params.get("class_weight", "balanced"),
            random_state=params.get("random_state", 42),
        )

    if model_type in ("RANDOM_FOREST", "RF"):
        return RandomForestClassifier(
            n_estimators=params.get("n_estimators", 100),
            max_depth=params.get("max_depth", 12),
            class_weight=params.get("class_weight", "balanced"),
            random_state=params.get("random_state", 42),
            n_jobs=-1,
        )

    if model_type == "ADABOOST":
        return AdaBoostClassifier(
            n_estimators=params.get("n_estimators", 100),
            learning_rate=params.get("learning_rate", 0.8),
            random_state=params.get("random_state", 42),
        )

    raise ValueError(
        f"Unsupported model type '{model_type}'. Supported types: 'SVM', 'RANDOM_FOREST', 'ADABOOST'."
    )


def train_and_evaluate_model(
    model_type: str,
    data_path: Optional[Union[str, Path]] = None,
    version: str = "1.0.0",
    dataset_name: str = "clinical_risk_v1",
    hyperparameters: Optional[Dict[str, Any]] = None,
    registry: Optional[ModelRegistry] = None,
    calibrate: bool = True,
    status: str = "VALIDATED",
) -> Dict[str, Any]:
    """
    Execute full training, calibration, and evaluation lifecycle:
    1. Load data with patient-level group split (Train 60%, Val 20%, Test 20%).
    2. Fit scikit-learn ColumnTransformer strictly on X_train.
    3. Fit estimator on X_train.
    4. Fit probability calibrator on X_val (Platt scaling / Sigmoid).
    5. Evaluate on held-out test data (Discrimination, Brier, Confusion matrix, Specificity, Sensitivity).
    6. Evaluate demographic fairness across gender and age cohorts.
    7. Persist pipeline with SHA-256 hash in ModelRegistry.
    8. Record in ExperimentTracker.
    """
    model_name = f"{model_type.lower()}_risk_model"
    logger.info("Starting training for %s v%s", model_name, version)

    # 1. 3-way Group-Aware Split (zero patient leakage)
    X_train, X_val, X_test, y_train, y_val, y_test = load_and_split_data(
        data_path=data_path,
        test_size=0.20,
        val_size=0.20,
        random_state=42,
        return_validation=True,
    )

    # 2. Build Pipeline (Preprocessor is fitted only on training data!)
    preprocessor = build_preprocessing_pipeline()
    estimator = get_model_estimator(model_type, hyperparameters)

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", estimator),
        ]
    )

    # 3. Fit pipeline on training partition
    pipeline.fit(X_train, y_train)

    # 4. Fit probability calibrator on held-out validation set if requested
    calibration_report: Dict[str, Any] = {}
    final_pipeline = pipeline

    if calibrate and hasattr(pipeline, "predict_proba"):
        try:
            calibrator = ClinicalProbabilityCalibrator(method="sigmoid")
            calibrated_pipe = calibrator.fit_calibration(pipeline, X_val, y_val)
            final_pipeline = calibrated_pipe
            calibration_report = calibrator.calibration_report
        except Exception as cal_err:
            logger.warning("Probability calibration skipped: %s", cal_err)

    # 5. Evaluate final pipeline on held-out test partition
    evaluation_metrics = evaluate_model(final_pipeline, X_test, y_test)
    if calibration_report:
        evaluation_metrics["calibration_tuning"] = calibration_report

    # 6. Evaluate Demographic Fairness
    fairness_evaluator = ClinicalFairnessEvaluator()
    fairness_metrics = fairness_evaluator.evaluate_fairness(final_pipeline, X_test, y_test)
    evaluation_metrics["fairness_evaluation"] = fairness_metrics

    # 7. Persist in Model Registry with SHA-256 hash
    model_reg = registry or ModelRegistry()
    artifact_dir = model_reg.save_model(
        name=model_name,
        version=version,
        pipeline=final_pipeline,
        model_type=model_type.upper(),
        dataset_name=dataset_name,
        hyperparameters=hyperparameters or {},
        metrics=evaluation_metrics,
        feature_names=FEATURE_NAMES,
        status=status,
    )

    # Read the artifact hash from metadata
    import json
    with open(artifact_dir / "metadata.json", "r", encoding="utf-8") as f:
        meta_saved = json.load(f)
    artifact_hash = meta_saved.get("artifact_hash")

    # 8. Log Experiment Run
    tracker = ExperimentTracker()
    tracker.log_experiment(
        model_name=model_name,
        algorithm=model_type.upper(),
        hyperparameters=hyperparameters or {},
        dataset_name=dataset_name,
        dataset_version="1.0.0",
        metrics=evaluation_metrics,
        artifact_path=str(artifact_dir / "pipeline.joblib"),
        artifact_hash=artifact_hash,
    )

    return {
        "name": model_name,
        "version": version,
        "model_type": model_type.upper(),
        "status": status,
        "artifact_dir": str(artifact_dir),
        "artifact_hash": artifact_hash,
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "metrics": evaluation_metrics,
    }
