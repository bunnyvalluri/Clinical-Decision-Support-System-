# Privacy & HIPAA Compliance in Observability

## 1. Compliance Mandate
Under HIPAA and the HealthNova AI Constitution:
- **Zero Patient PHI** is permitted in shared agent memory, metrics, distributed traces, or centralized application logs.
- **Neon PostgreSQL** is the sole authoritative source of truth for patient records.

## 2. Redaction Architecture
Every log event, trace span, and error report is intercepted by `SensitiveDataRedactor`:
- Strips Bearer tokens, HTTP session cookies, and API keys.
- Redacts database connection strings containing embedded passwords.
- Scrubs direct identifiers (SSN, national IDs) using compiled regex filters.
- Dictionary keys containing `password`, `token`, `secret`, or `key` are automatically overwritten with `[REDACTED]`.

## 3. High-Cardinality PHI Prohibition
Metrics systems must never index patient identifiers:
- Forbidden metric labels: `patient_id`, `mrn`, `patient_name`, `email`, `ssn`.
- Permitted metric labels: `service`, `endpoint_pattern`, `http_status`, `model_name`, `environment`.
