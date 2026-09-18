"""
Model abstraction layer for Clinical Decision Support System — BPY-CSE-2666.

Defines the BaseRiskModel interface and concrete implementations:
- SVCRiskModel: Support Vector Classifier with Platt probability calibration.
- RandomForestRiskModel: Ensembled decision forest with TreeSHAP compatibility.
- AdaBoostRiskModel: Adaptive boosting classifier for non-linear clinical boundaries.

All models share the same versioned preprocessing pipeline to guarantee zero training-serving skew.
"""
from abc import ABC, abstractmethod
import hashlib
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator
from sklearn.pipeline import Pipeline

from ml.features.schema import validate_features
from ml.preprocessing.pipeline import build_preprocessing_pipeline

logger = logging.getLogger(__name__)


class BaseRiskModel(ABC):
    """
    Abstract Base Interface for all Clinical Risk Prediction Models.
    Enforces identical preprocessing, reproducible prediction, probability calibration,
    and metadata tracking across model families.
    """

    def __init__(
        self,
        model_name: str,
        algorithm_family: str,
        version: str = "1.0.0",
        preprocessing_version: str = "v1.0",
    ) -> None:
        self.model_name = model_name
        self.algorithm_family = algorithm_family
        self.version = version
        self.preprocessing_version = preprocessing_version
        self.pipeline: Optional[Pipeline] = None
        self.classes_: List[str] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    @abstractmethod
    def build_estimator(self) -> BaseEstimator:
        """Instantiate the algorithm-specific scikit-learn estimator."""
        pass

    def get_preprocessing_pipeline(self) -> Any:
        """Returns the reproducible scikit-learn preprocessing ColumnTransformer."""
        return build_preprocessing_pipeline()

    def build_full_pipeline(self) -> Pipeline:
        """Compose preprocessing and estimator into a unified Pipeline."""
        return Pipeline([
            ("preprocessing", self.get_preprocessing_pipeline()),
            ("classifier", self.build_estimator()),
        ])

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Execute risk classification inference."""
        if self.pipeline is None:
            raise RuntimeError(f"Model {self.model_name} v{self.version} has not been loaded or trained.")
        return self.pipeline.predict(df)

    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """Return calibrated multi-class risk probabilities."""
        if self.pipeline is None:
            raise RuntimeError(f"Model {self.model_name} v{self.version} has not been loaded or trained.")
        if hasattr(self.pipeline, "predict_proba"):
            return self.pipeline.predict_proba(df)
        # Fallback binary pseudo-probabilities
        preds = self.predict(df)
        probs = np.zeros((len(df), len(self.classes_)))
        for i, p in enumerate(preds):
            idx = self.classes_.index(p) if p in self.classes_ else 0
            probs[i, idx] = 1.0
        return probs

    def fit(self, X: pd.DataFrame, y: pd.Series, **kwargs) -> Pipeline:
        """Fit the unified preprocessing and classifier pipeline."""
        self.pipeline = self.build_full_pipeline()
        self.pipeline.fit(X, y)
        if hasattr(self.pipeline, "classes_"):
            self.classes_ = list(self.pipeline.classes_)
        return self.pipeline

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series, **kwargs) -> Dict[str, Any]:
        """Evaluate model against held-out validation or test cohort."""
        from ml.evaluation.evaluator import evaluate_model
        y_pred = self.predict(X_test)
        y_prob = self.predict_proba(X_test)
        return evaluate_model(y_true=y_test, y_pred=y_pred, y_prob=y_prob)

    def explain(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Generate TreeSHAP or feature-importance attributions for clinical observation record."""
        from ml.explainability.explainer import explain_prediction
        df = self.validate_schema(record)
        return explain_prediction(pipeline=self.pipeline, input_df=df, model_name=self.model_name)

    def validate_schema(self, record: Dict[str, Any]) -> pd.DataFrame:
        """Validate input dictionary and format canonical feature DataFrame."""
        return validate_features(record)

    def save(self, path: Union[str, Path]) -> str:
        """Serialize model artifact to disk and compute SHA-256 integrity hash."""
        if self.pipeline is None:
            raise RuntimeError(f"Cannot serialize uninitialized or unfitted pipeline for {self.model_name}.")
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.pipeline, p, compress=3)
        sha256 = hashlib.sha256()
        with open(p, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    def load(self, path: Union[str, Path]) -> None:
        """Load serialized model artifact from persistent storage."""
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Model artifact not found at {p}")
        self.pipeline = joblib.load(p)
        if hasattr(self.pipeline, "classes_"):
            self.classes_ = list(self.pipeline.classes_)

    def get_metadata(self) -> Dict[str, Any]:
        """Return model metadata, architecture details, and version provenance."""
        return {
            "model_name": self.model_name,
            "algorithm": self.algorithm_family,
            "version": self.version,
            "preprocessing_version": self.preprocessing_version,
            "classes": self.classes_,
        }


class SVCRiskModel(BaseRiskModel):
    """
    Support Vector Machine Risk Model with RBF Kernel and Platt Scaling.
    Effective for high-dimensional clinical biomarkers with non-linear decision boundaries.
    """

    def __init__(
        self,
        model_name: str = "svm_risk_model",
        version: str = "1.0.0",
        c_param: float = 1.0,
        kernel: str = "rbf",
        random_state: int = 42,
    ) -> None:
        super().__init__(model_name=model_name, algorithm_family="Support Vector Classifier (SVC)", version=version)
        self.c_param = c_param
        self.kernel = kernel
        self.random_state = random_state

    def build_estimator(self) -> BaseEstimator:
        from sklearn.svm import SVC
        return SVC(
            C=self.c_param,
            kernel=self.kernel,
            probability=True,  # Enables Platt scaling for calibrated probabilities
            class_weight="balanced",
            random_state=self.random_state,
        )


class RandomForestRiskModel(BaseRiskModel):
    """
    Random Forest Ensemble Risk Model.
    Primary production champion with 100-200 decorrelated decision trees and TreeSHAP compatibility.
    """

    def __init__(
        self,
        model_name: str = "random_forest_risk_model",
        version: str = "1.0.0",
        n_estimators: int = 150,
        max_depth: int = 8,
        random_state: int = 42,
    ) -> None:
        super().__init__(model_name=model_name, algorithm_family="Random Forest Ensemble", version=version)
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state

    def build_estimator(self) -> BaseEstimator:
        from sklearn.ensemble import RandomForestClassifier
        return RandomForestClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            min_samples_split=3,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=self.random_state,
            n_jobs=-1,
        )


class AdaBoostRiskModel(BaseRiskModel):
    """
    Adaptive Boosting (AdaBoost) Risk Model.
    Sequentially reweights borderline clinical encounters to maximize sensitivity on high-risk patients.
    """

    def __init__(
        self,
        model_name: str = "adaboost_risk_model",
        version: str = "1.0.0",
        n_estimators: int = 100,
        learning_rate: float = 0.8,
        random_state: int = 42,
    ) -> None:
        super().__init__(model_name=model_name, algorithm_family="AdaBoost Classifier", version=version)
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.random_state = random_state

    def build_estimator(self) -> BaseEstimator:
        from sklearn.ensemble import AdaBoostClassifier
        return AdaBoostClassifier(
            n_estimators=self.n_estimators,
            learning_rate=self.learning_rate,
            random_state=self.random_state,
        )


# Backward and Domain Standard Aliases
BaseRiskPredictionModel = BaseRiskModel
SVMRiskModel = SVCRiskModel
