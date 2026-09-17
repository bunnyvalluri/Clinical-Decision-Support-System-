# Machine Learning Governance Specification

**Spec ID**: `ML-SPEC-001`  
**Domain**: Model Lifecycle, TreeSHAP Explainability, Calibration, & Drift  
**Status**: `CONVERGED`  
**Algorithms**: Support Vector Machines (SVM), Random Forest, AdaBoost  
**Explainability**: TreeSHAP (SHapley Additive exPlanations)  

---

## 1. Zero-Fabrication Metric Governance

> [!WARNING]
> Metric fabrication is strictly forbidden by the Healthcare CDSS Constitution.
> All reported model performance metrics (ROC-AUC, Precision, Recall, F1, Brier score) MUST derive from reproducible automated evaluation scripts executed against verified held-out evaluation datasets.

- **Patient-Level Data Partitioning**:
  - Training, validation, and testing splits MUST be partitioned by Patient ID to ensure zero data leakage across multiple admissions/encounters.
  - Typical partition: 70% Train, 15% Validation, 15% Held-out Test.

---

## 2. Model Zoo & Ensembles

| Model ID | Architecture | Primary Use Case | Calibrator | Explainability Engine |
| :--- | :--- | :--- | :--- | :--- |
| `ML-SVM-V1` | Linear/RBF SVM | Fast margin classification | Platt Scaling | Linear / Kernel SHAP |
| `ML-RF-V2` | Random Forest | Non-linear vital interactions | Isotonic Regression | TreeSHAP |
| `ML-ADA-V1` | AdaBoost | Adaptive boosted decision stumps | Sigmoid Calibration | TreeSHAP |
| `ML-ENS-V2` | Soft Voting Ensemble | Primary clinical risk ensemble | CalibratedClassifierCV | Integrated TreeSHAP |

---

## 3. TreeSHAP Attribution Standard

- Every prediction must compute SHAP local attributions for the patient's feature vector.
- Visualized in the Doctor and Informaticist portals as a waterfall / force plot showing:
  - Base expected value $E[f(x)]$
  - Individual feature contributions $\phi_i$ (e.g., Systolic BP $+0.24$, Heart Rate $+0.18$, Glucose $-0.05$)
  - Final model output $f(x)$

---

## 4. Continuous Drift Monitoring (Celery)

1. **Feature Drift**:
   - Calculated daily using the Population Stability Index (PSI).
   - $\text{PSI} < 0.1$: Stable (Green).
   - $0.1 \le \text{PSI} \le 0.2$: Moderate Drift (Yellow alert to Informaticist).
   - $\text{PSI} > 0.2$: Significant Drift (Red alert; retraining review required).
2. **Prediction Drift**:
   - Monitored via the two-sample Kolmogorov-Smirnov (KS) test comparing the baseline score distribution against the 7-day rolling prediction window.
