# Unified Clinical Patient Timeline Architecture — BPY-CSE-2666

## Overview
The Unified Patient Timeline aggregates all authorized, timestamped clinical events across the complete patient care journey. Powered by `PatientTimelineService` in `backend/services/timeline_service.py` and exposed via `GET /api/v1/patients/{id}/timeline/`.

---

## Event Ingestion Taxonomy

Every timeline event adheres strictly to the following contract:
- `event_id`: Globally unique identifier
- `event_type`: Categorical taxonomy
- `title`: Short clinical summary
- `description`: Detailed parameters and clinician narrative
- `timestamp`: ISO-8601 UTC timestamp
- `actor`: Licensed clinician, automated system, or laboratory
- `source`: Authoritative Neon PostgreSQL model
- `severity`: NORMAL | WARNING | CRITICAL
- `correlation_id`: Trace identifier linking upstream inputs
- `metadata`: Unredacted clinical parameters scoped by RBAC

### Unified Event Types
1. **`PATIENT_ADMISSION`**: Inpatient/outpatient registration and ward bed assignment.
2. **`VITAL_OBSERVATION`**: Serial bedside vital encounters (SBP, DBP, HR, RR, SpO2, Temp).
3. **`RISK_PREDICTION`**: Scikit-learn multi-vital inference with TreeSHAP attributions and confidence margin.
4. **`CLINICAL_REVIEW`**: Attending physician review decision (`CONCUR`, `OVERRIDE`, `MONITOR`, `TRANSFER`).
5. **`NURSE_TRIAGE`**: Emergency Severity Index (ESI 1-5) intake assessment and chief complaint.
6. **`CLINICAL_ALERT`**: Deterministic threshold alerts (qSOFA, NEWS2, severe hypoxia).

---

## Zero Fabrication Policy
Per Mandatory Healthcare Invariants:
- If no clinical encounters, vitals, or predictions exist for a patient record, the system renders:
  `"No clinical events available."`
- Under no circumstances are placeholder names, fake vitals, or simulated doctor reviews returned.
