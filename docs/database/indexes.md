# Database Indexes & Query Optimization

Indexes are deployed across relational tables to ensure low latency under clinical query workloads.

---

## 1. Index Catalog

| Table | Index Name / Type | Columns | Purpose |
|---|---|---|---|
| `patients_patient` | B-Tree Unique | `mrn` | Instant patient lookup by Medical Record Number |
| `patients_patient` | B-Tree Composite | `last_name, first_name` | Autocomplete and patient directory sorting |
| `clinical_clinicalrecord`| B-Tree Composite | `patient_id, recorded_at DESC`| Rapid retrieval of the patient's latest vital signs encounter |
| `predictions_prediction` | B-Tree Composite | `patient_id, created_at DESC` | Longitudinal patient risk trajectory queries |
| `predictions_prediction` | B-Tree Index | `prediction_result` | Rapid aggregation of dashboard risk counters (e.g. total High Risk) |
| `reports_report` | B-Tree Composite | `patient_id, status` | Listing downloadable completed reports for a patient |
| `core_auditlog` | B-Tree Composite | `resource_type, resource_id`| Fast audit trail lookup for a specific prediction or patient |
