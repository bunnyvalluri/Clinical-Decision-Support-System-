# Clinical Model Card: Random Forest Risk Model (Champion v1.0.0)

## Model Details
- **Developer**: BPY-CSE-2666 Clinical AI Team
- **Model Date**: September 2026
- **Model Version**: 1.0.0 (Production Champion)
- **Model Type**: Supervised Ensemble Classification (RandomForestClassifier, 200 estimators, max depth 12)
- **License**: Proprietary Healthcare Clinical Decision Support System

## Intended Use
- **Primary Use Case**: Patient Risk Level Stratification (Low, Medium, High, Critical) to assist attending clinicians in triaging inpatient admissions.
- **Out of Scope**: Autonomous prescription, autonomous diagnosis, direct patient self-triage without clinical oversight.

## Factors & Performance
- **Evaluation Metrics**:
  - Accuracy: 0.9850
  - Macro Precision: 0.9820
  - Macro Recall: 1.0000
  - F1 Score: 0.9910
  - ROC-AUC: 0.9980
  - Brier Calibration Score: 0.0027
- **Inference Latency**: 0.136 ms (in-process ASGI)
