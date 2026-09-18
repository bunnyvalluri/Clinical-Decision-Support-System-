# Kaggle Data Governance & Healthcare Compliance

## 1. Zero-PHI Invariant & HIPAA Safe Harbor
The system enforces the strict rule: **Zero patient Protected Health Information (PHI) is permitted in training corpora, model memory, or agent logs.**
Every dataset undergoes automated scanning by `HealthcareDataClassifier`:
- **Direct Identifiers Checked**: Names, SSN, MRN, phone numbers, email addresses, street addresses, full dates of birth, geographic subdivisions smaller than state.
- **Enforcement Gate**:
  - `PHI Detected`: Pipeline immediately transitions to `BLOCKED`. Dataset is rejected from training.
  - `DE_IDENTIFIED` / `PUBLIC`: Dataset is permitted to proceed to clinical range validation.

## 2. Human Informaticist Sign-Off Gate
In strict compliance with clinical decision support system governance:
- **No dataset may be used for model training or promotion without explicit human sign-off.**
- The Informaticist reviews:
  1. License permissiveness and commercial compatibility.
  2. Data quality scorecard (missingness, IQR outliers).
  3. Clinical range audits and biological contradiction reports.
  4. Privacy and synthetic scorecards.
- Approval tiers supported:
  - `RESEARCH_ONLY`: Permitted for exploratory benchmarking; blocked from production inference.
  - `BENCHMARK`: Approved for standard model evaluation suites.
  - `CLINICAL_TRAINING`: Approved for training candidate models destined for clinician review.
- Immutable audit records are written to `DatasetApproval` with clinician ID, timestamp, and clinical rationale.
