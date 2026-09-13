"""
Production Inference Engine for Clinical Risk Models.
Ensures zero training-serving skew by executing the exact fitted scikit-learn
Pipeline with cryptographic artifact verification, multi-class probabilities,
uncertainty evaluation, OOD detection, and TreeSHAP explainability attributions.
"""
import time
from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from ml.explainability.explainer import explain_prediction
from ml.features.schema import TARGET_CLASSES, validate_features
from ml.inference.ood_detector import OODStatus, OutOfDistributionDetector
from ml.inference.uncertainty import ClinicalUncertaintyEstimator, ConfidenceLevel
from ml.registry.model_registry import ModelRegistry


class InferenceEngine:
    """
    Production-grade clinical inference engine.
    Integrates discrimination, calibration, predictive uncertainty, OOD monitoring,
    and explainability into a unified pipeline.
    """

    def __init__(
        self,
        model_name: str,
        version: Optional[str] = None,
        registry: Optional[ModelRegistry] = None,
        verify_integrity: bool = True,
    ) -> None:
        self.model_name = model_name
        self.registry = registry or ModelRegistry()
        self.pipeline, self.metadata, self.evaluation = self.registry.load_model(
            name=model_name, version=version, verify_integrity=verify_integrity
        )
        self.version = self.metadata.get("version", version or "latest")
        self.classes = list(getattr(self.pipeline, "classes_", TARGET_CLASSES))

        # Initialize Uncertainty & OOD components
        self.uncertainty_estimator = ClinicalUncertaintyEstimator()
        self.ood_detector = OutOfDistributionDetector()

    def predict_record(
        self,
        record: Dict[str, Any],
        include_explanation: bool = True,
    ) -> Dict[str, Any]:
        """
        Execute real-time inference for a single patient clinical observation record.
        """
        start_time = time.perf_counter()

        # 1. Validate and structure input DataFrame in canonical feature order
        df = validate_features(record)

        # 2. Out-of-Distribution Check
        ood_result = self.ood_detector.evaluate_record(record)
        is_ood = (ood_result.status == OODStatus.OUT_OF_DISTRIBUTION)

        # 3. Model Inference through fitted Pipeline
        pred_arr = self.pipeline.predict(df)
        predicted_class = str(pred_arr[0])

        probabilities: Dict[str, float] = {}
        if hasattr(self.pipeline, "predict_proba"):
            proba_arr = self.pipeline.predict_proba(df)[0]
            probabilities = {
                str(cls): round(float(prob), 4) for cls, prob in zip(self.classes, proba_arr)
            }
        else:
            probabilities = {predicted_class: 1.0}

        # 4. Multi-class Uncertainty & Abstention Evaluation
        uncertainty = self.uncertainty_estimator.evaluate(
            probabilities=probabilities,
            is_ood=is_ood,
            ood_reason=ood_result.details if is_ood else None,
        )

        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        result: Dict[str, Any] = {
            "prediction": predicted_class,
            "predicted_class": predicted_class,
            "confidence": round(uncertainty.top_probability, 4),
            "confidence_level": uncertainty.confidence_level.value,
            "should_abstain": uncertainty.should_abstain,
            "uncertainty_assessment": uncertainty.to_dict(),
            "ood_assessment": ood_result.to_dict(),
            "probabilities": probabilities,
            "inference_latency_ms": latency_ms,
            "model_name": self.model_name,
            "model_version": self.version,
        }

        # 5. Explainability Attributions
        if include_explanation:
            result["explanation"] = explain_prediction(
                pipeline=self.pipeline,
                input_data=record,
                predicted_class=predicted_class,
            )

        return result

    def predict_batch(
        self,
        records: Union[List[Dict[str, Any]], pd.DataFrame],
    ) -> List[Dict[str, Any]]:
        """
        High-throughput batch inference across multiple patient observation records.
        """
        start_time = time.perf_counter()
        df = validate_features(records)

        preds = self.pipeline.predict(df)
        has_proba = hasattr(self.pipeline, "predict_proba")
        probas = self.pipeline.predict_proba(df) if has_proba else None

        total_latency_ms = (time.perf_counter() - start_time) * 1000.0
        per_item_latency = round(total_latency_ms / max(len(preds), 1), 3)

        results = []
        raw_list = records if isinstance(records, list) else records.to_dict(orient="records")

        for idx, pred in enumerate(preds):
            pred_str = str(pred)
            probs = {}
            if probas is not None:
                probs = {
                    str(cls): round(float(p), 4) for cls, p in zip(self.classes, probas[idx])
                }
            else:
                probs = {pred_str: 1.0}

            uncertainty = self.uncertainty_estimator.evaluate(probabilities=probs)

            results.append(
                {
                    "prediction": pred_str,
                    "confidence": round(uncertainty.top_probability, 4),
                    "confidence_level": uncertainty.confidence_level.value,
                    "should_abstain": uncertainty.should_abstain,
                    "probabilities": probs,
                    "inference_latency_ms": per_item_latency,
                    "model_name": self.model_name,
                    "model_version": self.version,
                }
            )

        return results
