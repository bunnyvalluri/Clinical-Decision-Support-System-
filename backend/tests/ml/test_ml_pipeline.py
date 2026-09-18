"""
ML pipeline integration and evaluation tests for HealthNova AI.
Re-exports the full test suite so that `pytest tests/ml/` runs deterministically.
"""
from tests.test_ml_pipeline import (
    TestPreprocessingPipeline,
    TestDataSeparation,
    TestModelTrainingAndEvaluation,
    TestInferenceAndExplainability,
)

__all__ = [
    "TestPreprocessingPipeline",
    "TestDataSeparation",
    "TestModelTrainingAndEvaluation",
    "TestInferenceAndExplainability",
]
