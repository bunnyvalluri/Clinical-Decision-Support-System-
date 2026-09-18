# Runbook 09: Search Engine (Meilisearch) Recovery & Index Rebuild

## 1. Symptoms
- Clinical patient lookup or medical guidelines search returns 500 error or empty results.
- Search indexing tasks fail with connection refused on port 7700.

## 2. Detection
- Health check probe reports `meilisearch: UNHEALTHY`.
- Meilisearch container state shows `Exited` or storage volume corrupted.

## 3. Preconditions
- Remember: **Meilisearch is derived data (Category D)**.
- Neon PostgreSQL is the sole authoritative clinical source of truth.
- Do NOT restore stale search snapshots over newer clinical data. Rebuild from Neon.

## 4. Authorization
- Search Platform Engineer or SRE.

## 5. Step-by-Step Execution
1. **Verify Search Degraded Mode Fallback**:
   Verify that patient lookups automatically fallback to PostgreSQL relational search (`ILIKE`):
   ```bash
   curl -s "http://localhost:8000/api/v1/patients/search/?q=Smith"
   ```
2. **Restart Meilisearch Container**:
   ```bash
   docker compose restart meilisearch
   ```
3. **If Search Index Data is Corrupted**:
   Wipe corrupted local index volume and restart clean daemon:
   ```bash
   docker compose stop meilisearch
   rm -rf /data/meilisearch/data.ms
   docker compose up -d meilisearch
   ```
4. **Trigger Streaming Index Rebuild from Neon PostgreSQL**:
   Execute asynchronous re-indexing task:
   ```bash
   python manage.py rebuild_search_indexes --all
   ```
5. **Re-apply Authorization Filters and Settings**:
   Verify searchable and filterable attributes (`tenant_id`, `clinical_unit`, `role_visibility`) are applied.

## 6. Validation
- Meilisearch health endpoint returns `{"status": "available"}`.
- Search query for active patient returns accurate result in < 50ms.

## 7. Rollback
- If index rebuild fails, keep `SEARCH_DEGRADED_FALLBACK_ENABLED=True` to route all queries to Neon.

## 8. Escalation Path
- Search Platform Engineer -> Lead Backend Architect.

## 9. Post-Recovery Monitoring
- Monitor search latency and indexing task backlog for 2 hours.
