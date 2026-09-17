# Feature Specification: Patient Risk Level Prediction & Explainability

**Feature ID**: `FEAT-PRED-001`  
**Feature Branch**: `feat/patient-risk-prediction`  
**Created**: 2026-09-17  
**Status**: `CONVERGED`  
**Change Level**: `Level 4 (Clinical / ML / Security Critical)`  
**Owner / Role**: Senior ML Engineer & Clinical Informatics Lead  
**Reviewers**: Clinical Safety Agent, Healthcare Security Agent, Architecture Board  

---

## 1. Objectives & Rationale

### Business Objective
Enable real-time, automated patient deterioration risk scoring across adult inpatient wards to reduce adverse clinical events, optimize nursing allocation, and minimize unplanned ICU transfers.

### Clinical Objective
Provide credentialed attending physicians and triage nurses with probabilistic risk level assessments (`LOW`, `MEDIUM`, `HIGH`) and patient-specific TreeSHAP feature attributions based on physiological vital signs.

> [!IMPORTANT]
> **Clinical Safety Invariant**: This feature MUST NOT issue an autonomous medical diagnosis or prescribe clinical interventions. All outputs are assistive risk stratification signals requiring human clinician assessment and formal sign-off.

---

## 2. User Personas & Role Governance

- **Doctor (`/doctor/*`)**:
  - *Allowed*: View patient cohort risk rankings, trigger prediction inference, inspect TreeSHAP waterfall charts, record clinical review sign-off (`AGREED`, `DISAGREED`, `OVERRIDDEN`).
  - *Forbidden*: Altering model weights or bypassing immutable audit logging.
- **Nurse (`/nurse/*`)**:
  - *Allowed*: Enter bedside vital signs, review triage risk tier, acknowledge real-time high-risk deterioration alerts.
  - *Forbidden*: Overriding physician clinical sign-offs.
- **Patient (`/user/*`)**:
  - *Allowed*: View authorized personal health summary and educational trend indicators.
  - *Forbidden*: Viewing other patients' data (IDOR prevention) or raw mathematical model parameters.
- **Informaticist (`/informaticist/*`)**:
  - *Allowed*: Monitor ROC-AUC, Brier score calibration, and feature drift (PSI) metrics.
  - *Forbidden*: Accessing unredacted patient PHI unnecessarily.
- **Admin (`/admin/*`)**:
  - *Allowed*: Monitor service health, Celery queue latencies, and system audit logs.
  - *Forbidden*: Viewing patient medical charts without explicit security justification.

---

## 3. Prioritized User Stories

### User Story 1 - Bedside Risk Prediction & Attribution (Priority: P1)
**As a** Doctor,  
**I want to** view a patient's real-time risk level prediction along with the key contributing physiological factors,  
**So that** I can prioritize clinical interventions for patients showing early physiological deterioration.

- **Acceptance Scenario 1 (Gherkin)**:
  - **Given** an authorized doctor viewing an assigned patient record,
  - **When** the doctor requests a risk assessment,
  - **Then** the backend retrieves the latest validated vitals snapshot,
  - **And** executes the versioned model ensemble (`ML-ENS-V2`),
  - **And** returns a calibrated probability score, categorical risk level (`LOW`, `MEDIUM`, `HIGH`), and TreeSHAP attribution values,
  - **And** records an immutable audit event in Neon PostgreSQL.

- **Acceptance Scenario 2 (Gherkin - Authorization Failure)**:
  - **Given** an authenticated user without an assigned care relationship to the patient,
  - **When** the user requests the patient's risk prediction,
  - **Then** the backend immediately returns HTTP 403 Forbidden,
  - **And** records a security audit log event without exposing prediction data.

### User Story 2 - Real-Time Deterioration Notification (Priority: P2)
**As a** Triage Nurse,  
**I want to** receive immediate WebSocket notifications when an inpatient's risk level transitions to `HIGH`,  
**So that** rapid response protocols can be initiated without manual dashboard polling.

- **Acceptance Scenario (Gherkin)**:
  - **Given** an active patient whose vital signs trigger a `HIGH` risk prediction,
  - **When** the prediction transaction is committed to Neon PostgreSQL,
  - **Then** a real-time event is emitted across the authorized WebSocket channel (`/ws/nurse/triage/`),
  - **And** the triage portal renders a high-visibility, light-themed alert banner.

---

## 4. Requirements Specification

### Functional Requirements (FR)
- **`FR-PRED-001`**: System MUST compute a multi-class risk prediction (`LOW`, `MEDIUM`, `HIGH`) using the registered ensemble model (`ML-ENS-V2`).
- **`FR-PRED-002`**: System MUST compute TreeSHAP feature attributions ($\phi_i$) for all input vital signs and return them in the prediction payload.
- **`FR-PRED-003`**: System MUST require explicit clinician sign-off (`AGREED`, `DISAGREED`, `OVERRIDDEN`) with mandatory timestamp and provider ID.
- **`FR-PRED-004`**: System MUST reject prediction requests and emit `DATA_INCOMPLETE` if critical vital signs (heart rate, systolic BP) are missing.
- **`FR-PRED-005`**: System MUST override model output to `HIGH_RISK_REVIEW_REQUIRED` if deterministic qSOFA score is $\ge 2$.
- **`FR-PRED-006`**: System MUST NOT allow cross-patient prediction access (strictly enforce `HasPatientAccess`).

### Non-Functional Requirements (NFR)
- **`NFR-SEC-001`**: Object-level authorization MUST be validated in the Django backend on every request.
- **`NFR-PERF-001`**: Prediction inference and TreeSHAP attribution calculation MUST complete within $P95 < 500\text{ms}$.
- **`NFR-DESIGN-001`**: UI components MUST adhere strictly to the White/Light theme specification.
- **`NFR-A11Y-001`**: Risk visualization badges and charts MUST comply with WCAG 2.1 AA contrast ratios.

---

## 5. Domain Contracts

- **Authoritative Database**: Neon PostgreSQL table `risk_predictions` (`id`, `patient_id`, `model_id`, `risk_level`, `risk_score`, `shap_values`, `created_at`).
- **API Endpoint**: `POST /api/v1/patients/{patient_id}/predictions/evaluate/`
- **Realtime Event**: Channel group `nurse_triage`, event `patient.risk_alert`.
