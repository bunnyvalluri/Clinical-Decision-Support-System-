# HealthNova AI Operational Runbooks

This document contains actionable, production-grade runbooks for the 13 core operational failure modes of HealthNova AI.

---

### 1. Application Down
- **Symptoms**: Nginx returns 502 Bad Gateway; HTTP probe fails on `/api/v1/health/`.
- **Checks**: Check Coolify container status: `docker ps | grep backend`; inspect `docker logs backend`.
- **Likely Causes**: ASGI worker crashed due to unhandled startup exception; out of memory (OOMKilled).
- **Safe Mitigation**: Restart backend container via Coolify or Docker CLI: `docker restart healthnova-backend`.
- **Rollback**: Trigger automated rollback to previous known-good commit via `/admin/deployments` or CI/CD workflow.
- **Escalation**: On-call DevOps / SRE.
- **Recovery Verification**: Verify 200 OK from `/api/v1/health/` and `/health/live`.

---

### 2. Database Unavailable
- **Symptoms**: `ALERT-DB-UNAVAILABLE` fires; 500 errors on database-backed views; logs indicate connection timeout to Neon PostgreSQL.
- **Checks**: Inspect Neon Console; run `GET /api/v1/observability/health/`; verify compute endpoint state.
- **Likely Causes**: Neon compute endpoint scaled to zero or suspended; connection pool saturated (max clients exceeded).
- **Safe Mitigation**: Restart Neon compute endpoint via Neon MCP / CLI (`start_postgres_endpoint`); verify connection pooler URL is used instead of direct connection.
- **Rollback**: Switch connection string to Neon point-in-time branch if schema corruption occurred.
- **Escalation**: SRE Database Administrator.
- **Recovery Verification**: `SELECT 1;` executes under 20ms; `/api/v1/observability/health/` reports `database: HEALTHY`.

---

### 3. Redis Unavailable
- **Symptoms**: Celery workers disconnect; Django Channels WebSockets fail; session/cache reads throw `ConnectionError`.
- **Checks**: Check Redis container: `docker logs healthnova-redis`; verify TCP port 6379 connectivity.
- **Likely Causes**: Redis process crash, memory limit exceeded without eviction policy.
- **Safe Mitigation**: Restart Redis container: `docker restart healthnova-redis`. Verify `maxmemory-policy` is set to `volatile-lru`.
- **Rollback**: Restore Redis persistence snapshot (RDB/AOF) if data corruption suspected.
- **Escalation**: Platform Engineering / SRE.
- **Recovery Verification**: Redis responds to `PING` with `PONG`; Celery workers re-establish heartbeats.

---

### 4. Celery Queue Backlog
- **Symptoms**: `ALERT-CELERY-BACKLOG` fires; task latency spikes; background predictions delayed.
- **Checks**: Inspect Celery queue length in `/admin/monitoring`; check `celery inspect active` and worker CPU usage.
- **Likely Causes**: Long-running Kaggle dataset ingest blocking workers; worker deadlock; worker crashed.
- **Safe Mitigation**: Scale out Celery worker containers: `docker compose up -d --scale celery_worker=4`.
- **Rollback**: Purge stuck non-critical tasks if pipeline retry loop is identified: `celery -A config purge`.
- **Escalation**: Backend / Async Task Engineer.
- **Recovery Verification**: Queue backlog drops below 10 tasks; task completion rate normalizes.

---

### 5. WebSocket Failure
- **Symptoms**: `ALERT-WEBSOCKET-FAILURE` fires; frontend shows "Reconnecting to live telemetry..."; real-time triage updates stop.
- **Checks**: Check ASGI Daphne/Uvicorn channel layer logs; verify Redis channel layer health.
- **Likely Causes**: Channel layer disconnect; expired JWT authorization tokens causing rejection storms.
- **Safe Mitigation**: Cycle ASGI Daphne workers; verify Redis channel layer settings in Django.
- **Rollback**: Fallback frontend to HTTP polling mode while socket transport is investigated.
- **Escalation**: Frontend & Realtime Backend Engineers.
- **Recovery Verification**: Active connections gauge increases on `/admin/monitoring`; socket echo messages succeed.

---

### 6. High API Error Rate
- **Symptoms**: `ALERT-HIGH-5XX-RATE` fires; HTTP 5xx rate exceeds 5% over 5 minutes.
- **Checks**: Check `/admin/logs/application`; group errors by endpoint and status code.
- **Likely Causes**: Third-party API failure; broken database migration; unhandled edge case in recent deployment.
- **Safe Mitigation**: Deploy hotfix or enable circuit breaker on failing external dependency.
- **Rollback**: Trigger immediate release rollback to previous deployment commit SHA.
- **Escalation**: Application Development Team Lead.
- **Recovery Verification**: 5xx error rate drops below 0.1% for 15 consecutive minutes.

