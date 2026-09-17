# NocoDB Data Synchronization & Cache Strategy

> **HealthNova AI — Clinical Decision Support System (BPY-CSE-2666)**  
> **Source of Truth:** Neon PostgreSQL | **Engine:** Celery + Django Signals + Redis

---

## 1. Synchronization Architecture

NocoDB is maintained as an auxiliary analytics projection. To guarantee that Neon PostgreSQL remains the authoritative source of truth, data flow is primarily **outward unidirectional (Neon -> NocoDB)**.

```
[ Neon PostgreSQL ]
        |
        +---> [ Django Signals (post_save / post_delete) ] ---> [ Redis Queue ]
        |                                                              |
        +---> [ Celery Periodic Beat (Every 15m) ]                     |
                                                                       v
                                                        [ NocoDB Sync Worker ]
                                                                       |
                                                                       v
                                                        [ NocoDB Analytics Feeds ]
```

---

## 2. Sync Triggers & Channels

1. **Scheduled Periodic Sync:**
   - **Job:** `sync_nocodb_analytical_projections`
   - **Interval:** Every 15 minutes (`crontab(minute='*/15')`)
   - **Tables:** Model Evaluations, Drift Statistics, Data Quality Summary, Workflow Aggregates.
2. **Event-Driven Instant Sync:**
   - On new ML Prediction completion (`Prediction.post_save`), an anonymized projection record is emitted asynchronously via Redis task.
   - On new Data Quality Issue detection, queue is refreshed within 3 seconds.
3. **Manual Sync Trigger:**
   - Authorized Informaticists and IT Admins can trigger an on-demand sync from `/informaticist/data-workspace` or `/admin/nocodb` via `POST /api/v1/nocodb/sync/trigger/`.

---

## 3. Conflict Resolution & Idempotency

- All synced records utilize an idempotent deterministic primary key derived from the source UUID (`anon_ref_id` = `hash(source_id + salt)`).
- Upserts use `INSERT ... ON CONFLICT (anon_ref_id) DO UPDATE`.
- Deletions in Neon PostgreSQL propagate soft-deletion status (`is_archived = true`) to NocoDB records to preserve audit continuity.
