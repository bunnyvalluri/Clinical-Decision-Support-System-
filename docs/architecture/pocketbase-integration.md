# ADR 008: Controlled Integration of PocketBase as an Auxiliary Subsystem

**Status**: Accepted  
**Date**: September 14, 2026  
**Context**: Clinical Decision Support System (CDSS) for Patient Risk Level Prediction  
**Deciders**: Clinical Architecture Team, Security & Compliance Office, Lead Systems Engineer  

---

## 1. Why PocketBase Is Being Introduced
PocketBase is evaluated and integrated exclusively to provide **lightweight, non-clinical auxiliary supporting functionality**. Specifically:
- Client-side auxiliary user interface state management (e.g., non-clinical UI widget pinning, custom table column preferences).
- Ephemeral system-wide broadcast banners (e.g., scheduled maintenance notices, deployment announcements).
- Non-critical auxiliary realtime Server-Sent Events (SSE) where full WebSocket channel overhead is unnecessary.

PocketBase brings an all-in-one Go binary with embedded SQLite, automatic REST endpoints, and built-in SSE capabilities that simplify developer workflows for non-clinical auxiliary micro-features.

---

## 2. What PocketBase Owns
PocketBase owns strictly and exclusively:
- **`user_ui_preferences`**: User-specific client UI display toggles, collapsed sidebar state, and non-sensitive dashboard layout preferences.
- **`auxiliary_announcements`**: System-wide administrative notices, platform maintenance alerts, and release notifications.
- **Auxiliary SSE Event Stream**: Ephemeral notifications for UI banner refreshes.

**Nothing else.**

---

## 3. What Django Owns
Django and Django REST Framework remain the **primary, authoritative application backend**:
- Clinical business logic and domain validation.
- User identity, credential hashing (Argon2/PBKDF2), role-based access control (RBAC), and session JWT issuance.
- Orchestration of ML inference requests and clinical risk score evaluation.
- Electronic Health Record (EHR) ingestion and FHIR/HL7 transformations.
- Clinician review sign-offs, notes, and overrides.
- Triage escalation workflows and vitals threshold validation.

---

## 4. What Neon PostgreSQL Owns
Neon Serverless PostgreSQL is the **sole, authoritative, legally binding database of record**:
- **Patient Profiles**: Demographics, identifiers, contact data.
- **Medical Records**: Diagnoses, allergies, clinical notes, medications.
- **Vitals & Lab Results**: Heart rate, SpO2, blood pressure, temperature, lab panels.
- **ML Predictions & Scores**: Calibrated risk probabilities, shapley feature importance, model inference history.
- **Model Versions**: Registered ML weights, hyperparameter checkpoints, calibration metrics.
- **Clinical Reviews**: Physician approvals, clinical overrides, triage classifications.
- **Audit Trails**: 21 CFR Part 11 and HIPAA-compliant immutable audit logs.
- **Appointments & Schedules**: Operational clinical appointments.

**Neon PostgreSQL is the single source of truth. PocketBase's SQLite will never be a competing or duplicate clinical data store.**

---

## 5. What Redis Owns
Redis (Upstash / Cluster) owns:
- Low-latency application-tier caching for clinical queries.
- Celery message broker queues (`default`, `ml`, `reports`, `notifications`).
- Celery task result backend.
- Token-bucket API rate limiting state.
- Django Channels distributed channel layer for real-time WebSocket state.

---

## 6. What Celery Owns
Celery owns:
- Asynchronous execution of intensive ML model inference.
- Model retraining, automated backtesting, and dataset drift calculations.
- Periodic batch risk reassessments (via Celery Beat).
- Clinical report generation and PDF compilation.
- Automated email and SMS clinical alerts.

---

## 7. What Django Channels Owns
Django Channels (ASGI Daphne + Redis Channel Layer) owns:
- **Primary Clinical Real-time Events**:
  - Live patient vitals telemetry streams.
  - Critical bedside emergency code alerts (Code Blue, Sepsis Alert, Rapid Response).
  - Clinician multi-station review synchronization.