---

### 7. High API Latency
- **Symptoms**: p95 HTTP latency exceeds 1,500ms; clinician page loads feel sluggish.
- **Checks**: Check p95 metrics on `/admin/monitoring`; run query profiler; check database query locks.
- **Likely Causes**: Unindexed database query; unoptimized N+1 ORM call; slow external AI Gateway call.
- **Safe Mitigation**: Enable caching for frequently accessed static reference data; scale web workers.
- **Rollback**: Revert recent ORM queries or endpoint updates.
- **Escalation**: Backend Performance Engineer.
- **Recovery Verification**: p95 latency returns under 300ms across all core endpoints.

---

### 8. ML Inference Failure
- **Symptoms**: `ALERT-ML-INFERENCE-ERROR` fires; risk prediction requests return 500 or fallback scores.
- **Checks**: Inspect ML inference logs; check model artifact paths in container `/app/models/`.
- **Likely Causes**: Missing or corrupted serialized model pickle/joblib file; input feature schema mismatch.
- **Safe Mitigation**: Reload previous verified model artifact from model registry.
- **Rollback**: Switch active model version in model registry to previous verified champion model.
- **Escalation**: ML Engineer / Medical Informaticist.
- **Recovery Verification**: Synthetic test prediction returns valid calibrated probability and SHAP values.

---

### 9. Model Drift Alert
- **Symptoms**: PSI (Population Stability Index) > 0.2 or KS-test p-value < 0.05 on incoming clinical vitals.
- **Checks**: Review feature distribution histograms on `/informaticist/drift`.
- **Likely Causes**: Shift in patient population demographics or sensor hardware calibration changes.
- **Safe Mitigation**: Flag model for human clinician oversight; require mandatory clinical sign-off on all predictions.
- **Rollback**: Fallback to deterministic scoring rules (qSOFA, NEWS2) while model is retrained.
- **Escalation**: Medical Informaticist & Clinical Safety Agent.
- **Recovery Verification**: Retrained model validated against holdout dataset; bias and calibration tests pass.

---

### 10. AI Provider Failure
- **Symptoms**: LLM explanation requests fail or time out; AI Gateway returns 504.
- **Checks**: Check Databricks / Neon AI Gateway quota and status; verify local Ollama fallback container.
- **Likely Causes**: External LLM rate limit; provider outage; upstream network partition.
- **Safe Mitigation**: Automatically fail over to local Ollama instance or fallback to deterministic template explanations.
- **Rollback**: Disable generative explanations, displaying structured SHAP feature attributions only.
- **Escalation**: AI / Platform Engineer.
- **Recovery Verification**: AI Gateway health returns 200 OK; test prompt generates valid explanation under 2.0s.

---

### 11. Meilisearch Failure
- **Symptoms**: Patient and document searches return empty or 503 Service Unavailable.
- **Checks**: Inspect Meilisearch container logs: `docker logs healthnova-search`; check port 7700.
- **Likely Causes**: Disk full on search index volume; master key mismatch.
- **Safe Mitigation**: Free disk space or restart Meilisearch; re-trigger index rebuild Celery task.
- **Rollback**: Temporarily route searches directly through PostgreSQL full-text search.
- **Escalation**: DevOps / Search Infrastructure Engineer.
- **Recovery Verification**: Search endpoint returns indexed patient records in under 50ms.

---

### 12. Deployment Failure
- **Symptoms**: Coolify build or container deployment fails; git commit SHA deployment stuck in `FAILED`.
- **Checks**: Inspect Coolify deployment logs; review GitHub Actions CI/CD step logs.
- **Likely Causes**: Docker build test failure; database migration failure; invalid environment variable.
- **Safe Mitigation**: Stop failing deployment; verify current stable container remains running.
- **Rollback**: Trigger Coolify rollback to previous stable image tag.
- **Escalation**: DevOps / Release Engineer.
- **Recovery Verification**: Health check on current production endpoint returns 200 with stable version tag.

---

### 13. Security Incident
- **Symptoms**: Spike in authentication failures; rate limit trip on `/api/v1/auth/`; prompt injection detected by scanner.
- **Checks**: Inspect `/admin/logs/security` and `AuditLog` table for suspicious actor IPs and roles.
- **Likely Causes**: Credential stuffing attack; malicious user attempting prompt injection or unauthorized privilege escalation.
- **Safe Mitigation**: Block offending IP addresses at Nginx/Cloudflare level; revoke compromised user tokens and force password reset.
- **Rollback**: Temporarily enforce strict MFA and heighten rate limits.
- **Escalation**: IT Security Officer / CISO.
- **Recovery Verification**: Suspicious requests drop to zero; all administrative sessions re-authenticated.
