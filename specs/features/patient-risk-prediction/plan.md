# Implementation Plan: Patient Risk Level Prediction & Explainability

**Feature ID**: `FEAT-PRED-001`  
**Branch**: `feat/patient-risk-prediction` | **Date**: 2026-09-17  
**Spec Reference**: `specs/features/patient-risk-prediction/spec.md`  
**Status**: `CONVERGED`  

---

## 1. Technical Context & Stack Alignment
- **Backend API**: `backend/apps/predictions/` and `backend/apps/patients/`
- **ML Engine**: `ml/inference/` and `ml/explainability/shap_explainer.py`
- **Database**: Neon PostgreSQL table `risk_predictions`
- **Realtime**: `backend/channels_app/consumers/` with Redis layer
- **Frontend**: `frontend/src/app/(portals)/doctor/predictions/` and `frontend/src/components/predictions/`

---

## 2. Constitution Compliance Verification
- [x] **Clinical Safety**: No autonomous diagnosis. Advisory scores only. qSOFA deterministic override.
- [x] **Zero PHI**: `ClinicalRiskContextBuilder` extracts only normalized numeric vectors.
- [x] **Authoritative Store**: Neon PostgreSQL is sole clinical truth.
- [x] **Multi-Tier Authorization**: `HasPatientAccess` permission class checks provider-patient relationship.
- [x] **White-Only Design**: Strictly light theme; zero dark-mode tokens.

---

## 3. Layer Implementation Strategy
1. **Database**: Migration creating `risk_predictions` table with check constraints and index on `(patient_id, created_at)`.
2. **Services**: `PredictionService.evaluate_patient_risk(patient_id)` in `backend/apps/predictions/services.py`.
3. **ML Pipeline**: Load serialized model `ML-ENS-V2` and compute TreeSHAP values using `TreeExplainer`.
4. **API ViewSet**: DRF `PredictionViewSet` exposing `POST /api/v1/patients/{id}/predictions/evaluate/`.
5. **Realtime**: `transaction.on_commit()` emitting alert to Redis channel layer.
6. **Frontend**: Next.js clinical risk card with TreeSHAP waterfall plot and white-themed badge components.
