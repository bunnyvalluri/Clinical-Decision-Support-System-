# Machine Learning Validation Tests

Tests in `tests/test_ml_pipeline.py` and `tests/test_explainable_ml.py` verify:
- Deterministic output across multiple inferences with identical vitals.
- Output probability strictly bounded within $[0.0, 1.0]$.
- Sum of SHAP attributions matches model prediction log-odds.
- Natural language descriptions correctly reflect vital severity.
