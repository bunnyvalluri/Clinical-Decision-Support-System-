# Acceptance Criteria: Patient Risk Level Prediction & Explainability

**Feature ID**: `FEAT-PRED-001`  
**Status**: `CONVERGED`  

---

## 1. Clinician Decision Support Journey
- **AC-01**: Attending physician logs in and accesses assigned patient `#PATIENT-EXAMPLE-001`.
- **AC-02**: System renders the latest physiological vital signs and a calibrated risk score (e.g., `0.78` -> `HIGH`).
- **AC-03**: System renders the TreeSHAP attribution waterfall showing top 3 contributing factors (e.g., Systolic BP: `+0.28`, Respiratory Rate: `+0.22`, SpO2: `-0.10`).
- **AC-04**: Physician clicks "Clinical Review Sign-Off", enters rationale, selects `AGREED`, and submits.
- **AC-05**: Review record is written to Neon PostgreSQL with timestamp and clinician signature.

---

## 2. Deterministic Clinical Override Journey
- **AC-06**: When input vitals reflect Respiratory Rate $\ge 22$ and Systolic BP $\le 100$ mmHg (qSOFA criteria met), the system overrides any ML probabilistic score to `HIGH_RISK_REVIEW_REQUIRED`.
- **AC-07**: Clinician interface displays a prominent warning badge: *"Deterministic qSOFA rule triggered override"*.

---

## 3. Negative & Security Journey
- **AC-08**: A user authenticated as Doctor B attempts to access `POST /api/v1/patients/PATIENT-002/predictions/evaluate/` without being assigned to Patient 002.
- **AC-09**: Backend rejects request with HTTP 403 Forbidden.
- **AC-10**: No prediction, TreeSHAP values, or patient data are returned in response body.
