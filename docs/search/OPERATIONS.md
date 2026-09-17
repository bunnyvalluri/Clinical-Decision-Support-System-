# Search Operations, Backups & Disaster Recovery

**Project:** BPY-CSE-2666 HealthNova AI  
**Scope:** Meilisearch Cluster Operations, Snapshots, and Rebuildability  

---

## 1. Snapshots & Persistent Storage

1. **Storage Layout:** Meilisearch state is maintained in `/meili_data/data.ms` mounted from the named Docker volume `meilisearch_data`.
2. **Periodic Snapshots:** Triggered daily via cron:
   ```bash
   curl -X POST 'http://localhost:7700/snapshots' -H 'Authorization: Bearer <MASTER_KEY>'
   ```
   Snapshots are written to `/meili_data/snapshots` and retained for 14 days.

---

## 2. Disaster Recovery: Rebuild From Neon PostgreSQL

Because Neon PostgreSQL is the authoritative source of truth, Meilisearch can be completely reconstructed from scratch at any moment:

### Disaster Recovery Runbook:
1. **Container Loss:** If the Meilisearch container or volume is lost or corrupted:
   ```bash
   docker compose down meilisearch
   docker volume rm 4-1_meilisearch_data
   docker compose up -d meilisearch
   ```
2. **Re-initialize Index Registry & Settings:**
   ```bash
   docker compose exec backend python manage.py setup_search_indexes
   ```
3. **Execute Full Asynchronous Rebuild:**
   ```bash
   docker compose exec backend python manage.py reindex_all_search
   ```
4. **Validation:**
   Verify document counts against Neon table row counts via `SearchIndexReconciliationTask`.
