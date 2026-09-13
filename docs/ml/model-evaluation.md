# Model Evaluation & Benchmark Metrics

Evaluation results across 5-fold stratified cross-validation on the clinical validation cohort:

---

## 1. Benchmark Comparison

| Model Architecture | Accuracy | Precision | Recall (Sensitivity) | F1-Score | ROC-AUC | Brier Score |
|---|---|---|---|---|---|---|
| **Random Forest** (Production) | **88.5%** | **87.2%** | **89.6%** | **88.4%** | **0.934** | **0.089** |
| **Support Vector Machine** | 85.2% | 84.0% | 86.2% | 85.1% | 0.908 | 0.112 |
| **AdaBoost** | 83.6% | 82.5% | 84.0% | 83.2% | 0.891 | 0.124 |

*Note: In medical risk prediction, high Recall is vital to prevent discharging a deteriorating patient.*
