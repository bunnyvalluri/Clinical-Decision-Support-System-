"""
RiskPredictionEngine — Core inference engine coordinating preprocessing, ML execution,
latency benchmarking, and explainability attributions.
"""
import logging
import time
from typing import Any
from uuid import UUID

import numpy as np
import pandas as pd

from apps.predictions.models import RiskLevel
from ml.explainability.explainer import explain_prediction
from services.feature_preprocessor import FeaturePreprocessor
from services.model_provider import IModelProvider, RegistryModelProvider
from services.prediction_result import ExplanationResult, PredictionResult

logger = logging.getLogger(__name__)


class RiskPredictionEngine:
    """
    Dedicated clinical risk prediction engine.
    Orchestrates feature validation, model retrieval, inference, and explainability.
    """

    def __init__(
        self,
        model_provider: IModelProvider | None = None,
        preprocessor: FeaturePreprocessor | None = None,
    ) -> None:
        self.model_provider = model_provider or RegistryModelProvider()
        self.preprocessor = preprocessor or FeaturePreprocessor()

    @staticmethod
    def map_probability_to_risk(probability: float) -> str:
        """Categorize continuous risk probability into clinical severity levels."""
        if probability < 0.25:
            return RiskLevel.LOW
        if probability < 0.50:
            return RiskLevel.MEDIUM
        if probability < 0.75:
            return RiskLevel.HIGH
        return RiskLevel.CRITICAL

    def predict(
        self,
        patient_id: UUID | str,
        features: dict[str, Any],
        clinical_record_id: UUID | str | None = None,
        model_name: str | None = None,
    ) -> PredictionResult:
        """
        Execute real-time risk assessment for a single patient record.
        """
        # 1. Feature normalization and validation
        df, snapshot = self.preprocessor.prepare_dataframe(features)

        # 2. Retrieve active model pipeline and version metadata
        pipeline, model_ver = self.model_provider.get_model(model_name=model_name)

        # 3. High-precision execution timing
        start_time = time.perf_counter()

        if hasattr(pipeline, "predict_proba"):
            proba_arr = np.asarray(pipeline.predict_proba(df))
            prob_float = float(proba_arr[0][1]) if proba_arr.shape[1] > 1 else float(proba_arr[0][0])
            confidence = float(np.max(proba_arr[0]))
        else:
            pred_class = pipeline.predict(df)[0]
            prob_float = 1.0 if pred_class == 1 else 0.0
            confidence = 1.0

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        risk_level = self.map_probability_to_risk(prob_float)

        # 4. Explainability attributions (safe execution)
        explanation_res: ExplanationResult | None = None
        try:
            exp_dict = explain_prediction(
                pipeline=pipeline,
                input_data=df,
                predicted_class=risk_level,
            )
            explanation_res = ExplanationResult(
                method=exp_dict.get("method", "FeatureImportance"),
                feature_importances=exp_dict.get("feature_importances", {}),
                top_risk_factors=exp_dict.get("top_risk_factors", []),
                baseline_value=exp_dict.get("baseline_value"),
            )
        except Exception as exc:
            logger.warning("Explanation calculation skipped due to error: %s", exc)

        return PredictionResult(
            patient_id=patient_id,
            clinical_record_id=clinical_record_id,
            risk_level=risk_level,
            probability=prob_float,
            confidence_score=confidence,
            model_name=model_ver.model_name,
            model_version=model_ver.version,
            model_version_id=model_ver.id,
            inference_latency_ms=latency_ms,
            feature_snapshot=snapshot,
            feature_schema_version=getattr(model_ver, "feature_schema_version", "v1.0"),
            explanation=explanation_res,
        )

    def predict_batch(
        self,
        batch_items: list[dict[str, Any]],
        model_name: str | None = None,
    ) -> list[PredictionResult]:
        """
        Execute vectorized high-throughput inference across multiple patient records.
        """
        if not batch_items:
            return []

        # 1. Prepare batch DataFrame
        records_only = [item["features"] for item in batch_items]
        df, snapshots = self.preprocessor.prepare_batch_dataframe(records_only)

        # 2. Retrieve active model
        pipeline, model_ver = self.model_provider.get_model(model_name=model_name)

        # 3. Time vectorized batch inference
        start_time = time.perf_counter()
        if hasattr(pipeline, "predict_proba"):
            proba_arr = np.asarray(pipeline.predict_proba(df))
            probs = proba_arr[:, 1] if proba_arr.shape[1] > 1 else proba_arr[:, 0]
            confidences = np.max(proba_arr, axis=1)
        else:
            preds = pipeline.predict(df)
            probs = np.where(preds == 1, 1.0, 0.0)
            confidences = np.ones(len(df))

        total_latency_ms = (time.perf_counter() - start_time) * 1000.0
        avg_latency_ms = total_latency_ms / len(batch_items)

        results: list[PredictionResult] = []
        for idx, item in enumerate(batch_items):
            p_float = float(probs[idx])
            c_float = float(confidences[idx])
            r_level = self.map_probability_to_risk(p_float)

            results.append(
                PredictionResult(
                    patient_id=item["patient_id"],
                    clinical_record_id=item.get("clinical_record_id"),
                    risk_level=r_level,
                    probability=p_float,
                    confidence_score=c_float,
                    model_name=model_ver.model_name,
                    model_version=model_ver.version,
                    model_version_id=model_ver.id,
                    inference_latency_ms=avg_latency_ms,
                    feature_snapshot=snapshots[idx],
                    feature_schema_version=getattr(model_ver, "feature_schema_version", "v1.0"),
                    explanation=None,  # Explanations omitted in high-volume batch mode for maximum speed
                )
            )

        return results
