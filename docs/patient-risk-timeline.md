# Patient Risk Timeline Specification & Architecture

## Overview
The **Patient Risk Timeline** in HealthNova AI provides an immutable, longitudinal, and role-scoped view of patient encounters, physiological telemetry, machine learning risk inferences, physician sign-offs, and critical clinical alerts. It serves as the primary longitudinal audit trail for clinical decision support.

Neon PostgreSQL (`neon.tech`) is the **sole authoritative source of truth**. No client-side mocks or ephemeral in-memory state stores are permitted for clinical timeline records.

---

## Controlled Event Taxonomy (Phase 3 Standard)

All clinical and algorithmic events conform to the standardized Phase 3 controlled vocabulary defined in `apps.clinical.models.PatientTimelineEvent`:

| Event Code | Category | Description | Scoping |
| :--- | :--- | :--- | :--- |
| `ENCOUNTER` / `PATIENT_ADMISSION` | Administrative / Care | Inpatient admission, outpatient triage, or consultation | Clinician & Patient Portal |
| `VITAL` / `VITAL_OBSERVATION` | Telemetry | Blood pressure, pulse oximetry, heart rate, temperature | Clinician & Patient Portal |
| `OBSERVATION` | Clinical Lab | Laboratory biomarker findings (e.g. serum lactate, creatinine) | Clinician & Patient Portal |
| `RISK_PREDICTION` | Decision Support | ML algorithmic risk prediction executed by validated model | Clinician & Patient Portal (Minimised) |
| `CLINICAL_REVIEW` / `PREDICTION_REVIEW` | Governance | Clinician review concurrence or assessment sign-off | Clinician Only |
| `PREDICTION_OVERRIDE` | Governance | Physician manual risk tier override with documented rationale | Clinician Only |
| `PREDICTION_FEEDBACK` | MLOps / Feedback | Clinician qualitative feedback and utility rating | Clinician & Informaticist |
| `CLINICAL_ALERT` | Safety | Deterministic rule trip (qSOFA, NEWS2, severe hypertension) | Clinician Only |
| `ESCALATION` | Safety | Automated multi-tier escalation to attending or ICU team | Clinician Only |
| `NURSE_TRIAGE` | Intake | Bedside nurse triage assessment and initial ESI assignment | Clinician Only |
| `AI_INTERACTION` | AI Safety | Prompt-injection screening and context minimization audit | Clinician & SRE |
| `DATA_QUALITY_EVENT` | AI Safety | Sensor outlier, missingness flag, or out-of-distribution detection | Clinician & Informaticist |
| `FHIR_IMPORT` / `FHIR_UPDATE` | Interoperability | Ingestion or synchronization of HL7 FHIR R4 resources | Clinician & Informaticist |

---

## Role-Based Privacy & Scoping Rules

To comply with HIPAA, GDPR, and clinical safety standards:
1. **Clinician Scopes (`CLINICIAN_ONLY`)**:
   - Access to full TreeSHAP attribution matrices, baseline expectation values, uncertainty entropy scores, out-of-distribution (OOD) distance metrics, and internal audit IDs.
2. **Patient Portal Scopes (`PATIENT_PORTAL`, `PUBLIC`)**:
   - Technical jargon is minimized into patient-accessible health summaries.
   - Raw model weights and alarming diagnostic text are suppressed.
   - Review attestation is clearly labeled (e.g., *"Reviewed by Dr. Vadla Abhinay, MD"*).

---

## Authoritative Database Schema

```sql
CREATE TABLE clinical_patienttimelineevent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients_patient(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    actor VARCHAR(255) NOT NULL,
    source VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    correlation_id VARCHAR(100),
    authorization_scope VARCHAR(50) NOT NULL DEFAULT 'CLINICIAN_ONLY',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    provenance JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_timeline_patient_created ON clinical_patienttimelineevent(patient_id, created_at DESC);
CREATE INDEX idx_timeline_event_type ON clinical_patienttimelineevent(event_type);
```

---

## API Endpoints

- `GET /api/v1/patients/{id}/timeline/`:
  - Query parameters: `event_type`, `severity`, `source`, `date_from`, `date_to`, `offset`, `limit`.
  - Authoritative retrieval with role scoping filter.
- `GET /api/patient-timeline/?patient_id={id}`: Direct clinical router alias.
