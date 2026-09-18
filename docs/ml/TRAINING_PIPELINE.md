# Machine Learning Training Pipeline & Model Registration

## 1. Overview
The training pipeline ingests an approved Kaggle dataset release and executes end-to-end model training, statistical calibration, explainability extraction, and model artifact registration.

## 2. Supported Supervised Algorithms
- **Support Vector Machines (SVM)**: RBF kernel with Platt Scaling probability calibration (`CalibratedClassifierCV`).
- **Random Forest Classifier**: Non-linear ensemble with bootstrap aggregation and TreeSHAP explainability.
- **AdaBoost Classifier**: Sequential boosting on clinical decision stumps with stagewise optimization.

## 3. Strict Calibration & Validation Invariant
Healthcare risk scores must reflect genuine empirical probabilities:
- **No Invented Metrics**: All evaluation scores (ROC-AUC, PR-AUC, Accuracy, Precision, Recall, F1, Brier Score) derive strictly from scikit-learn evaluations on hold-out test folds.
- **Brier Score Calculation**: $\text{Brier} = \frac{1}{N}\sum_{t=1}^N (f_t - o_t)^2$ measures probability reliability. Scores closer to 0 indicate superior calibration.
- **Explainability**: TreeSHAP values are calculated for tree models, isolating the exact clinical contribution of each biomarker to the prediction.

## 4. Model Registry Integration
Upon completion:
1. Model binary is saved to `media/models/artifacts/` using joblib.
2. SHA-256 digest is computed on the `.joblib` file.
3. `ModelVersion` and `TrainingRun` records are committed to Neon PostgreSQL.
4. Celery emits a completion payload over Django Channels WebSocket (`ws/datasets/<id>/`).
