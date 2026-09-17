# NocoDB Operations, Health Monitoring & Runbook

> **HealthNova AI — Clinical Decision Support System (BPY-CSE-2666)**  
> **Telemetry:** Health Checks, Memory Bounds, Backup & Disaster Recovery

---

## 1. Container & Process Health Checks

The NocoDB container service runs under Docker with the following operational constraints:
- **Image:** `nocodb/nocodb:0.258.0`
- **Memory Limit:** 1.0 GB RAM
- **CPU Quota:** 1.0 vCPU
- **Internal Health Check:**
  ```yaml
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/api/v1/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
  ```
- **Backend Synthetic Health Check:** `GET /api/v1/nocodb/health/` verifies:
  1. NocoDB HTTP endpoint responsiveness.
  2. Neon PostgreSQL analytical table accessibility.
  3. Last successful Celery sync timestamp (< 30 minutes).

---

## 2. Backup & Recovery

- **Metadata DB Backup:** The NocoDB metadata file (`noco.db`) is backed up daily during the system maintenance window to encrypted cloud storage.
- **Stateless Rebuild:** Since all authoritative clinical and analytical data originates in Neon PostgreSQL, in the event of NocoDB container corruption, the NocoDB container and volume can be wiped and fully rebuilt by running:
  ```bash
  python manage.py rebuild_nocodb_projections --all
  ```
  Full re-hydration completes within 45 seconds for a standard 100,000-record cohort.

---

## 3. Incident Response & Troubleshooting

| Symptom | Probable Cause | Remediation |
|---|---|---|
| HTTP 502 / Connection Refused to NocoDB | Container exited / OOM | Check `docker logs healthnova-nocodb`; increase container RAM if >950MB. |
| Sync Stale Warning (>30m) | Celery worker blocked or Redis queue paused | Check `celery_tasks.ai_tasks` logs and restart Celery worker pool. |
| 403 Forbidden on Datasets | Session expired or Role lacks access | Verify JWT role claim; ensure dataset `allowed_roles` includes user persona. |
