# Healthcare MLOps Architecture Specification — BPY-CSE-2666

> **Standard**: Production Machine Learning & Clinical Decision Support System  
> **Topology**: Hierarchical Governed Pipeline • **Store of Truth**: Neon PostgreSQL

---

## 1. End-to-End MLOps Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CLINICAL DATA INGESTION                                │
│  Raw Clinical Record (Vitals, Labs, Demographics) from Neon PostgreSQL          │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     DATA QUALITY & PRIVACY VALIDATION                          │
│  - Biological Range Checks (BP 90-240, HR 40-220, Glucose 50-500)               │
│  - PHI Scanning (Names, MRNs, Phone, Email filter)                              │
│  - Patient Deduplication & Missing Value Audit                                  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     DETERMINISTIC FEATURE PIPELINE                              │
│  - Point-in-time Correctness Enforcement                                        │
│  - Feature Schema Versioning (e.g. schema_version="v1.0")                       │
│  - Standard Scaler / One-Hot Encoding consistent across Train & Serve          │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PATIENT-LEVEL DATASET SPLIT                                │
│  - GroupShuffleSplit / GroupKFold on `patient_id` (Zero leakage across splits)   │
│  - Dataset Versioning & SHA-256 Checksum generation                             │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      MODEL TRAINING (CELERY ASYNC)                              │
│  - Candidate Trainers: SVM, Random Forest, AdaBoost                             │
│  - Hyperparameter capture, random seed pinning (seed=42)                        │
│  - Resource Bounds: 2 CPU cores, 4GB RAM, 600s timeout                          │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      MULTI-METRIC EVALUATION GATE                               │
│  - Discrimination: Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC             │
│  - Clinical Metrics: Sensitivity, Specificity, PPV, NPV                         │
│  - Calibration: Reliability Curves, Brier Score, Platt / Isotonic Calibration   │
│  - Fairness: Subgroup disparity checks (Age, Sex)                               │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                  CLINICAL SAFETY & REGRESSION AUDIT                             │
│  - Comparison with Champion baseline metrics                                    │
│  - Out-of-Distribution (OOD) resistance & Adversarial tests                      │
│  - Model Card & Clinical Safety Card Generation                                 │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                  MODEL REGISTRY & STATE MACHINE                                 │
│  - State: DRAFT -> TRAINING -> EVALUATING -> PENDING_REVIEW                     │
│  - Artifact Packaging: SHA-256 Checksum recorded in PostgreSQL                 │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                  HUMAN CLINICIAN APPROVAL GATE (MANDATORY)                      │
│  - Medical Informaticist / Chief Medical Officer Sign-Off                       │
│  - State: PENDING_REVIEW -> APPROVED                                            │
│  - AI agents CANNOT self-approve                                                │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                  DEPLOYMENT & SERVING STRATEGY                                  │
│  - Stages: STAGED -> CANARY (10% traffic) / SHADOW -> PRODUCTION                │
│  - Realtime Prediction API (/api/v1/predictions/)                               │
│  - Local SHAP Explainability computation                                        │
│  - Realtime WebSocket broadcast to authorized Doctor/Nurse clients              │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                  MONITORING, DRIFT & RETRAINING DECISION                        │
│  - Daily Celery Job: Trailing inference window vs. Baseline                     │
│  - Population Stability Index (PSI) & Kolmogorov-Smirnov (KS) test              │
│  - Drift Alert Levels: INFO (PSI<0.10), WARNING (0.10-0.25), CRITICAL (>0.25)   │
│  - Retraining Trigger: Dispatches TrainingJob, NEVER auto-deploys               │
│  - Emergency Rollback: Instant one-click rollback to prior active version       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Infrastructure Layer Allocation

1. **Neon PostgreSQL (Authoritative)**:
   - Tables: `model_versions`, `model_evaluations`, `model_deployments`, `model_approvals`, `model_rollbacks`, `dataset_versions`, `data_quality_reports`, `predictions`, `clinical_records`, `audit_logs`.
2. **Redis**:
   - In-memory cache for active model descriptor.
   - Broker for Celery asynchronous queues.
   - Rate limiting and WebSocket channel layer coordination.
3. **Celery Worker & Beat**:
   - `training_queue`: Background ML training and hyperparameter search.
   - `evaluation_queue`: Evaluation, SHAP pre-computation, fairness analysis.
   - `monitoring_queue`: Scheduled drift calculation and nightly data quality audits.
4. **Django REST Framework & ASGI Channels**:
   - Low-latency HTTP REST endpoints.
   - Secure authenticated WebSockets for real-time risk alerts.
