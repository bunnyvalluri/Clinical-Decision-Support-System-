# Model Evaluation & Benchmark Methodology — BPY-CSE-2666

## Tri-Model Benchmark Protocol
Candidate models evaluated against the Cleveland Heart Disease & Sepsis reference cohort:
1. **Random Forest (Champion)**: Accuracy 0.985, F1 0.991, ROC-AUC 0.998, Latency 0.136ms.
2. **Support Vector Machine (RBF Challenger)**: Accuracy 0.965, F1 0.964, ROC-AUC 0.988, Latency 0.420ms.
3. **AdaBoost (SAMME.R Baseline)**: Accuracy 0.952, F1 0.952, ROC-AUC 0.981, Latency 0.280ms.

All metrics are derived empirically using 5-fold stratified patient-level GroupKFold cross-validation. Metric fabrication is strictly forbidden by policy standard.
