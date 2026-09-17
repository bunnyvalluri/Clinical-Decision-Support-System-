# Machine Learning Governance Specification: [MODEL NAME]

**Model ID**: `ML-[NAME]-[VERSION]`  
**Model Architecture**: `[SVM | Random Forest | AdaBoost | Ensembled]`  
**Training Run Hash**: `[GIT_COMMIT / RUN_ID]`  
**Author / MLOps Lead**: `[ML Engineer Role]`  
**Approval Status**: `Evaluating | Approved | Active | Deprecated | Blocked`  

---

## 1. Dataset & Provenance
- **Source Dataset**: [e.g., MIMIC-IV / eICU de-identified research cohort / Internal validated cohort]
- **Cohort Selection Criteria**: [Inclusion / exclusion rules]
- **Patient-Level Splitting**: [Strict split by Patient ID: 70% Train, 15% Validation, 15% Test. Zero patient leakage]
- **Class Balance**: [Ratio of Low / Moderate / High risk cases and rebalancing/weighting technique]

---

## 2. Feature Pipeline & Preprocessing
- **Feature Schema**:
  | Feature Name | Type | Scaling / Encoding | Imputation Strategy | Missingness Threshold |
  | :--- | :--- | :--- | :--- | :--- |
  | age | float | RobustScaler | Median | Max 5% |
  | systolic_bp | float | StandardScaler | Forward-fill / Median | Max 10% |
  | heart_rate | float | StandardScaler | Forward-fill / Median | Max 10% |
  | resp_rate | float | StandardScaler | Forward-fill / Median | Max 10% |
  | spo2 | float | RobustScaler | Forward-fill / Median | Max 5% |
  | glucose | float | RobustScaler | Median | Max 20% |

---

## 3. Evaluation Metrics (Deriving Strictly from Actual Validation)
> [!WARNING]
> Metric fabrication is strictly forbidden by the CDSS Constitution. All values below MUST be calculated by automated evaluation test runs.

- **ROC-AUC**: `[Measured on Test Set]`
- **PR-AUC**: `[Measured on Test Set]`
- **Brier Score (Calibration)**: `[Measured on Test Set]`
- **Sensitivity / Recall (High-Risk Class)**: `[Target >= 0.85]`
- **Specificity**: `[Measured on Test Set]`
- **Subgroup Fairness (Disparate Impact / EOD)**: `[Evaluated across age/gender subgroups]`

---

## 4. Explainability & Calibration
- **TreeSHAP Configuration**: TreeExplainer initialized on background reference dataset.
- **Top Feature Contributors**: Visualized in UI for clinician inspection.
- **Calibrated Probabilities**: Isotonic regression or Platt scaling applied to raw decision function.

---

## 5. Drift Monitoring & Retraining Gates
- **Feature Drift Metric**: Population Stability Index (PSI > 0.2 alerts MLOps).
- **Prediction Drift Metric**: Kolmogorov-Smirnov test (p-value < 0.05 alerts MLOps).
- **Retraining Gate**: Requires human MLOps review and sign-off before model promotion.
