# NocoDB Healthcare Data Governance & PHI Minimization

> **HealthNova AI — Clinical Decision Support System (BPY-CSE-2666)**  
> **Standard:** HIPAA Security Rule & Minimum Necessary Standard (45 CFR § 164.502(b))

---

## 1. Zero-PHI Leakage & Minimum Necessary Principles

Under HIPAA and institutional data governance policies, NocoDB is designated as a **Tier 2 (Analytical/Operational)** workspace. It must NEVER serve as an unredacted patient medical record store.

### Governed Datasets
The following datasets are formally approved for NocoDB workspace management:
1. **ML Predictions Monitoring:** Pseudonymous patient reference (`anon_patient_token`), prediction timestamp, risk probability, predicted risk class, model version, clinician review status.
2. **Model Evaluation Registry:** Model name, architecture, ROC-AUC, PR-AUC, Brier score, KS statistic, evaluation cohort size, validation timestamp.
3. **Feature Drift Ledger:** Feature name, baseline mean/std, current window mean/std, Population Stability Index (PSI), drift status (Stable/Moderate/Critical).
4. **Data Quality Issues Queue:** Rule ID, table target, check type (nullity, range, temporal anomaly), severity, affected records count, status (Open/Investigating/Resolved).
5. **Clinical Workflow Metrics:** Department ID, triage-to-prediction latency (ms), clinician override rate, review backlog count.
6. **External API Telemetry:** Endpoint, status code, latency (ms), rate limit usage, error categorizations (anonymized).
7. **Whiteboard & Collaboration Metadata:** Canvas ID, author role, session duration, object count, tag classifications.

---

## 2. Tokenization & Redaction Rules

| Field Type | Treatment in NocoDB | Authoritative Storage (Neon) |
|---|---|---|
| Patient Name | **STRICTLY EXCLUDED** | `patients.first_name`, `last_name` |
| Social Security Number / National ID | **STRICTLY EXCLUDED** | Restricted Vault |
| Medical Record Number (MRN) | SHA-256 HMAC Pseudonym (`anon_patient_token`) | `patients.mrn` |
| Exact Date of Birth | Age in Years (capped at 89) | `patients.dob` |
| Free-Text Clinical Notes | Clinical concept extraction only (SNOMED codes) | `clinical_notes.content` |
| Clinician Identity | Role-scoped ID (`doctor_104`) | `users.id` |

---

## 3. Data Retention & Sanitization

- **Analytical Retention:** Analytical rows in NocoDB datasets are retained for 90 rolling days.
- **Automated Purge:** Celery periodic tasks purge records older than the retention threshold from NocoDB project schemas while maintaining permanent aggregate logs in Neon PostgreSQL.
- **Export Guardrails:** Exporting datasets to CSV, Excel, or JSON enforces automatic formula sanitization (`=`, `+`, `-`, `@` prefix escape) to prevent spreadsheet formula injection attacks.
