# HealthNova AI — Interoperability Operations & Runbook

> **Audience:** IT System Administrators, Medical Informaticists, Clinical DevOps  
> **Component:** HealthNova FHIR Hub & Integration Gateway  
> **Document Identifier:** HN-INTEROP-OPS-2026

---

## 1. Daily Operations & System Health Monitoring

Informaticists and DevOps teams monitor interoperability health across four operational vectors:

### A. Endpoint Health Statuses
- **`CONNECTED`**: Endpoint responded to FHIR `/metadata` ping with HTTP 200 within latency threshold (< 2000ms).
- **`DEGRADED`**: Endpoint is responding, but latency exceeds threshold (> 2000ms) or error rate exceeds 5% in last hour.
- **`OFFLINE`**: Endpoint connection timed out or socket error occurred. Outbound sync paused; retries queued with exponential backoff.
- **`AUTHENTICATION_FAILED`**: OAuth2 token expired or mTLS handshake failed. Requires credential rotation in secret manager.
- **`NOT_CONFIGURED`**: Endpoint registered without active credentials or target base URL.

### B. Inbound Import Queue Management
Periodic ingestion runs via Celery Beat tasks:
- Task: `apps.interoperability.infrastructure.celery_tasks.execute_fhir_sync_job_task`
- Trigger on-demand: Available in Informaticist Workspace at `/informaticist/interoperability/imports`

### C. Human Review Queue (Conflicts & Reconciliations)
- Access: `/informaticist/interoperability/reconciliation`
- SLA: High-priority demographic conflicts (`DUPLICATE_PATIENT_MATCH`) must be resolved within 4 hours.

---

## 2. Emergency Escalation Procedures

```
[Integration Alerts: OFFLINE or AUTH_FAIL]
                   │
                   ▼
       [Check Celery Task Queue]
      celery -A config inspect active
                   │
                   ▼
    [Check Integration Logs in Portal]
    /admin/services/integrations
                   │
    ┌──────────────┴──────────────┐
    ▼                             ▼
[External EHR Outage]       [Internal Redis / Neon Issue]
Flag Endpoint as OFFLINE    Restart worker / verify connection
Notify Partner System       string in Vault / .env
```
