# CDSS Data Ownership & Source-of-Truth Matrix

This document defines the strict, authoritative data ownership policy for the Clinical Decision Support System (CDSS). Every entity in the system has exactly **one** system of record. Ambiguous ownership, shadow databases, and dual-write architectures are strictly prohibited.

---

## Authoritative Ownership Matrix

| System Entity | Authoritative Store | Secondary Stores | PocketBase Access | Conflict Resolution Policy |
| :--- | :--- | :--- | :--- | :--- |
| **User Identity & Auth** | Neon PostgreSQL (Django Auth) | Redis (Session cache) | **Forbidden** (Tokens mapped externally) | Django DRF JWT is final authority |
| **Patient Profile** | Neon PostgreSQL (`patients_patient`) | None | **Forbidden** | Neon DB constraint is authoritative |
| **Medical Records (EHR)** | Neon PostgreSQL (`patients_medicalrecord`) | None | **Forbidden** | Neon DB constraint is authoritative |
| **Vitals & Triage Data** | Neon PostgreSQL (`patients_vitalsign`) | Redis (Transient streaming buffer) | **Forbidden** | Neon DB is authoritative store |
| **Risk Assessment & Scores** | Neon PostgreSQL (`ml_riskassessment`) | None | **Forbidden** | ML Inference engine commits to Neon |
| **ML Models & Checkpoints** | Disk Artifacts + Neon PostgreSQL (`ml_modelmetadata`) | None | **Forbidden** | Scikit-learn / ONNX registry in Neon |
| **Clinician Reviews & Overrides**| Neon PostgreSQL (`clinical_clinicalreview`) | None | **Forbidden** | Signed clinician action in Neon DB |
| **Clinical Appointments** | Neon PostgreSQL (`appointments_appointment`) | None | **Forbidden** | Neon DB transactional lock |
| **21 CFR Part 11 Audit Trail** | Neon PostgreSQL (`audit_auditlog`) | None | **Forbidden** | Append-only immutable log in Neon |
| **Async Tasks & Jobs** | Redis Broker + PostgreSQL Celery Beat | Redis Result Backend | **Forbidden** | Celery task ID tracked in Redis/Postgres |
| **Primary Real-time Telemetry** | Django Channels (ASGI) | Redis Channel Layer | **Forbidden** | WebSocket streaming direct to EHR |
| **Auxiliary UI Preferences** | PocketBase SQLite (`user_ui_preferences`) | Local Browser Cache | **Authoritative** (Non-clinical only) | Client local fallback if PB offline |
| **System Broadcast Banners** | PocketBase SQLite (`auxiliary_announcements`) | Client Memory | **Authoritative** (Non-clinical only) | Last-modified timestamp wins |

---

## The "Zero Dual-Write" Principle

1. **No Shadow Tables**: Under no circumstances will a `patient`, `prediction`, or `clinical_note` collection be instantiated in PocketBase.
2. **Clinical Exclusivity**: PocketBase SQLite contains zero Protected Health Information (PHI) and zero Personally Identifiable Information (PII).
3. **Decoupled Transactions**: PocketBase failures never roll back or inhibit Django REST Framework database commits into Neon PostgreSQL.
