"""
Object-Oriented Model Trainer Architecture — BPY-CSE-2666.

Provides an extensible, modular trainer hierarchy adhering strictly to:
- Deterministic seeding and reproducibility
- Patient-level split isolation (zero leakage)
- Standardized lifecycle interfaces (train, calibrate, evaluate, serialize)
- Integrated post-hoc probability calibration (Platt/Isotonic)
"""
from abc import ABC, abstractmethod
import hashlib
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator
from sklearn.ensemble import AdaBoostClassifier, RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC

from ml.calibration.calibrator import ClinicalProbabilityCalibrator
from ml.data.loader import load_and_split_data
from ml.evaluation.evaluator import evaluate_model
from ml.evaluation.fairness import ClinicalFairnessEvaluator
from ml.preprocessing.pipeline import build_preprocessing_pipeline

logger = logging.getLogger(__name__)


class BaseModelTrainer(ABC):
    """
    Abstract Base Class for all Clinical Risk Model Trainers.
    Enforces reproducible training pipelines, evaluation gates, and artifact validation.
    """

    def __init__(
        self,
        model_name: str,
        version: str = "1.0.0",
        random_state: int = 42,
        hyperparameters: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.model_name = model_name
        self.version = version
        self.random_state = random_state
        self.hyperparameters = hyperparameters or {}
        self.pipeline: Optional[Pipeline] = None
        self.calibrator: Optional[ClinicalProbabilityCalibrator] = None
        self.evaluation_results: Dict[str, Any] = {}
        self.fairness_results: Dict[str, Any] = {}
        self.artifact_path: Optional[Path] = None
        self.checksum: Optional[str] = None

    @abstractmethod
    def build_estimator(self) -> BaseEstimator:
        """Instantiate algorithm-specific scikit-learn estimator."""
        pass

    def build_pipeline(self) -> Pipeline:
        """Construct full pipeline with clinical preprocessing and estimator."""
        estimator = self.build_estimator()
        return Pipeline([
            ("preprocessing", build_preprocessing_pipeline()),
            ("classifier", estimator),
        ])

    def train(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: Optional[pd.DataFrame] = None,
        y_val: Optional[pd.Series] = None,
        calibrate: bool = True,
        calibration_method: str = "sigmoid",
    ) -> Pipeline:
        """
        Fit pipeline strictly on training split and calibrate on validation split.
        """
        logger.info("[%s v%s] Fitting pipeline on %d training samples", self.model_name, self.version, len(X_train))
        self.pipeline = self.build_pipeline()
        self.pipeline.fit(X_train, y_train)

        if calibrate and X_val is not None and y_val is not None:
            logger.info("[%s v%s] Calibrating probabilities on %d validation samples", self.model_name, self.version, len(X_val))
            self.calibrator = ClinicalProbabilityCalibrator(
                base_estimator=self.pipeline,
                method=calibration_method,
            )
            self.calibrator.fit(X_val, y_val)

        return self.pipeline

    def evaluate(
        self,
        X_test: pd.DataFrame,
        y_test: pd.Series,
        eval_fairness: bool = True,
    ) -> Dict[str, Any]:
        """
        Comprehensive clinical evaluation on held-out test split.
        """
        if self.pipeline is None:
            raise RuntimeError("Cannot evaluate model before training.")

        predictor = self.calibrator if self.calibrator is not None else self.pipeline
        y_pred = predictor.predict(X_test)
        y_prob = predictor.predict_proba(X_test)

        self.evaluation_results = evaluate_model(
            y_true=y_test,
            y_pred=y_pred,
            y_prob=y_prob,
        )

        if eval_fairness:
            try:
                fairness_eval = ClinicalFairnessEvaluator()
                self.fairness_results = fairness_eval.evaluate(
                    df_test=X_test,
                    y_true=y_test,
                    y_pred=y_pred,
                )
            except Exception as exc:
                logger.warning("[%s] Fairness evaluation warning: %s", self.model_name, exc)
                self.fairness_results = {"status": "SKIPPED", "error": str(exc)}

        return self.evaluation_results

    def save_artifact(self, output_dir: Union[str, Path]) -> Tuple[Path, str]:
        """
        Safely serialize pipeline and calculate SHA-256 integrity checksum.
        """
        if self.pipeline is None:
            raise RuntimeError("Cannot save untrained model artifact.")

        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        artifact_file = out_path / f"{self.model_name}_{self.version}.joblib"

        target_to_save = self.calibrator if self.calibrator is not None else self.pipeline
        joblib.dump(target_to_save, artifact_file, compress=3)

        # Compute SHA-256
        sha256 = hashlib.sha256()
        with open(artifact_file, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)

        self.artifact_path = artifact_file
        self.checksum = sha256.hexdigest()
        logger.info("[%s v%s] Serialized artifact to %s (SHA-256: %s)", self.model_name, self.version, artifact_file, self.checksum[:16])
        return artifact_file, self.checksum


class SVMTrainer(BaseModelTrainer):
    """Support Vector Machine Clinical Risk Trainer."""

    def __init__(
        self,
        model_name: str = "svm_risk_model",
        version: str = "1.0.0",
        random_state: int = 42,
        hyperparameters: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(model_name, version, random_state, hyperparameters)

    def build_estimator(self) -> BaseEstimator:
        params = self.hyperparameters
        return SVC(
            probability=True,
            kernel=params.get("kernel", "rbf"),
            C=params.get("C", 1.0),
            class_weight=params.get("class_weight", "balanced"),
            random_state=self.random_state,
        )


class RandomForestTrainer(BaseModelTrainer):
    """Random Forest Ensemble Clinical Risk Trainer (Production Champion)."""

    def __init__(
        self,
        model_name: str = "random_forest_risk_model",
        version: str = "1.0.0",
        random_state: int = 42,
        hyperparameters: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(model_name, version, random_state, hyperparameters)

    def build_estimator(self) -> BaseEstimator:
        params = self.hyperparameters
        return RandomForestClassifier(
            n_estimators=params.get("n_estimators", 200),
            max_depth=params.get("max_depth", 12),
            min_samples_split=params.get("min_samples_split", 2),
            class_weight=params.get("class_weight", "balanced"),
            random_state=self.random_state,
            n_jobs=-1,
        )


class AdaBoostTrainer(BaseModelTrainer):
    """AdaBoost Adaptive Boosting Clinical Risk Trainer."""

    def __init__(
        self,
        model_name: str = "adaboost_risk_model",
        version: str = "1.0.0",
        random_state: int = 42,
        hyperparameters: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(model_name, version, random_state, hyperparameters)

    def build_estimator(self) -> BaseEstimator:
        params = self.hyperparameters
        return AdaBoostClassifier(
            n_estimators=params.get("n_estimators", 100),
            learning_rate=params.get("learning_rate", 0.8),
            random_state=self.random_state,
        )
