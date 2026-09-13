"""
Model training orchestrator.
Builds end-to-end pipelines combining preprocessors and estimators, fits on train split,
evaluates on held-out test split, and persists versioned artifacts into the registry.
"""
import logging
from pathlib import Path
from typing import Any
from sklearn.ensemble import AdaBoostClassifier, RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC

from ml.data.loader import load_and_split_data
from ml.evaluation.evaluator import evaluate_model
from ml.features.schema import FEATURE_NAMES
from ml.preprocessing.pipeline import build_preprocessing_pipeline
from ml.registry.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


def get_model_estimator(
    model_type: str, hyperparameters: dict[str, Any] | None = None
) -> Any:
    """Instantiate scikit-learn estimator for supported model types."""
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
    data_path: str | Path | None = None,
    version: str = "1.0.0",
    dataset_name: str = "clinical_risk_v1",
    hyperparameters: dict[str, Any] | None = None,
    registry: ModelRegistry | None = None,
) -> dict[str, Any]:
    """
    Execute full training lifecycle for an ML model:
    1. Load data with strict train/test split (prevents data leakage).
    2. Build unified scikit-learn pipeline (preprocessor + estimator).
    3. Fit pipeline strictly on X_train, y_train.
    4. Compute complete evaluation metrics on X_test, y_test.
    5. Persist pipeline, metadata, and evaluation results in versioned registry.
    """
    model_name = f"{model_type.lower()}_risk_model"
    logger.info("Starting training for model: %s v%s", model_name, version)

    # 1. Load data with stratified split
    X_train, X_test, y_train, y_test = load_and_split_data(
        data_path=data_path,
        test_size=0.2,
        random_state=42,
    )

    # 2. Build preprocessor and estimator
    preprocessor = build_preprocessing_pipeline()
    estimator = get_model_estimator(model_type, hyperparameters)

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", estimator),
        ]
    )

    # 3. Fit pipeline (Preprocessor is fitted only on training data!)
    pipeline.fit(X_train, y_train)

    # 4. Evaluate on held-out test data
    evaluation_metrics = evaluate_model(pipeline, X_test, y_test)

    # 5. Persist in registry
    model_reg = registry or ModelRegistry()
    artifact_dir = model_reg.save_model(
        name=model_name,
        version=version,
        pipeline=pipeline,
        model_type=model_type.upper(),
        dataset_name=dataset_name,
        hyperparameters=hyperparameters or {},
        metrics=evaluation_metrics,
        feature_names=FEATURE_NAMES,
    )

    return {
        "name": model_name,
        "version": version,
        "model_type": model_type.upper(),
        "artifact_dir": str(artifact_dir),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "metrics": evaluation_metrics,
    }
