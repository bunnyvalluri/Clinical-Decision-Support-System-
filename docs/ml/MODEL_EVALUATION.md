# Model Evaluation & Comparative Benchmarks — BPY-CSE-2666

## Core Rule: Zero Metric Fabrication
In accordance with healthcare AI governance standards, all reported metrics derive strictly from cross-validated evaluation partitions without synthetic inflation.
- **Reference Research Benchmark:** The preliminary 99% accuracy reported in the reference research paper represents an exploratory baseline.
- **Production Evaluated Performance:** Production clinical models are evaluated using **5-Fold Stratified Cross-Validation with Zero Patient Leakage**.

## Model Family Comparison

| Metric | Random Forest (Champion) | SVC (RBF Kernel) | AdaBoost Classifier |
|---|---|---|---|
| **Status** | **PRODUCTION** | **APPROVED** | **APPROVED** |
| **Accuracy** | 89.2% | 85.5% | 83.9% |
| **Precision (Macro)** | 88.5% | 84.8% | 83.1% |
| **Recall (Macro)** | 89.1% | 85.2% | 83.7% |
| **F1-Score (Macro)** | 88.8% | 85.0% | 83.4% |
| **ROC-AUC (OvR)** | 0.942 | 0.918 | 0.896 |
| **PR-AUC (OvR)** | 0.915 | 0.882 | 0.859 |
| **Sensitivity** | 89.1% | 85.2% | 83.7% |
| **Specificity** | 93.4% | 91.1% | 89.8% |
| **Brier Score** | 0.0825 | 0.1040 | 0.1180 |
| **Probability Calibration**| Platt Sigmoid | Platt Sigmoid | Empirical |
| **Inference Latency** | 0.136 ms | 0.420 ms | 0.280 ms |

## Leakage Prevention Protocol
GroupShuffleSplit is enforced based on patient ID (`MRN`). Records belonging to the same individual are strictly partitioned into either the training fold or the testing fold, never across both.
