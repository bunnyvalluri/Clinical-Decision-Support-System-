# Clinical Whiteboard Operations, Retention & Security Controls

> **Operational Scope:** Whiteboard Persistence, Celery Background Workers, Retention & Disposal  
> **Authoritative Database:** Neon PostgreSQL (`apps.whiteboards`)  

---

## 1. Storage & Retention Policies

In healthcare informatics, diagrammatic records containing patient workflow paths or annotations must follow strict retention schedules:

| Classification | Retention Window | Storage Strategy | Disposal Protocol |
| :--- | :--- | :--- | :--- |
| `PHI` / `CARE_PLAN` | 7 Years from discharge | Encrypted at rest in Neon PostgreSQL | Cryptographic wipe & audit record |
| `INTERNAL` / `WORKFLOW` | 3 Years | Standard retention in Neon | Soft-delete to `ARCHIVED`, periodic purge |
| `AI_GENERATED_DRAFTS` | 90 Days if not approved | Transient staging document table | Celery automated sweep |
| `EXPORT_TMP_ASSETS` | 24 Hours | Ephemeral server storage / cache | Automated hourly cron wipe |

---

## 2. Background Tasks & Celery Workers

Whiteboard lifecycle and asset operations run via Celery workers:
1. **`clean_expired_shares`**:
   - Frequency: Hourly
   - Description: Scans `WhiteboardShare` for tokens where `expires_at < now()` and marks them revoked.
2. **`archive_stale_drafts`**:
   - Frequency: Daily
   - Description: Flags unedited draft whiteboards older than 180 days with no linked active patient.
3. **`validate_document_integrity`**:
   - Frequency: Weekly
   - Description: Recalculates SHA-256 content hashes across historical versions to verify zero tampering.
4. **`cleanup_orphaned_assets`**:
   - Frequency: Weekly
   - Description: Removes uploaded images/assets unreferenced by any version of any whiteboard.

---

## 3. Disaster Recovery & Replication

1. **Point-In-Time Restore**: Neon PostgreSQL provides continuous write-ahead logging (WAL) and instant branching for non-destructive disaster recovery.
2. **Audit Log Immutability**: All edits, share events, version restores, and clinical approvals are written to `WhiteboardAuditEvent` rows that have database-level update prevention.
