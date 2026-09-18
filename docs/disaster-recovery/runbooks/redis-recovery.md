# Runbook 02: Redis Broker & Cache Recovery

## 1. Symptoms
- Celery tasks fail to dispatch; Daphne ASGI raises `ConnectionError: Error connecting to Redis`.
- Alert `ALERT-REDIS-UNAVAILABLE` fires with severity `CRITICAL`.
- Realtime WebSocket connections disconnect and fallback to HTTP polling.

## 2. Detection
- Health check probe fails: `/api/v1/infrastructure/health/` reports `redis: UNHEALTHY`.
- Redis Upstash endpoint returns connection refused or auth failure.

## 3. Preconditions
- Acknowledge that Redis holds **Derived / Ephemeral (Category D)** state.
- Authoritative clinical records remain safe in Neon PostgreSQL.

## 4. Authorization
- On-Call SRE or DevOps Engineer authorized to restart and flush caches.

## 5. Step-by-Step Execution
1. **Probe Connection**:
   ```bash
   redis-cli -u "$REDIS_URL" ping
   ```
2. **If Hosted Redis (Upstash) is Partitioned**:
   - Check Upstash status dashboard.
   - If regional failure, update `REDIS_URL` to point to standby Redis instance or local Docker container:
     ```bash
     docker compose up -d redis
     ```
3. **Purge Stale Queues to Prevent Duplicate Clinical Actions**:
   Do **NOT** blindly replay stale queue items if they could trigger duplicate medication or alert dispatches:
   ```bash
   redis-cli -u "$REDIS_URL" flushdb
   ```
4. **Restart Dependent Consumers**:
   ```bash
   docker compose restart celery_worker backend
   ```
5. **Re-initialize Channels Groups**:
   Trigger WebSocket test endpoint to verify channel layer binds cleanly.

## 6. Validation
- `redis-cli ping` returns `PONG`.
- `/api/v1/infrastructure/health/` returns `redis: HEALTHY`.
- Celery worker reports active connection in logs: `connected to rediss://...`.

## 7. Rollback
- Revert `REDIS_URL` to primary endpoint once upstream resolves.

## 8. Escalation Path
- On-Call SRE -> Infrastructure Lead -> Upstash Support.

## 9. Post-Recovery Monitoring
- Monitor Celery task queue backlog and task latency for 60 minutes.
