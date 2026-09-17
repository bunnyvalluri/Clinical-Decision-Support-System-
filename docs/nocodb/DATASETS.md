# Governed Healthcare Analytical Datasets in NocoDB

> **HealthNova AI — Clinical Decision Support System (BPY-CSE-2666)**  
> **Classification:** De-identified / Minimally Necessary Analytical Projections

---

## 1. Dataset Schemas & Column Specifications

### Dataset 1: `ml_predictions_monitoring`
- **Slug:** `ml_predictions_monitoring`
- **Title:** ML Predictions Monitoring
- **Allowed Roles:** `informaticist`, `admin`, `doctor`
- **Columns:**
  - `id` (Number, PK): Unique record identifier
  - `anon_patient_token` (SingleLineText): SHA-256 HMAC masked identifier (`PT-XXXXXX`)
  - `risk_score` (Number): Calibrated risk probability (0.0000 - 1.0000)
  - `risk_tier` (Select): `Low`, `Moderate`, `High`, `Critical`
  - `model_version` (SingleLineText): Model identifier tag
  - `evaluated_at` (DateTime): ISO 8601 UTC timestamp
  - `clinician_reviewed` (Checkbox): Human clinician sign-off flag

### Dataset 2: `model_eval_registry`
- **Slug:** `model_eval_registry`
- **Title:** Model Evaluation Registry
- **Allowed Roles:** `informaticist`, `admin`, `doctor`
- **Columns:**
  - `id` (Number, PK)
  - `model_name` (SingleLineText)
  - `version` (SingleLineText)
  - `roc_auc` (Number, 4 decimal places)
  - `f1_score` (Number, 4 decimal places)
  - `brier_score` (Number, 4 decimal places)
  - `cohort_size` (Number)
  - `validated_at` (DateTime)

### Dataset 3: `feature_drift_ledger`
- **Slug:** `feature_drift_ledger`
- **Title:** Feature Drift Ledger
- **Allowed Roles:** `informaticist`, `admin`
- **Columns:**
  - `id` (Number, PK)
  - `feature_name` (SingleLineText)
  - `psi_score` (Number, 4 decimal places)
  - `drift_status` (Select): `Stable`, `Moderate`, `Critical`
  - `ks_p_value` (Number, 4 decimal places)
  - `last_calculated` (DateTime)

### Dataset 4: `data_quality_queue`
- **Slug:** `data_quality_queue`
- **Title:** Data Quality Issues Queue
- **Allowed Roles:** `informaticist`, `admin`, `doctor`, `nurse`
- **Columns:**
  - `id` (Number, PK)
  - `rule_id` (SingleLineText)
  - `table_name` (SingleLineText)
  - `check_type` (Select): `Missingness`, `Outlier`, `Temporal Inconsistency`
  - `severity` (Select): `Low`, `Medium`, `High`, `Critical`
  - `affected_records` (Number)
  - `status` (Select): `Open`, `Investigating`, `Resolved`

### Dataset 5: `clinical_workflow_metrics`
- **Slug:** `clinical_workflow_metrics`
- **Title:** Clinical Workflow Metrics
- **Allowed Roles:** `informaticist`, `admin`, `doctor`, `nurse`
- **Columns:**
  - `id` (Number, PK)
  - `department` (SingleLineText)
  - `avg_triage_latency_ms` (Number)
  - `clinician_override_rate` (Number, 4 decimal places)
  - `active_backlog` (Number)
  - `recorded_date` (Date)
