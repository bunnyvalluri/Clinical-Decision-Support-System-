# Search Reindexing, Blue/Green Aliasing & Reconciliation

**Project:** BPY-CSE-2666 HealthNova AI  
**Scope:** Zero-Downtime Migration, Schema Versioning, and Reconciliation  

---

## 1. Zero-Downtime Reindexing (Blue/Green Swapping)

When changing index settings, schema versions, or ranking rules, in-place reindexing could disrupt live user queries. We implement versioned indexes with an aliasing swap strategy:

1. **Active State:** Queries point to index `patients_v1`.
2. **New Index Initialization:** Create `patients_v2` with updated settings.
3. **Bulk Ingestion:** Celery worker chunks Neon PostgreSQL records into batches of 500 documents and loads them into `patients_v2`.
4. **Validation:** Ensure document count matches PostgreSQL count within tolerance.
5. **Atomic Cutover:** The application configuration switches active pointer to `patients_v2`.
6. **Drain & Deprecate:** `patients_v1` is kept for 24 hours as a rollback buffer before deletion.

---

## 2. Automated Reconciliation (`SearchIndexReconciliationTask`)

A scheduled Celery beat task runs periodically:
- Compares active PostgreSQL row counts against Meilisearch document counts.
- Detects stale documents where `source_updated_at > indexed_at`.
- Emits real-time diagnostic alerts via Django Channels WebSocket if drift exceeds 1%.
- Automatically re-queues missing or stale documents for projection.
