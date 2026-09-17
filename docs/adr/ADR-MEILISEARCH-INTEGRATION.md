# Architecture Decision Record (ADR): Meilisearch Integration for Clinical Search & Retrieval

- **Status:** Approved
- **Deciders:** HealthNova AI Architectural Review Board, Lead Clinical Informaticist, DevSecOps Lead, HIPAA Security Officer
- **Date:** 2026-09-17
- **Project:** BPY-CSE-2666 (Clinical Decision Support System)

---

## Context

The Clinical Decision Support System requires ultra-low latency, typo-tolerant search across patient cohorts, risk assessments, triage workflows, machine learning model registries, and clinical guidelines.

Prior to this integration, search was performed via relational `LIKE` and `ILIKE` queries against Neon PostgreSQL. As dataset volume, encounter logs, and multi-disciplinary teams (Doctor, Nurse, Informaticist, IT Admin, Patient) grow, direct OLTP querying introduces significant architectural challenges:
1. **OLTP Concurrency Degradation:** Full-text scans and complex regex filters degrade write throughput on transactional clinical tables.
2. **Clinical Terminology & Typo Handling:** Clinicians entering symptom descriptions or search terms require intelligent typo tolerance, whereas exact Medical Record Numbers (MRNs) require zero fuzziness to avoid dangerous patient misidentification.
3. **Role-Scoped Projection:** Different roles need tailored field projections and filtering rules (e.g. Informaticists inspect model drift, Nurses monitor triage queues, Patients access only their own records).

---

## Decision

We integrate **Meilisearch v1.12.0** as an auxiliary **Search Projection Engine** governed by the following strict architectural invariants:

1. **Neon PostgreSQL is the SOLE AUTHORITATIVE SOURCE OF TRUTH.**
   Meilisearch holds only eventual projections. No clinical record is created, edited, or deleted directly in Meilisearch.
2. **Django is the Authoritative Business and Authorization Layer.**
   Search queries from the frontend flow through `/api/v1/search/`. Django determines the user's role, applies mandatory filters, resolves permissions, queries Meilisearch, sanitizes the response, logs the audit event, and returns the result.
3. **Asynchronous Transactional Projection via Celery & Outbox:**
   PostgreSQL transactions create domain events in `SearchOutboxEvent`. Celery workers process these events to update Meilisearch idempotently.
4. **Exact Medical Identifier Safety:**
   Typo tolerance is strictly disabled for numeric IDs, MRNs, patient IDs, prediction UUIDs, and model versions.
5. **Degraded Mode Resilience:**
   If Meilisearch is unreachable or undergoing maintenance, the backend seamlessly falls back to a safe, parameterized PostgreSQL search for critical clinical queries. Core clinical operations never stop.
6. **Zero PHI Secrets:**
   Passwords, API keys, private tokens, and unmasked notes are never indexed. All search queries in logs are redacted or hashed.

---

## Consequences

### Positive
- Sub-50ms search latency across authorized clinical entities with typo tolerance on medical terms.
- Clean offloading of search computation from the transactional PostgreSQL database.
- Complete 5-role RBAC enforcement with zero client-side filter manipulation risk.
- High resilience via automatic degraded-mode fallback to PostgreSQL.

### Negative / Trade-offs
- Additional microservice container (`meilisearch:v1.12.0`) in the Docker composition requiring 256MB–512MB RAM.
- Eventual consistency lag (typically < 200ms via Celery, monitored by `SearchIndexRegistry` freshness lag).
- Need to maintain schema version migrations (`search_schema_version`) across document builders.
