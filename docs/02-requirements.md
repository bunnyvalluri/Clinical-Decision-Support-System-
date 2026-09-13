# 02. System Requirements & Specifications

This document outlines the functional, non-functional, clinical, and regulatory requirements governing the PatientRisk Clinical Decision Support System.

---

## 1. Functional Requirements

### 1.1 Authentication & Access Control (FR-AUTH)
- **FR-AUTH-01:** The system shall support user registration with email, password, clinical role, department, and telephone number.
- **FR-AUTH-02:** The system shall authenticate users via JSON Web Tokens (JWT), issuing access tokens (15-minute lifespan) and refresh tokens (7-day lifespan).
- **FR-AUTH-03:** The system shall enforce Role-Based Access Control (RBAC) across five roles: `ADMIN`, `DOCTOR`/`CLINICIAN`, `NURSE`, `ANALYST`, and `PATIENT`.
- **FR-AUTH-04:** The system shall restrict patient medical record access so that patients can only retrieve their own records, while clinicians access authorized departmental patients.

### 1.2 Patient & Clinical Record Management (FR-PAT)
- **FR-PAT-01:** The system shall maintain patient master demographic records including Medical Record Number (MRN), full name, date of birth, biological sex, and blood group.
- **FR-PAT-02:** The system shall support serial clinical observation encounters containing vital signs (systolic/diastolic BP, HR, RR, SpO2, body temperature) and laboratory values (glucose, cholesterol, creatinine, sodium, potassium).
- **FR-PAT-03:** The system shall validate physiological ranges upon input (e.g., systolic BP between 50 and 300 mmHg) and reject out-of-bounds measurements with HTTP 422 Unprocessable Entity.
- **FR-PAT-04:** The system shall enforce soft deletion on patient and clinical records to preserve longitudinal medical audit integrity.

### 1.3 Machine Learning Inference & Explainability (FR-ML)
- **FR-ML-01:** The system shall execute real-time inference using pre-trained and registered scikit-learn models (SVM, Random Forest, AdaBoost).
- **FR-ML-02:** The system shall classify patient risk into four discrete categories:
  - **LOW Risk:** Probability < 0.30
  - **MEDIUM Risk:** 0.30 <= Probability < 0.60
  - **HIGH Risk:** 0.60 <= Probability < 0.85
  - **CRITICAL Risk:** Probability >= 0.85
- **FR-ML-03:** The system shall compute TreeSHAP feature attributions for every prediction, identifying the top clinical factors elevating or lowering patient risk.
- **FR-ML-04:** The system shall allow attending physicians to record a clinical override of the automated risk level, requiring a mandatory textual clinical justification.

### 1.4 Real-Time Telemetry & Background Processing (FR-RT)
- **FR-RT-01:** The system shall maintain persistent WebSocket connections for active clinician sessions.
- **FR-RT-02:** The system shall broadcast new predictions to connected dashboard clients without requiring page refreshes.
- **FR-RT-03:** The system shall offload PDF report compilation to asynchronous Celery workers, returning an immediate HTTP 202 Accepted response with a task ID.
- **FR-RT-04:** The system shall notify the requesting clinician via WebSocket when asynchronous tasks transition through `PROCESSING`, `COMPLETED`, or `FAILED` states.

---

## 2. Non-Functional Requirements

### 2.1 Performance & Latency SLAs (NFR-PERF)
| Metric | Threshold SLA | Observed Benchmark |
|---|---|---|
| **ML Inference Latency** | < 50 ms | 1.45 ms – 8.2 ms |
| **API Response Time (CRUD)** | < 250 ms (p95) | 12 ms – 45 ms |
| **WebSocket Broadcast Latency** | < 100 ms | 5 ms – 20 ms |
| **PDF Report Compilation** | < 5.0 seconds | 2.6 seconds |
| **Frontend Static Route Prerender** | < 1.0 second | ~ 600 ms |

### 2.2 Reliability & Availability (NFR-REL)
- **High Availability:** Cloud deployment ready for 99.9% uptime.
- **Database Durability:** Managed Neon Cloud PostgreSQL with automated Write-Ahead Log (WAL) archiving and Point-In-Time Recovery (PITR).
- **Graceful Degradation:** In the event of WebSocket connection interruption, the frontend falls back to periodic REST polling and automatically attempts exponential backoff reconnection.

### 2.3 Security & Regulatory Standards (NFR-SEC)
- **HIPAA Alignment:** Passwords hashed with PBKDF2 with SHA-256; JWTs signed with secret keys stored in environment variables; zero cleartext credential storage.
- **Audit Logging:** Every prediction, clinical override, and patient modification is recorded in an append-only `AuditLog` table capturing timestamp, user ID, IP address, and JSON diff.
- **Transport Encryption:** Mandatory TLS 1.3 / HTTPS for all HTTP and WSS traffic.

---

## 3. System Constraints

1. **Production Database:** Neon PostgreSQL is the designated production database. Under no circumstances should PostgreSQL run as a local container in production.
2. **Asynchronous Workloads:** Synchronous HTTP requests must never perform blocking PDF rendering or bulk evaluations; Celery must be utilized.
3. **Non-Root Execution:** All Docker containers (`backend`, `frontend`, `worker`) must execute under unprivileged user accounts (`appuser`, `nextjs`).
