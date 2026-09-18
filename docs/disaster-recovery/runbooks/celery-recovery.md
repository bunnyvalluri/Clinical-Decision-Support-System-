# Runbook 03: Celery Task Worker & Queue Recovery

## 1. Symptoms
- Background ML training jobs or search indexing tasks stall indefinitely.
- Alert `ALERT-CELERY-FAILURES` triggers with elevated failure count.
- Celery task backlog grows > 100 unprocessed messages.

## 2. Detection
- Celery ping fails: `celery -A config inspect ping` reports no responding workers.
- Prometheus metric `celery_tasks_failed_total` spikes.

## 3. Preconditions
- Redis broker connection is healthy.
- Neon database is reachable.

## 4. Authorization
- Platform Engineer or SRE authorized.

## 5. Step-by-Step Execution
1. **Inspect Worker Process State**:
   ```bash
   docker compose top celery_worker
   ```
2. **Inspect Dead-Letter Queue**:
   Check if failed tasks are poisonous / non-idempotent payloads:
   ```bash
   python manage.py celery_inspect_dlq
   ```
3. **Graceful Worker Pool Restart**:
   Issue warm shutdown signal (SIGTERM) to allow in-flight tasks to complete:
   ```bash
   docker compose restart celery_worker
   ```
4. **Purge Poisonous Messages**:
   If an unhandled exception causes an infinite crash loop, purge only the offending queue:
   ```bash
   celery -A config purge -f -Q ml_training
   ```
5. **Scale Worker Concurrency**:
   Adjust concurrency in `.env` if workers experienced Out-Of-Memory (OOM) kills.

## 6. Validation
- Worker logs show `[Ready]`.
- Task dispatch test succeeds: `python manage.py test_celery_task`.

## 7. Rollback
- If new worker configuration causes errors, revert container image tag to previous commit.

## 8. Escalation Path
- On-Call SRE -> Lead Backend Engineer.

## 9. Post-Recovery Monitoring
- Monitor task success rate and worker memory utilization for 2 hours.
