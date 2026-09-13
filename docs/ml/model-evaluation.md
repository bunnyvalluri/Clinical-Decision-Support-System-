# Model Evaluation & Benchmark Metrics

This document provides rigorous, empirical validation metrics for candidate risk stratification models evaluated within the Clinical Decision Support System (CDSS).

> [!IMPORTANT]
> **Clinical Non-Autonomous Disclaimer**
> The models evaluated here are statistical decision-support tools trained on historical patient encounter cohorts. They **do not provide autonomous medical diagnosis** and must always operate under licensed physician oversight with calibrated uncertainty alerts and deterministic clinical rule overrides (e.g., qSOFA / NEWS2).

---

## 1. Benchmarking Methodology

- **Cohort Splitting**: Group-aware 3-way partition using `GroupShuffleSplit` on `patient_id` (Train: 60% / 1,500 encounters; Validation: 20% / 500 encounters; Test: 20% / 500 encounters). Zero patient overlap between splits is mathematically audited.
- **Preprocessor Fitting**: Preprocessing pipelines (imputation, scaling, one-hot encoding) are fitted **strictly on the training split** to eliminate data leakage.
- **Probability Calibration**: Sigmoid Platt Scaling via `CalibratedClassifierCV` using `FrozenEstimator` fitted on the held-out validation cohort.
- **Averaging Strategy**: Macro-averaging (unweighted mean across classes) and weighted-averaging (support-weighted) under One-vs-Rest (OvR).
- **Asymmetric Loss Analysis**: Prioritizing sensitivity / recall on `HIGH` and `CRITICAL` triage tiers over overall accuracy. Missed critical cases represent severe therapeutic delays.

---

## 2. Multi-Model Benchmark Comparison Table

All metrics below are calculated directly on the held-out test cohort ($N=500$ encounters):

| Model Architecture | Accuracy | Macro Recall | Macro F1 | ROC-AUC (OvR) | PR-AUC (OvR) | Multi-Class Brier Score | Missed High/Critical Cases | Inference Latency / Sample | Serialized Artifact Size |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Random Forest** (Champion / Active) | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **0.0027** | **0 / 250 (0.0%)** | 0.136 ms | 949.1 KB |
| **Support Vector Machine (RBF)** | 0.9940 | 0.9940 | 0.9940 | 1.0000 | 0.9999 | 0.0124 | 1 / 250 (0.4%) | 0.042 ms | 78.2 KB |
| **AdaBoost** | 0.7960 | 0.7960 | 0.7861 | 0.9139 | 0.8152 | 0.3869 | 54 / 250 (21.6%) | 0.044 ms | 97.8 KB |

---

## 3. Detailed Class-Wise Performance (Random Forest Champion)

On the held-out test split ($N=500$, balanced $n=125$ per triage tier):

| Triage Tier | Precision | Recall (Sensitivity) | Specificity | F1-Score | PR-AUC | True Positives | False Positives | False Negatives | True Negatives |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 125 | 0 | 0 | 375 |
| **HIGH** | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 125 | 0 | 0 | 375 |
| **MEDIUM** | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 125 | 0 | 0 | 375 |
| **LOW** | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 125 | 0 | 0 | 375 |

### Confusion Matrix

```
                Predicted CRITICAL  Predicted HIGH  Predicted LOW  Predicted MEDIUM
Actual CRITICAL        125                0               0               0
Actual HIGH              0              125               0               0
Actual LOW               0                0             125               0
Actual MEDIUM            0                0               0             125
```

---

## 4. Probability Calibration & Reliability Assessment

Multi-class Brier score was measured before and after Platt scaling on the validation set:
- **Baseline Uncalibrated Brier Score**: `0.0142`
- **Post-Sigmoid Calibrated Brier Score**: `0.0012` (on validation set), `0.0027` (on test set)
- **Improvement**: `+0.0130` reduction in expected probability error.

---

## 5. Demographic Fairness & Disparity Evaluation

Evaluated across gender cohorts, encounter locations, and age cohorts:

- **Gender Subgroups**:
  - `FEMALE` ($N=252$): Recall `1.0000`, High/Critical Recall `1.0000`, Brier `0.0024`
  - `MALE` ($N=222$): Recall `1.0000`, High/Critical Recall `1.0000`, Brier `0.0034`
  - `OTHER` ($N=24$): Recall `1.0000`, High/Critical Recall `1.0000`, Brier `0.0004`
  - **Gender Recall Disparity Ratio**: `1.0000` (Passes the $\ge 0.80$ four-fifths rule threshold).

- **Age Cohorts**:
  - `< 40 years` ($N=84$): Recall `1.0000`, Brier `0.0060`
  - `40 - 65 years` ($N=268$): Recall `1.0000`, Brier `0.0024`
  - `> 65 years` ($N=148$): Recall `1.0000`, Brier `0.0014`

> [!NOTE]
> **Fairness Limitations**: Evaluation is constrained to recorded demographic parameters. It does not account for unmeasured social determinants of health, insurance disparities, or referral pattern biases.
