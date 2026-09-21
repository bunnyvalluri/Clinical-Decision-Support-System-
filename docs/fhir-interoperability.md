# HealthNova AI — FHIR R4 Interoperability Specification

> **Standard:** HL7 FHIR Release 4 (v4.0.1)  
> **Topology:** Interoperability Boundary Layer (Non-Authoritative)  
> **Authoritative Application Store:** Neon PostgreSQL  
> **Document Identifier:** HN-FHIR-INTEROP-R4-2026

---

## 1. Executive Overview

HealthNova AI implements an enterprise-grade, secure, and auditable HL7 FHIR Release 4 (v4.0.1) interoperability layer. The platform serves clinical decision support and patient risk level predictions powered by machine learning, while facilitating structured clinical data exchange with external electronic health record (EHR) systems, Health Information Exchanges (HIEs), and laboratory networks.

### Mandatory Healthcare Standard
1. **Neon PostgreSQL as the Sole Authoritative Source of Truth**: Incoming FHIR resources never overwrite internal clinical models directly without schema validation, identity matching, normalization, data-quality bounds auditing, and human review gates where ambiguity exists.
2. **Zero PHI in Logs or Realtime Broadcasts**: Identifiable patient information is scrubbed from audit log details, metrics, error traces, and WebSocket messages.
3. **No Autonomous AI Modification**: AI agents and automated pipelines never execute autonomous medical diagnoses or patient record merges. All reconciliation workflows are strictly clinician-in-the-loop.

---

## 2. Selected FHIR Version

- **FHIR Version:** HL7 FHIR Release 4 (v4.0.1)
- **Rationale:** FHIR R4 is the globally recognized statutory baseline for US Core (ONC 2015 Edition Cures Update) and international digital health platforms. It provides normative resource definitions for `Patient` and `Observation`, offering predictable schemas and backward compatibility.
- **MIME Types Supported:** `application/fhir+json`, `application/json`

---

## 3. Supported FHIR Resources

| FHIR Resource | Direction | Status | HealthNova Domain Mapping | Clinical Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | Bi-directional | SUPPORTED | `apps.patients.models.Patient` | Demographics, MRN, contact info, emergency contacts |
| **Observation** | Bi-directional | SUPPORTED | `apps.clinical.models.ClinicalRecord` | Vitals (BP, HR, SpO2, Temp, RR) & Labs (WBC, Creatinine) |
| **Condition** | Bi-directional | SUPPORTED | `apps.clinical.models.ClinicalRecord` | Medical history, comorbidities, active diagnoses |
| **Encounter** | Bi-directional | SUPPORTED | `apps.clinical.models.ClinicalRecord` | Inpatient, outpatient, emergency department visits |
| **DiagnosticReport** | Inbound Import | SUPPORTED | `apps.clinical.models.ClinicalRecord` | Laboratory panels, pathology, imaging summaries |
| **ServiceRequest** | Inbound Import | SUPPORTED | `apps.clinical.models.ClinicalRecord` | Clinical diagnostic orders, lab requisitions |
| **RiskAssessment** | Outbound Export | SUPPORTED | `apps.predictions.models.Prediction` | ML risk predictions (Low, Medium, High), SHAP attributions |
| **Bundle** | Bi-directional | SUPPORTED | Transaction & Searchset | Batch exchange & `$everything` clinical chart export |
| **Provenance** | Bi-directional | SUPPORTED | `interop_provenance_records` | Cryptographic SHA-256 data lineage & source tracking |

---

## 4. Architectural Boundary

```
External EHR / FHIR Server (Epic, Cerner, HIE)
                       │
                       │ (Mutual TLS / SMART on FHIR OAuth2)
                       ▼
          [FHIR Ingestion Gateway]
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
[Payload Sanitizer]       [Rate Limiter & SSRF Guard]
         │
         ▼
[FHIR R4 Structural Validator]
         │
         ▼
[Patient Identity Matcher]
   ├── Confirmed Match ──────────┐
   ├── Ambiguous / Conflict ─────┼──► [Human Review Queue]
   └── Not Found ────────────────┘
         │
         ▼
[Clinical Bounds Validator] (Physiological sanity checks)
         │
         ▼
[Terminology Translation] (LOINC, SNOMED CT, ICD-10)
         │
         ▼
[Domain Normalization Layer]
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│               Neon PostgreSQL (Authoritative)           │
│       Patients · ClinicalRecords · Predictions          │
└─────────────────────────────────────────────────────────┘
         │                                       │
         ▼                                       ▼
  [ML Feature Pipeline]                 [Clinician Workspaces]
(Lineage & Drift Checked)             (Doctor / Nurse Review)
```

---

## 5. Security & Privacy Controls

1. **SSRF & Private IP Blocking:** All outbound FHIR client requests block private subnet ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, loopback, link-local, AWS metadata `169.254.169.254`).
2. **Payload Size Quotas:** Inbound JSON payloads are capped at 10 MB to prevent JSON parser denial-of-service.
3. **Role-Based Access Control (RBAC):**
   - `ADMIN` & `INFORMATICIST`: Full management of endpoints, mapping versions, terminology, and reconciliation queues.
   - `DOCTOR` & `NURSE`: View authorized patient clinical records and provenance metadata.
   - `PATIENT`: View authorized self-record exports and provenance history.
