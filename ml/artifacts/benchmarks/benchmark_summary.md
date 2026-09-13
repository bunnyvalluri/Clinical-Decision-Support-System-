# Clinical ML Model Benchmark Comparison

| Model | Accuracy | Precision (Macro) | Recall (Macro) | F1-Score (Macro) | ROC-AUC (OvR) | PR-AUC (OvR) | Brier Score | Missed High/Crit | Latency (ms/sample) | Model Size (KB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SVM | 0.994 | 0.9941 | 0.994 | 0.994 | 1.0 | 0.9999 | 0.0124 | 1 | 0.042 | 78.2 |
| RANDOM_FOREST | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0027 | 0 | 0.136 | 949.1 |
| ADABOOST | 0.796 | 0.8464 | 0.796 | 0.7861 | 0.9139 | 0.8152 | 0.3869 | 54 | 0.044 | 97.8 |

*Note: All metrics calculated on identical held-out test partition with zero patient leakage.*
