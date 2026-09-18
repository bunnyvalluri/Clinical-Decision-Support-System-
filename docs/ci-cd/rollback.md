# Production Rollback Procedure — HealthNova AI

## Rollback Triggers
A rollback must be initiated immediately if:
1. Post-deployment synthetic health checks fail (`verify:post-deployment-health`).
2. Error budgets or unhandled 5xx errors exceed 0.1% over a 5-minute sliding window.
3. Real-time WebSocket connection drop rates spike beyond acceptable clinical safety thresholds.

---

## 3-Step Rollback Execution

### 1. Instant Container Reversion (Coolify)
Revert the running application containers to the previously verified immutable commit SHA:
```bash
# Redeploy the previous verified release tag
curl -fsSL -X POST "$COOLIFY_WEBHOOK_URL_PROD_ROLLBACK"
```
Or redeploy via Coolify dashboard by selecting the prior deployment build and clicking **Rollback**.

### 2. Database Schema Rollback (Controlled Neon Point-in-Time Restore)
Neon PostgreSQL provides instant zero-copy branch restoration:
```bash
# If migration was non-backwards compatible, revert to pre-migration snapshot:
neon branches reset-from-parent --branch production-active --parent-point-in-time "pre-deployment-timestamp"
```

### 3. Incident Audit & Post-Mortem Logging
All rollback operations emit an automated audit entry to `ai_interactions` and `agent_tasks` in Neon PostgreSQL, notifying authorized system administrators via Slack / WebSocket alerts.
