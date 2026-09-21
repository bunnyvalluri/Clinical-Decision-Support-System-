# HealthNova AI — Interoperability Architecture & Domain Boundaries

> **Standard:** HL7 FHIR Release 4 (v4.0.1)  
> **Backend:** Django REST Framework + PostgreSQL  
> **Realtime:** Redis + Django Channels  
> **Task Processing:** Celery Async Workers  
> **Authoritative Database:** Neon PostgreSQL

---

## 1. System Architecture Overview

The HealthNova AI interoperability architecture isolates external untrusted healthcare data sources from the internal clinical data model and machine learning pipelines. 

```
┌────────────────────────────────────────────────────────────────────────┐
│                        External Healthcare Entities                    │
│   ┌─────────────────────┐   ┌─────────────────┐   ┌────────────────┐   │
│   │ Hospital Epic EMR   │   │ Cerner Millen.  │   │ Public Lab HIE │   │
│   └──────────┬──────────┘   └────────┬────────┘   └────────┬───────┘   │
└──────────────┼───────────────────────┼─────────────────────┼───────────┘
               ▼                       ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│             HealthNova FHIR Ingestion Gateway (/fhir/r4/)              │
│  - Mutual TLS / SMART on FHIR OAuth2 Auth                              │
│  - Anti-SSRF URL Sanitizer (Blocks RFC1918 / Loopback)                 │
│  - Rate Limiter (Token Bucket per Integration Connection)              │
│  - Inbound Payload Size Enforcer (Max 10MB)                            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Layered Interoperability Verification                   │
│                                                                        │
│  [1. Structural Validator] ──► Validates FHIR R4 JSON schema & types   │
│  [2. Security Sanitizer]   ──► Strips XSS / malicious injection scripts│
│  [3. Identity Matcher]     ──► Resolves internal Patient by MRN/OID    │
│  [4. Duplicate Detector]   ──► Checks SHA-256 hash & external ID       │
│  [5. Clinical Bounds Guard]──► Enforces physiological limits (Vitals)  │
│  [6. Terminology Mapper]   ──► Translates LOINC/SNOMED CT to internal  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
       [Safe Validation]                    [Ambiguity / Conflict]
              │                                         │
              ▼                                         ▼
┌───────────────────────────┐             ┌───────────────────────────────┐
│   Domain Model Persistence│             │    Human Review Queue         │
│  apps.clinical.models     │             │  interop_mapping_conflicts    │
│  apps.patients.models     │             │  (Informaticist Intervention) │
└─────────────┬─────────────┘             └───────────────────────────────┘
              │
              ├──────────────────────────────────┐
              ▼                                  ▼
┌───────────────────────────┐      ┌──────────────────────────────────────┐
│  Patient Timeline Service │      │   ML Feature & Inference Pipeline    │
│ (Realtime Clinical Record)│      │   - Risk Level Prediction            │
│                           │      │   - SHAP Explainability Engine       │
│                           │      │   - Clinical Review Gate             │
└───────────────────────────┘      └──────────────────────────────────────┘
```

---

## 2. Inbound Pipeline Workflow

1. **Transport Layer Authentication:**
   External systems authenticate using Mutual TLS (mTLS), Bearer API keys, or SMART on FHIR OAuth2 tokens.
2. **Payload Sanitization & Size Check:**
   Incoming JSON is examined for size limitations (<= 10MB) and string contents are checked for prohibited injection vectors.
3. **FHIR R4 Structural Verification:**
   The resource must define a recognized `resourceType` belonging to HealthNova's supported scope (`Patient`, `Observation`, `Condition`, `Encounter`, `DiagnosticReport`, `ServiceRequest`, `RiskAssessment`, `Bundle`).
4. **Patient Identity Resolution:**
   - The payload identifier array is inspected for registered MRN or National Health ID systems.
   - If an exact match is confirmed, the internal Patient UUID is bound.
   - If multiple candidates match with conflicting demographics, an `AMBIGUOUS_PATIENT_MATCH` conflict is raised, placing the transaction into the Human Reconciliation Queue without modifying patient records.
5. **Deduplication Check:**
   A SHA-256 digest is calculated over the raw payload. If the external resource ID and checksum match an existing record within the deduplication window, the import is handled idempotently without duplicating clinical rows.
6. **Clinical Bounds & Plausibility Validation:**
   Vitals (e.g. Heart Rate 20-300 bpm, Blood Pressure 30-300 mmHg) are checked against physiological limits. Anomalous values trigger a `SUSPICIOUS_CLINICAL_BOUNDS` conflict.
7. **Authoritative Persistence:**
   Normalized entities are saved inside an atomic Neon PostgreSQL transaction.
8. **Lineage & Audit Generation:**
   `FHIRProvenanceRecord` and `IntegrationAuditEvent` entries are recorded immutably.
