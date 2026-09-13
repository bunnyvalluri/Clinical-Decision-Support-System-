"""
Inference Engine for clinical risk models.
Ensures zero training-serving skew by executing the exact fitted scikit-learn
Pipeline without manual ad-hoc preprocessing.
"""
import time
from typing import Any
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from ml.explainability.explainer import explain_prediction
from ml.features.schema import TARGET_CLASSES, validate_features
from ml.registry.model_registry import ModelRegistry


class InferenceEngine:
    """
    Production-grade inference engine.
    Loads versioned pipeline artifacts and provides single and batch prediction methods
    with execution latency tracking, class probabilities, and explainability attributions.
    """

    def __init__(
        self,
        model_name: str,
        version: str | None = None,
        registry: ModelRegistry | None = None,
    ) -> None:
        self.model_name = model_name
        self.registry = registry or ModelRegistry()
        self.pipeline, self.metadata, self.evaluation = self.registry.load_model(
            name=model_name, version=version
        )
        self.version = self.metadata.get("version", version or "latest")
        self.classes = list(getattr(self.pipeline, "classes_", TARGET_CLASSES))

    def predict_record(
        self, record: dict[str, Any], include_explanation: bool = True
    ) -> dict[str, Any]:
        """
        Execute inference for a single patient clinical observation record.
        """
        start_time = time.perf_counter()

        # Validate and structure input DataFrame in canonical feature order
        df = validate_features(record)

        # Run model inference through the exact fitted Pipeline
        pred_arr = self.pipeline.predict(df)
        predicted_class = str(pred_arr[0])

        probabilities: dict[str, float] = {}
        confidence = 1.0

        if hasattr(self.pipeline, "predict_proba"):
            proba_arr = self.pipeline.predict_proba(df)[0]
            probabilities = {
                cls: round(float(prob), 4) for cls, prob in zip(self.classes, proba_arr)
            }
            confidence = float(np.max(proba_arr))

        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        result: dict[str, Any] = {
            "prediction": predicted_class,
            "confidence": round(confidence, 4),
            "probabilities": probabilities,
            "inference_latency_ms": latency_ms,
            "model_name": self.model_name,
            "model_version": self.version,
        }

        if include_explanation:
            result["explanation"] = explain_prediction(
                pipeline=self.pipeline,
                input_data=record,
                predicted_class=predicted_class,
            )

        return result

    def predict_batch(
        self, records: list[dict[str, Any]] | pd.DataFrame
    ) -> list[dict[str, Any]]:
        """
        Execute batch inference across multiple patient records.
        """
        start_time = time.perf_counter()
        df = validate_features(records)

        preds = self.pipeline.predict(df)
        has_proba = hasattr(self.pipeline, "predict_proba")
        probas = self.pipeline.predict_proba(df) if has_proba else None

        total_latency_ms = (time.perf_counter() - start_time) * 1000.0
        per_item_latency = round(total_latency_ms / max(len(preds), 1), 2)

        results = []
        for idx, pred in enumerate(preds):
            pred_str = str(pred)
            probs = {}
            conf = 1.0
            if probas is not None:
                probs = {
                    cls: round(float(p), 4) for cls, p in zip(self.classes, probas[idx])
                }
                conf = float(np.max(probas[idx]))

            results.append(
                {
                    "prediction": pred_str,
                    "confidence": round(conf, 4),
                    "probabilities": probs,
                    "inference_latency_ms": per_item_latency,
                    "model_name": self.model_name,
                    "model_version": self.version,
                }
            )

        return results
