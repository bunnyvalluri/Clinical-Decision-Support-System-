# Actionable Tasks: Patient Risk Level Prediction & Explainability

**Feature ID**: `FEAT-PRED-001`  
**Prerequisites**: `spec.md`, `plan.md`  
**Status**: `CONVERGED`  

---

## Phase 1: Data Model & Persistence (Neon PostgreSQL)
- [x] **T-DB-001** [FR-PRED-001]: Define `RiskPrediction` model in `backend/apps/predictions/models.py` with foreign key to `patients.Patient`, risk level choices (`LOW`, `MEDIUM`, `HIGH`), calibrated risk score, JSONB `shap_values`, and timestamps.
- [x] **T-DB-002** [FR-PRED-001]: Apply database migration in Neon PostgreSQL with non-blocking composite index on `(patient_id, created_at)`.
- [x] **T-DB-003** [P] [FR-PRED-003]: Implement `ClinicianReview` model with review status choices (`AGREED`, `DISAGREED`, `OVERRIDDEN`) and clinical notes.

## Phase 2: Domain Services & Backend API (Django REST Framework)
- [x] **T-API-001** [FR-PRED-001]: Implement `PredictionService` in `backend/apps/predictions/services.py` to extract vitals, invoke ML inference, compute TreeSHAP values, and persist atomically.
- [x] **T-API-002** [FR-PRED-005]: Integrate deterministic clinical override in `PredictionService`: if qSOFA $\ge 2$, force risk level to `HIGH_RISK_REVIEW_REQUIRED`.
- [x] **T-API-003** [NFR-SEC-001]: Implement and enforce `HasPatientAccess` permission class in `backend/apps/predictions/permissions.py`.
- [x] **T-API-004** [FR-PRED-001]: Implement `PredictionViewSet` in `backend/apps/predictions/views.py` with `evaluate` and `review` action endpoints.

## Phase 3: ML Pipeline & Realtime Broadcast
- [x] **T-ML-001** [FR-PRED-002]: Implement `SHAPExplainerService` in `ml/explainability/shap_explainer.py` returning feature attributions and base expected value.
- [x] **T-RT-001** [FR-PRED-002]: Attach `transaction.on_commit()` signal in `PredictionService` broadcasting WebSocket alert to group `nurse_triage`.

## Phase 4: Frontend Implementation (Next.js & shadcn/ui)
- [x] **T-FE-001** [FR-PRED-001]: Create `RiskPredictionCard` component in `frontend/src/components/predictions/RiskPredictionCard.tsx` using shadcn/ui.
- [x] **T-FE-002** [NFR-DESIGN-001]: Enforce strict White/Light theme styling (`bg-white`, `text-slate-900`, `border-slate-200`).
- [x] **T-FE-003** [FR-PRED-002]: Implement TreeSHAP feature contribution chart with accessible tooltips and high-contrast bars.
- [x] **T-FE-004** [FR-PRED-003]: Implement Clinician Review Modal allowing attending physicians to record sign-off.

## Phase 5: Automated Testing & Verification
- [x] **T-TEST-001** [FR-PRED-001]: Create unit tests in `backend/apps/predictions/tests/test_services.py` testing calculation and qSOFA overrides.
- [x] **T-TEST-002** [NFR-SEC-001]: Create IDOR penetration tests in `backend/apps/predictions/tests/test_permissions.py` proving unauthorized physicians receive HTTP 403.
- [x] **T-TEST-003** [FR-PRED-001]: Add Bruno collection in `bruno/predictions/evaluate.bru`.
- [x] **T-TEST-004** [NFR-A11Y-001]: Run React Doctor analysis verifying zero critical frontend quality violations.

## Phase 6: Clinical Safety Review & Convergence Gate
- [x] **T-GATE-001** [CLINICAL-001]: Clinical Safety Agent verification: verify advisory labels, verify no autonomous diagnosis, verify qSOFA override behavior.
- [x] **T-GATE-002** [GATE-001]: Execute `python scripts/converge.py` confirming 100% convergence across all quality gates.