- Bidirectional full-duplex WebSocket connections to hospital EHR terminals.

---

## 8. What ML Services Own
ML Services own:
- Machine learning model artifacts (`.joblib`, `.onnx`).
- Scikit-learn, LightGBM, and XGBoost calibrated classifier pipelines.
- Feature extraction, imputation, and standard scaling.
- Sepsis, ICU readmission, and mortality risk scoring engines.
- Clinical AI RAG evidence grounding and LLM prompt orchestrations.

---

## 9. What PocketBase Must NEVER Own
PocketBase is strictly **forbidden** from storing, processing, or acting as an intermediary for:
1. **Patient Profiles & Identifiers**: No PHI, names, MRNs, SSNs, or addresses.
2. **Medical Records & Diagnoses**: No ICD-10 codes, medical histories, or lab values.
3. **Vitals & Triage Data**: No clinical telemetry or nursing triage scores.
4. **ML Predictions & Risk Scores**: PocketBase will never store or calculate clinical predictions.
5. **Clinical Reviews & Sign-offs**: No medical audit records or physician decisions.
6. **Regulatory Audit Trails**: No compliance logging away from Neon PostgreSQL.
7. **Primary Authentication**: PocketBase will never be the identity provider for CDSS users.

---

## 10. Data Synchronization Rules
- **No Dual-Write Architecture**: Application code is strictly prohibited from writing clinical entities to both Neon and PocketBase simultaneously.
- **No Reverse Sync**: Data flows strictly outward for non-clinical read events if needed; PocketBase never writes or syncs into Neon PostgreSQL.
- **Decoupled Lifecycles**: Failure to write or read an auxiliary record in PocketBase has zero side-effects on Django REST Framework transactions or Neon database transactions.

---

## 11. Failure Behavior & Circuit Breaking
- **High Availability Isolation**: If the PocketBase process or container crashes, stops, or becomes unreachable:
  - Clinical workflows proceed with **zero degradation**.
  - Doctors, Nurses, Patients, Informaticists, and Administrators experience full access to clinical dashboards, predictions, vitals, and reports.
  - Next.js UI catches PocketBase network exceptions via the `PocketBaseClient` circuit breaker, gracefully displaying `"Service temporarily unavailable"` for auxiliary announcements, with an interactive `Retry` trigger.
  - Zero fake data is displayed; empty or failing responses render standard empty-state indicators.

---

## 12. Security Boundaries
- **No Superuser / Admin Keys in Frontend**: PocketBase administrator email and passwords are never exposed via environment variables, code, or client bundles (`NEXT_PUBLIC_*`).
- **Least-Privilege Collection API Rules**:
  - `auxiliary_announcements`: Public read (`@request.auth.id != "" || true` for active notices), Admin-only create/update/delete.
  - `user_ui_preferences`: Scoped strictly by user ID (`@request.auth.id = user_id`).
- **Authorization Authority**: Authorization for all clinical endpoints remains strictly enforced by Django DRF server-side permissions (`IsAuthenticated`, `IsDoctor`, `IsNurse`, `IsInformaticist`, `IsAdmin`). PocketBase rules never gate clinical access.

---

## 13. Deployment Architecture
- PocketBase runs as an isolated microservice container (`services/pocketbase/Dockerfile`).
- Mounted volume `pb_data` persists SQLite data independently of application code.
- Reverse proxy (Nginx) routes auxiliary `/pb/*` requests if needed, while core API traffic routes to `:8000` (Django ASGI) and frontend traffic to `:3000` (Next.js).
- Pinned to official release binary **v0.25.9** on Alpine Linux with automated `/api/health` monitoring.

---

## 14. Rollback Strategy
If PocketBase introduces regressions, dependency conflicts, or security concerns:
1. Set `NEXT_PUBLIC_POCKETBASE_URL=""` or remove the service in `docker-compose.yml`.
2. The Next.js `PocketBaseClient` immediately switches to offline fallback mode with zero runtime errors.
3. Remove the `services/pocketbase/` container.
4. Neon PostgreSQL, Django REST Framework, Celery, Redis, and Django Channels are completely unaffected.
