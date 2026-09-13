"""
RiskPredictionEngine — Core inference engine coordinating preprocessing, ML execution,
latency benchmarking, multi-class probabilities, deterministic safety overrides,
and explainability attributions.
"""
import logging
import time
from typing import Any
from uuid import UUID

import numpy as np
import pandas as pd

from apps.predictions.models import RiskLevel
from services.feature_preprocessor import FeaturePreprocessor
from services.model_provider import IModelProvider, RegistryModelProvider
from services.prediction_result import ExplanationResult, PredictionResult

logger = logging.getLogger(__name__)


class RiskPredictionEngine:
    """
    Dedicated clinical risk prediction engine.
    Orchestrates feature validation, model retrieval, multi-class inference,
    clinical safety rules override, and explainability.
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
        """Categorize continuous risk probability into clinical severity levels (fallback)."""
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

        classes = list(getattr(pipeline, "classes_", [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]))

        if hasattr(pipeline, "predict_proba"):
            proba_raw = np.asarray(pipeline.predict_proba(df))[0]
            if len(proba_raw) == 2:
                prob_float = float(proba_raw[1])
                raw_pred_class = self.map_probability_to_risk(prob_float)
                confidence = float(np.max(proba_raw))
            else:
                classes = list(getattr(pipeline, "classes_", [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]))
                best_idx = int(np.argmax(proba_raw))
                raw_pred_class = str(classes[best_idx])
                prob_float = float(proba_raw[best_idx])
                confidence = float(np.max(proba_raw))
        else:
            pred_val = pipeline.predict(df)[0]
            raw_pred_class = str(pred_val)
            prob_float = 1.0 if pred_val == 1 else 0.0
            confidence = 1.0

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        # Resolve discrete risk level
        if raw_pred_class.upper() in RiskLevel.values:
            risk_level = raw_pred_class.upper()
        else:
            risk_level = self.map_probability_to_risk(prob_float)

        # 4. Clinical Safety Layer: Evaluate deterministic clinical rules override
        try:
            from services.clinical_rules_engine import ClinicalRulesEngine
            rules_engine = ClinicalRulesEngine()
            alerts = rules_engine.evaluate(snapshot)
            critical_alerts = [a for a in alerts if getattr(a, "severity", "") == "CRITICAL_EMERGENCY"]
            if critical_alerts and risk_level not in (RiskLevel.HIGH, RiskLevel.CRITICAL):
                logger.warning(
                    "Clinical safety rule override: escalating %s to HIGH due to critical alert criteria: %s",
                    risk_level,
                    [a.trigger_criteria for a in critical_alerts],
                )
                risk_level = RiskLevel.HIGH
        except Exception as rule_err:
            logger.debug("Clinical safety rule check skipped: %s", rule_err)

        # 5. Explainability attributions via SHAP or fallback
        explanation_res: ExplanationResult | None = None
        try:
            from services.explanation_service import ExplanationService
            explanation_svc = ExplanationService()
            explanation_payload = explanation_svc.generate_explanation(
                pipeline=pipeline,
                input_df=df,
                raw_record=snapshot,
                predicted_class=risk_level,
            )
            explanation_res = ExplanationResult(
                method=explanation_payload.method,
                feature_importances={
                    fc.feature: round(abs(fc.contribution), 6)
                    for fc in explanation_payload.features
                },
                top_risk_factors=[fc.to_dict() for fc in explanation_payload.features],
                baseline_value=explanation_payload.baseline_value,
                features=[fc.to_dict() for fc in explanation_payload.features],
                explanation_type=explanation_payload.explanation_type,
                disclaimer=explanation_payload.disclaimer,
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
        classes = list(getattr(pipeline, "classes_", [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]))

        # 3. Time vectorized batch inference
        start_time = time.perf_counter()
        if hasattr(pipeline, "predict_proba"):
            proba_arr = np.asarray(pipeline.predict_proba(df))
            best_indices = np.argmax(proba_arr, axis=1)
            raw_classes = [str(classes[idx]) for idx in best_indices]
            probs = [float(proba_arr[i, best_indices[i]]) for i in range(len(best_indices))]
            confidences = np.max(proba_arr, axis=1)
        else:
            preds = pipeline.predict(df)
            raw_classes = [str(p) for p in preds]
            probs = [1.0 if p == 1 or p in RiskLevel.values else 0.0 for p in preds]
            confidences = np.ones(len(df))

        total_latency_ms = (time.perf_counter() - start_time) * 1000.0
        avg_latency_ms = total_latency_ms / len(batch_items)

        results: list[PredictionResult] = []
        for idx, item in enumerate(batch_items):
            p_float = float(probs[idx])
            c_float = float(confidences[idx])
            pred_cls = raw_classes[idx]
            if pred_cls.upper() in RiskLevel.values:
                r_level = pred_cls.upper()
            else:
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
                    explanation=None,
                )
            )

        return results
