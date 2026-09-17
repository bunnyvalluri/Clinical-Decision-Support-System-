# Search Architecture & Topology — Meilisearch & Neon PostgreSQL

**Project:** BPY-CSE-2666 (HealthNova AI Clinical Decision Support System)  
**Classification:** Internal Technical Architecture Guide  

---

## 1. High-Level Data Flow

The following topology illustrates the end-to-end data lifecycle from user interactions to search queries, indexing, and real-time synchronization:

```
                         USERS (Doctor, Nurse, Informaticist, Admin, Patient)
                                                  │
                                                  ▼
                                          NEXT.JS FRONTEND
                                                  │
                                  ┌───────────────┴───────────────┐
                                  ▼                               ▼
                           Clinical Actions                 Search UI (Cmd+K)
                                  │                               │
                                  ▼                               ▼
                         DJANGO REST FRAMEWORK            DJANGO SEARCH API
                         (Authoritative Logic)         (/api/v1/search/*)
                                  │                               │
                      ┌───────────┴───────────┐                   │
                      ▼                       ▼                   ▼
             NEON POSTGRESQL          SEARCH OUTBOX       SEARCH POLICY SERVICE
             (Source of Truth)          (Neon DB)       (Role & Filter Enforcer)
                                              │                   │
                                              ▼                   ▼
                                        CELERY WORKER        MEILISEARCH
                                              │              (v1.12.0)
                                              ▼                   │
                                    SEARCH PROJECTION             ▼
                                         SERVICE            Fast Results
                                              │                   │
                                              ▼                   ▼
                                         MEILISEARCH       DJANGO SANITIZER
                                         (Port 7700)              │
                                                                  ▼
                                                          AUTHORIZED RESULTS
```

---

## 2. Core Architectural Pillars

### 2.1 Authoritative Source of Truth
Neon PostgreSQL remains the sole database of record for:
- Patients, demographics, and primary physician assignments
- Encounters, vitals, lab results, and triage queues
- ML risk predictions, SHAP explainability values, and model registry artifacts
- User accounts, role permissions, and immutable audit events
- Data quality issues, whiteboards, and external API ingested telemetry

Meilisearch stores **projections only**. In the event of catastrophic data loss in Meilisearch, the entire index state is reconstructed directly from Neon PostgreSQL using Celery batch jobs.

### 2.2 Asynchronous Transactional Outbox Pattern
To prevent distributed transaction failures (dual-write anomalies where a record commits to PostgreSQL but fails to write to Meilisearch), we implement the Transactional Outbox Pattern:
1. When any authoritative model (`Patient`, `Prediction`, `ClinicalRecord`, `ModelVersion`, etc.) is saved or soft-deleted, a Django post-save signal writes an event to the `SearchOutboxEvent` table inside the same database transaction.
2. An asynchronous Celery task (`process_search_outbox_task`) polls or receives notifications for pending outbox items.
3. The Celery worker converts the entity into a normalized projection via `SearchProjectionService` and transmits it to Meilisearch.
4. Upon successful task receipt or confirmation, the outbox record is marked `PROCESSED`.

### 2.3 Resilient Degraded Mode Fallback
If Meilisearch becomes unreachable (due to network partition, restart, or heavy index recomputation), the backend does not raise an unhandled exception or break clinician workflows. Instead:
1. The `MeilisearchService` detects connection failure via its circuit-breaker mechanism.
2. The request automatically cascades to `PostgresFallbackSearchService`.
3. The fallback service executes a parameterized, role-filtered SQL query against Neon PostgreSQL with strict row limits.
4. The response payload includes a header `X-Search-Mode: degraded-postgres` and an advisory indicator `search_status: "DEGRADED"`, notifying the frontend to display an honest "Live search operating in degraded mode" badge.
