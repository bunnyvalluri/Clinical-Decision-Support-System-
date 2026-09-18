# Kaggle Integration Architecture & Integration Guide

## 1. Architectural Overview
The Kaggle integration in this Clinical Decision Support System is an authoritative, server-side data pipeline connecting external healthcare benchmarks to the clinical model registry.

```
[ Kaggle API / Verified Catalog ]
                │
                ▼
[ KaggleClient / AuthService ] ──> [ Quarantine Sandbox ]
                │                           │
                │                           ▼
                │                  [ KaggleSecurityValidator ]
                │                  (Zip Slip, Bomb, DDE Sanitization)
                ▼                           │
   [ Ingestion & Checksumming ] ────────────┘
                │
                ▼
[ Multi-Stage Validation Gates ]
   ├── DatasetQualityEngine (Completeness, Duplicates, Distributions)
   ├── ClinicalRangeValidator (Physiological Bounds, Biological Contradictions)
   ├── DataLeakageDetector (Target Leakage, Post-Outcome Variables)
   ├── HealthcareDataClassifier (18 HIPAA Safe Harbor Identifiers)
   └── SyntheticDataDetector (CTGAN/Uniformity Analysis)
                │
                ▼
[ PostgreSQL Authoritative Store (Neon) ]
   ├── KaggleDataset & KaggleDatasetVersion
   ├── DatasetQualityFinding & ClinicalValidation
   └── DatasetApproval (Informaticist Review)
                │
                ▼
[ Pipeline Execution & Model Registry ]
   ├── Scikit-Learn (SVM, Random Forest, AdaBoost)
   ├── Platt Scaling / Isotonic Calibration & Brier Score
   ├── TreeSHAP Interpretability
   └── Immutable Model Artifacts & Checksums
```

## 2. Server-Side Credential Isolation
- Kaggle credentials (`KAGGLE_USERNAME`, `KAGGLE_KEY`) are resolved strictly server-side by `integrations.kaggle.authentication.KaggleAuthService`.
- No environment variables or credentials prefixed with `NEXT_PUBLIC_` are ever utilized.
- In the absence of live Kaggle credentials, the system transitions to the verified offline healthcare benchmark catalog (`REAL_KAGGLE_OFFLINE_BENCHMARKS`), enabling full end-to-end testing and onboarding without crashing.

## 3. Asynchronous Execution with Celery & Channels
- **Discovery**: Real-time querying via `discover_kaggle_datasets`.
- **Ingestion & Validation**: Handled by `download_and_validate_dataset` in Celery. Status updates stream to authorized clients via Django Channels WebSocket (`ws/datasets/<id>/`).
- **Model Training**: Executed by `train_kaggle_model` with real validation metrics (ROC-AUC, PR-AUC, Brier score, TreeSHAP).
