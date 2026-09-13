# Clinical MLOps & Continuous Governance Architecture

## Overview
In high-acuity healthcare environments, Machine Learning systems operate strictly as **Clinical Decision Support Systems (CDSS)**. They never act autonomously or issue authoritative medical diagnoses. To ensure that predictions are scientifically defensible, reproducible, uncertainty-aware, and secure, our MLOps lifecycle enforces strict governance across 15 pipeline stages:

```
Dataset (Patient Grouped)
    ↓
Data Quality Validation (Schema, Ranges, Biological Contradictions)
    ↓
Preprocessing (ColumnTransformer fit strictly on Train ONLY)
    ↓
Group-Aware 3-Way Split (Train 60% / Val 20% / Test 20%)
    ↓
Model Training (SVM, Random Forest, AdaBoost with Class Weighting)
    ↓
Probability Calibration (Platt Scaling via CalibratedClassifierCV on Val)
    ↓
Multi-Class Discrimination & Calibration Evaluation (ROC-AUC, PR-AUC, Brier)
    ↓
TreeSHAP & Additive Explainability (Non-causation Disclaimers)
    ↓
Formal Model Approval Gate (Reviewed & Signed Off)
    ↓
Cryptographic Model Registry (SHA-256 Checksum Verification)
    ↓
Production Inference with Uncertainty & OOD Detection
    ↓
Clinical Safety Layer (Deterministic qSOFA / NEWS2 Override)
    ↓
Real-Time Telemetry & Drift Monitoring (PSI, KS Test, Channels WebSockets)
```

---

## 1. Data Quality & Leakage Prevention
- **Group-Aware Splitting**: All encounters for a unique `patient_id` are strictly isolated to a single partition (`GroupShuffleSplit`). Cross-partition patient leakage is verified and blocked with automated assertions.
- **Preprocessing Isolation**: Imputers, scalers, and encoders are fit exclusively on `X_train`. Transformations on validation, test, and production payloads are strictly out-of-sample transforms.
- **Biological Contradiction Validation**: The `ClinicalDataValidator` rejects physiological contradictions (e.g. $SBP \le DBP$, body temperature outside $25^\circ\text{C}-45^\circ\text{C}$) before inference.

---

## 2. Probability Calibration
Raw classifier probabilities are calibrated using Platt scaling (`method='sigmoid'`) or Isotonic regression on held-out validation sets via `CalibratedClassifierCV`.
- **Brier Score**: Multi-class quadratic penalty $BS = \frac{1}{N}\sum_{i=1}^N \sum_{k=1}^K (p_{ik} - y_{ik})^2$ is tracked to verify calibration improvements.
- **Clinical Terminology**: Model scores are explicitly labeled as **"Predicted Probabilities"**; terms like "clinical certainty" are strictly prohibited.

---

## 3. Uncertainty Estimation & Clinical Abstention
Predictions are evaluated against a multi-class predictive uncertainty engine:
1. **Normalized Shannon Entropy**:
   $$H_{\text{norm}}(p) = \frac{-\sum_{k=1}^K p_k \log_2(p_k)}{\log_2(K)}$$
2. **Confidence Margin**:
   $$\Delta p = p_{(1)} - p_{(2)}$$
3. **Abstention Protocol**:
   - If $H_{\text{norm}} \ge 0.85$ or $\Delta p \le 0.08$ or input is severe Out-of-Distribution, the system issues an explicit abstention:
   > **"Prediction requires additional review."**
   - Uncertain outputs are never forced into a confident-looking clinical risk category.

---

## 4. Out-of-Distribution (OOD) Detection
- Anomaly scores are computed via multivariate RMS $z$-score distance against cohort training baselines.
- Categorization: `IN-DISTRIBUTION` ($z < 3.0$), `POTENTIAL DISTRIBUTION SHIFT` ($3.0 \le z < 4.5$), and `OUT-OF-DISTRIBUTION` ($z \ge 4.5$).
- **Documented Limitation**: OOD detection approximates geometric distance in measured covariates; it cannot detect unrecorded pharmacological interactions or novel unmeasured clinical phenomena.

---

## 5. Cryptographic Model Registry & Safe Deserialization
- Every serialized pipeline artifact (`pipeline.joblib`) is accompanied by a SHA-256 cryptographic digest computed at save time.
- Before deserializing via `joblib.load()`, the `ModelRegistry` calculates the runtime hash and compares it against `metadata.json["artifact_hash"]`. If a mismatch is detected, loading is aborted with `ModelSecurityError` to defend against arbitrary code execution.
- **Approval Gate Lifecycle**:
  $$\text{CANDIDATE} \rightarrow \text{VALIDATED} \rightarrow \text{SAFETY\_CHECKED} \rightarrow \text{APPROVED} \rightarrow \text{ACTIVE}$$
  Only formally `APPROVED` model versions can be promoted to production `ACTIVE`.

---

## 6. Model Rollback Protocol
If performance drift or clinical concerns arise:
```
Problem Detected in V3
    ↓
Deactivate V3 (Transition to ARCHIVED)
    ↓
Restore V2 (Verify SHA-256 artifact checksum)
    ↓
Promote V2 to ACTIVE & Invalidate in-memory cache
    ↓
Log immutable HIPAA audit entry
    ↓
Broadcast model.status.changed over WebSockets
```

---

## 7. Drift Monitoring & Retraining Governance
- **Feature Drift**: Evaluated using Population Stability Index (PSI) and 2-sample Kolmogorov-Smirnov (KS) test for numerical variables; categorical PSI for demographics.
- **Prediction Drift**: Evaluates production risk tier percentages ($LOW, MEDIUM, HIGH, CRITICAL$) against baseline expectations via PSI.
- **Performance Drift**: Tracks accuracy and high-risk recall against ground truth when hospital outcomes are confirmed.
- **Strict Retraining Rule**: Drift triggers automated alerts and clinical multidisciplinary review. **AUTOMATED RETRAINING AND DEPLOYMENT IS STRICTLY FORBIDDEN.** Any candidate retraining requires human clinical administrative sign-off.
