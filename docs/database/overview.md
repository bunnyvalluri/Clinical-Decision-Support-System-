# Database Overview

The **PatientRisk Clinical Decision Support System** relies on a normalized relational schema hosted on **Neon Serverless PostgreSQL**.

---

## 1. Relational Design Principles

1. **Strict Normalization:** Demographics (`patients_patient`), physiological observations (`clinical_clinicalrecord`), ML inferences (`predictions_prediction`), and explanations (`predictions_predictionexplanation`) are strictly separated to maintain clinical audit integrity and avoid redundant data.
2. **UUID Primary Keys:** All major entities use RFC 4122 Version 4 UUIDs (`uuid_generate_v4()`) to prevent enumeration attacks and simplify distributed replication.
3. **Soft Deletion (`is_deleted`):** Medical records and patient profiles are never hard-deleted; soft deletion ensures longitudinal audit compliance.
4. **Optimized Indexing:** Compound B-Tree indexes are deployed on high-frequency search fields (MRN, patient ID, recorded timestamp).
