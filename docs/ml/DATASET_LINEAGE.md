# Dataset Provenance & Lineage Architecture

## 1. Lineage Graph Model
The CDSS tracks an immutable chain of custody for every piece of data from external origin to deployed model.

```mermaid
graph LR
    Origin[Kaggle Dataset Release] --> Download[Quarantine Download & SHA-256]
    Download --> Sanitize[DDE Sanitization & File Validation]
    Sanitize --> Snapshot[Authoritative Snapshot v1]
    Snapshot --> Validation[Quality & Clinical Gates]
    Validation --> Approval[Human Informaticist Sign-off]
    Approval --> Training[Pipeline Run: Preprocessing & Scaling]
    Training --> Model[Registered Model Artifact (.joblib + SHA-256)]
```

## 2. Cryptographic Checksumming
- Every raw file downloaded is hashed with SHA-256 upon reception.
- Sanitized files receive independent SHA-256 digests.
- Resulting scikit-learn model artifacts (`.joblib`) are hashed with SHA-256 and registered in `TrainingRun` and `ModelVersion`.
- Any modification of data on disk results in a checksum mismatch and blocks inference.

## 3. Version Diffing & Distribution Shift
When a newer version of an existing dataset is ingested:
- Schema delta calculation (added columns, removed columns, data type mutations).
- Distribution drift detection: Population Stability Index (PSI) and Kolmogorov-Smirnov (KS) tests between version distributions.
