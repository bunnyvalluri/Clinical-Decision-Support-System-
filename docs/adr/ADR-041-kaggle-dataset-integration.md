# ADR-041: Kaggle Dataset Discovery, Validation, Versioning, and ML Training Pipeline

## Status
Accepted

## Date
2026-09-18

## Context
The Clinical Decision Support System requires rigorous, evidence-based benchmark datasets to train, calibrate, and validate machine learning risk engines (SVM, Random Forest, AdaBoost). Kaggle is an invaluable global repository of clinical and physiological datasets (e.g. Pima Indians Diabetes, Stroke Prediction, Cleveland Clinic Heart Disease). However, ingesting third-party public datasets into a healthcare architecture introduces severe operational, safety, and legal risks:
1. **Security Vulnerabilities**: Path traversal (Zip slip), decompression bombs, and CSV formula injection.
2. **Clinical Data Deficiencies**: Biologically impossible values (e.g. SBP <= DBP, SpO2 > 100%), degenerate columns, and target leakage.
3. **Privacy & Regulatory Violations**: Potential presence of unredacted patient identifiers violating HIPAA Safe Harbor.
4. **Synthetic Drift**: Masked synthetic datasets presenting artificial distributions that mislead calibration.
5. **Licensing Non-Compliance**: Commercial use constraints or share-alike encumbrances.

## Decision
We implement a comprehensive, production-grade Kaggle dataset pipeline integrated directly into the existing Django / Neon PostgreSQL / Celery / Channels / Next.js architecture:

1. **Server-Side Credential Isolation**:
   - Resolved via `KaggleAuthService` using `KAGGLE_USERNAME` and `KAGGLE_KEY`.
   - Never exposed to frontend clients.
   - Built-in graceful fallback to verified offline clinical benchmarks if unauthenticated.

2. **Defense-in-Depth Quarantine & Sanitization**:
   - Raw archives are validated against Zip slip and decompression ratios before extraction.
   - CSV formula injection characters (`=`, `+`, `-`, `@`, `\t`, `\r`) are automatically escaped with single quotes.

3. **Multi-Stage Validation Gates**:
   - `DatasetQualityEngine`: Missingness, duplicate rows, constant columns, IQR outliers.
   - `ClinicalRangeValidator`: Physiological boundary checks and biological contradiction audits.
   - `DataLeakageDetector`: Target proxies, identifier leakage, post-outcome variables.
   - `HealthcareDataClassifier`: 18 HIPAA identifiers scanner; blocks PHI.
   - `SyntheticDataDetector`: CTGAN/generator detection via documentation and distribution variance.

4. **Human Informaticist Approval Gate**:
   - Datasets cannot be used for model training without explicit sign-off by a Medical Informaticist.

5. **Authoritative Neon PostgreSQL Registry**:
   - Full relational schema (`KaggleDataset`, `KaggleDatasetVersion`, `DatasetQualityFinding`, `DatasetClinicalValidation`, `DatasetApproval`, `TrainingRun`).

6. **Reproducible ML Pipeline**:
   - Scikit-learn models (SVM, Random Forest, AdaBoost) with Platt calibration, TreeSHAP explainability, and SHA-256 artifact checksumming.
   - Live telemetry via WebSockets (`ws/datasets/<id>/`).

## Consequences

### Positive
- Strict adherence to Mandatory Healthcare Invariants (Neon source of truth, zero unredacted PHI, no autonomous decisions, real metrics).
- Robust protection against archive and formula injection exploits.
- Complete traceability and audit lineage from raw Kaggle release to registered model artifact.
- Seamless developer experience with offline benchmark fallback.

### Negative
- Asynchronous Celery workers and Redis/broker required for long-running training jobs.
- Imputation strategies require clinical domain alignment for each disease cohort.
