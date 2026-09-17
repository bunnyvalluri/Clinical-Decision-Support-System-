# Security & Privacy Requirements: Patient Risk Level Prediction

**Feature ID**: `FEAT-PRED-001`  
**Status**: `CONVERGED`  

---

## 1. Authentication & Object-Level Authorization
- Every endpoint under `/api/v1/patients/{patient_id}/predictions/*` requires:
  1. Valid JWT Authentication Bearer token.
  2. Role authorization (`Doctor`, `Nurse`, `Informaticist`, or `Patient` owner).
  3. Object-level authorization via `HasPatientAccess` permission class verifying active clinical care relationship.
- Cross-tenant or cross-patient IDOR attempts MUST be rejected with HTTP 403.

---

## 2. Zero-PHI Context Minimization
- The ML prediction pipeline processes strictly de-identified numerical features:
  `[age, systolic_bp, heart_rate, resp_rate, spo2, glucose]`.
- Patient names, MRNs, dates of birth, phone numbers, or addresses are never passed to the ML inference function or serialized into TreeSHAP explanation JSON.

---

## 3. Rate Limiting & Denial of Service Protection
- Evaluation endpoint rate-limited to 60 evaluations per minute per authenticated user.
