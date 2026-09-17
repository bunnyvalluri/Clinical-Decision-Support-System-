# Ruflo Operations Runbook & Monitoring Guide

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. Operational Health Verification

To verify the operational status of the multi-agent orchestration harness:
1. **API Health Endpoint**: `GET /api/v1/health/` verifies database, Redis, and ML engine responsiveness.
2. **AI Orchestrator Metrics**: `GET /api/v1/ai/metrics/` returns active tasks, failure rates, and average agent latency.
3. **Admin Observability UI**: Navigate to `/admin/ai` for visual health indicators.

---

## 2. Common Operational Tasks

### A. Inspecting Failed Agent Workflows
```bash
# Filter failed tasks from Django shell
python manage.py shell -c "from apps.ai_orchestrator.models import AgentTask; print(AgentTask.objects.filter(status='FAILED')[:10])"
```

### B. Manually Clearing Stuck Tasks
Any task exceeding the 60-second execution window is automatically set to `TIMED_OUT` by Celery periodic maintenance. To force cleanup:
```bash
python manage.py shell -c "from apps.ai_orchestrator.models import AgentTask; AgentTask.cleanup_stale_tasks(timeout_seconds=60)"
```

### C. Rotating Token & Cryptographic Secrets
1. Update `JWT_SIGNING_KEY` in `.env`.
2. Restart Daphne and Celery worker services.
3. Blacklist active refresh tokens via `manage.py flushexpiredtokens`.
