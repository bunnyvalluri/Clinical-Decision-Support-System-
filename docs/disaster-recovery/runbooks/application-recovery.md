# Runbook 04: Application Container & ASGI Backend Recovery

## 1. Symptoms
- HTTP 502 Bad Gateway or 504 Gateway Timeout returned to bedside clients.
- Alert `ALERT-API-HIGH-ERROR-RATE` fires with severity `HIGH`.
- Daphne ASGI web server process exits abruptly or crashes on unhandled exceptions.

## 2. Detection
- System health probe returns connection refused on port 8000.
- Docker daemon reports container state `Exited (1)` or `Restarting`.

## 3. Preconditions
- Database and Redis dependencies confirmed reachable.
- Host disk space and RAM checked for exhaustion.

## 4. Authorization
- On-Call SRE or IT Administrator.

## 5. Step-by-Step Execution
1. **Inspect Application Crash Logs**:
   ```bash
   docker compose logs --tail=100 backend
   ```
2. **Check Memory / Resource Exhaustion**:
   ```bash
   docker stats --no-stream
   ```
3. **Restart Daphne ASGI Service**:
   ```bash
   docker compose restart backend
   ```
4. **If Container Fails on Startup**:
   - Check environment variables in `.env`.
   - Re-run Django configuration check:
     ```bash
     docker compose run --rm backend python manage.py check
     ```
5. **Revert to Previous Known-Good Docker Image**:
   If a recent code deploy caused the crash, execute instant rollback:
   ```bash
   bash infra/scripts/rollback_deployment.sh app-backend <PREVIOUS_COMMIT_SHA>
   ```

## 6. Validation
- `curl -I http://localhost:8000/api/v1/infrastructure/health/` returns HTTP 200.
- Clinician authentication endpoint `/api/v1/auth/login/` responds.
- 14-Point restoration probe passes.

## 7. Rollback
- Revert environment variable changes or redeploy audited Docker image.

## 8. Escalation Path
- On-Call SRE -> Lead Software Architect.

## 9. Post-Recovery Monitoring
- Monitor HTTP 5xx error rate and p95 latency for 60 minutes.
