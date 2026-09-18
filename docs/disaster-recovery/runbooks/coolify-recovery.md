# Runbook 06: Coolify Orchestration Platform Recovery

## 1. Symptoms
- Coolify management web UI (`:8000`) unreachable.
- Coolify API token returns HTTP 500 or connection timeout.
- Automated CI/CD webhooks fail to trigger deployment builds.

## 2. Detection
- `/api/v1/infrastructure/health/` reports `control_plane: OFFLINE`.
- Host system process `coolify` is inactive or crashing.

## 3. Preconditions
- Recognize that Coolify is the **deployment orchestrator**, NOT the runtime execution container.
- Existing running Docker containers remain online even when Coolify is offline.

## 4. Authorization
- IT Administrator or DevOps Lead.

## 5. Step-by-Step Execution
1. **Verify Running Application Containers First**:
   Ensure bedside applications are uninterrupted:
   ```bash
   docker ps
   ```
2. **Restart Coolify Control Plane Service**:
   ```bash
   docker restart coolify
   ```
3. **If Coolify Database is Corrupted**:
   Restore Coolify SQLite backup located at `/data/coolify/source/db/`:
   ```bash
   cp /data/coolify/source/db/coolify.db.backup /data/coolify/source/db/coolify.db
   docker restart coolify
   ```
4. **Bypass Coolify for Emergency Hotfixes**:
   If Coolify cannot be recovered immediately, manage application containers directly via standard Docker CLI:
   ```bash
   docker compose -f /data/coolify/applications/<app_uuid>/docker-compose.yml up -d
   ```

## 6. Validation
- Coolify UI loads and API returns HTTP 200 on `/api/v1/servers`.
- Deployment trigger succeeds from console.

## 7. Rollback
- Revert Coolify SQLite database to previous backup snapshot.

## 8. Escalation Path
- DevOps Lead -> Coolify Community / Enterprise Support.

## 9. Post-Recovery Monitoring
- Verify webhook delivery from GitHub and GitLab CI/CD pipelines.
