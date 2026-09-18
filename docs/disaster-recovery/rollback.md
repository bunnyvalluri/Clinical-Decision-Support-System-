# HealthNova AI CDSS — Multi-Tier Rollback Strategy & Protocol

## 1. Multi-Tier Rollback Topology

HealthNova AI supports version-aware rollbacks across 6 operational layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MULTI-TIER ROLLBACK                             │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Frontend Web App      ──> Revert Next.js container / Vercel commit │
│ 2. Backend ASGI API      ──> Revert Daphne ASGI Docker image digest   │
│ 3. Celery Async Worker   ──> Revert worker pool container image       │
│ 4. ML Prediction Model   ──> Revert active pointer in Model Registry  │
│ 5. Database Schema       ──> Revert via Expand/Contract migrations    │
│ 6. Configuration/Nginx   ──> Revert version-controlled config repo    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Version-Aware Compatibility Invariant

> [!IMPORTANT]
> **Strict Version Compatibility Guard**:
> An application rollback cannot be performed independently of its model and schema dependencies.
> Example:
> If Application v42 depends on Model v17 (Feature Schema v2.0), rolling back Application to v41 will fail if Model v17 requires features absent in v41. The rollback engine strictly checks `compatibility_verified=True` before switching active pointers.

---

## 3. Database Migration Safety: The Expand / Contract Pattern

To prevent rolling deployment deadlocks and enable safe rollback, all production database migrations follow the **Expand / Contract** lifecycle:

```
[ Step 1: EXPAND ]   ──> Add new columns / tables with NULL or DEFAULT. Old code continues working.
         │
[ Step 2: DEPLOY ]   ──> Deploy new application code that writes to both old and new columns.
         │
[ Step 3: MIGRATE ]  ──> Backfill historical data into new schema asynchronously.
         │
[ Step 4: SWITCH ]   ──> Switch application reads to the new schema exclusively.
         │
[ Step 5: CONTRACT ] ──> In a subsequent deployment, remove deprecated columns safely.
```

If an emergency rollback occurs during Steps 1–3, the database remains 100% backward-compatible with the older application version.

---

## 4. Operational Rollback Procedures

### 4.1 Application Rollback (via Coolify / Docker)
```bash
# Execute automated rollback script with explicit confirmation
bash infra/scripts/rollback_deployment.sh <application_uuid> <target_commit_sha>
```
Or via the Admin UI at `/admin/disaster-recovery` (Rollback Center tab).

### 4.2 Machine Learning Model Rollback
When an active production model displays calibration drift, elevated Brier score, or inference latency:
```bash
# Demote current model and promote previous approved version
curl -X POST http://localhost:8000/api/v1/infrastructure/rollback/ \
  -H "Authorization: Bearer $IT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rollback_type": "MODEL",
    "target_model_version": "1.0.0",
    "confirmation": "CONFIRM_ROLLBACK",
    "reason": "Elevated false alarm rate observed in ICU unit"
  }'
```

The system verifies that target model version `1.0.0` is in `APPROVED` status and matches the current feature schema before activating.
