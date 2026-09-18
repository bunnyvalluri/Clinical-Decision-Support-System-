# Runbook 01: Neon PostgreSQL Database Recovery

## 1. Symptoms
- Application logs display `psycopg2.OperationalError: could not connect to server`.
- Alert `ALERT-DB-UNAVAILABLE` fires with severity `CRITICAL`.
- Clinical dashboard displays connection timeout or 503 Service Unavailable.

## 2. Detection
- Health check probe fails at `/api/v1/infrastructure/health/` with `database: UNHEALTHY`.
- Neon console shows compute endpoint in `FAILED` or `SUSPENDED` state.
- Prometheus database latency metric spikes to infinite or connection pool exhausted.

## 3. Preconditions
- Active SEV1 Incident ticket opened in Incident Tracker.
- Verified that network connectivity to `*.aws.neon.tech` is operational.
- Verified target restore timestamp (UTC).

## 4. Authorization
- **Requires**: Explicit authorization from On-Call SRE and Lead Clinical Informaticist.
- **Forbidden**: Unsupervised destructive commands (`DROP DATABASE`, `DROP TABLE`).

## 5. Step-by-Step Execution
1. **Halt Unsafe Ingestion**:
   Scale backend Daphne ASGI instances to 0 or enable maintenance page to freeze transactions:
   ```bash
   docker compose stop backend
   ```
2. **Identify Target Timestamp**:
   Determine exact timestamp $T_{-1}$ prior to the corruption event:
   ```bash
   TARGET_TIME="2026-09-18T14:15:00Z"
   ```
3. **Create PITR Recovery Branch via Neon CLI**:
   ```bash
   neon branches create \
     --project-id divine-smoke-01982543 \
     --name recovery-pitr-$(date +%s) \
     --parent production \
     --timestamp "$TARGET_TIME"
   ```
4. **Inspect Recovery Branch Integrity**:
   Connect via `psql` to the new branch connection string:
   ```sql
   SELECT count(*) FROM clinical_patients;
   SELECT max(created_at) FROM clinical_clinicalrecord;
   SELECT count(*) FROM predictions_prediction;
   ```
5. **Promote Recovery Branch to Default**:
   ```bash
   neon branches set-default <recovery-branch-id> --project-id divine-smoke-01982543
   ```
6. **Update Application Environment**:
   Update `DATABASE_URL` in `.env` / Coolify configuration.
7. **Restart Application Services**:
   ```bash
   docker compose start backend celery_worker
   ```

## 6. Validation
- Run Django database check: `python manage.py check --database default`.
- Verify `/api/v1/infrastructure/health/` returns `database: HEALTHY` with latency < 50ms.
- Run 14-point restoration drill: `curl -X POST http://localhost:8000/api/v1/infrastructure/dr/drill/`.

## 7. Rollback of Recovery Action
If the new branch is also corrupt or missing newer critical records:
- Keep the original `production` branch intact (it was not deleted).
- Switch `DATABASE_URL` back to original branch.
- Re-run timestamp analysis to identify a more appropriate PITR point.

## 8. Escalation Path
1. On-Call SRE (0–15 minutes).
2. Lead Database Reliability Engineer (15–30 minutes).
3. Chief Technology Officer & Neon Enterprise Support (30+ minutes).

## 9. Post-Recovery Monitoring
- Monitor PostgreSQL connection counts and latency for 4 hours.
- Verify that Celery worker transactions commit successfully.
- Conduct forensic audit log review and document in postmortem.
