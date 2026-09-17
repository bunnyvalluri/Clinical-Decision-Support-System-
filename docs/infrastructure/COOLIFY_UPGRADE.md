# Coolify Upgrade Runbook — HealthNova AI CDSS

## 1. Upgrade Philosophy

Coolify upgrades are treated as platform maintenance events. Floating auto-upgrades are disabled. Every upgrade is evaluated on a non-production staging instance before rollout to production control planes.

---

## 2. Upgrade Step-by-Step Runbook

### Step 1: Backup Control Plane State
```bash
# Export Coolify internal database and configuration files
docker exec -t coolify-db pg_dump -U coolify coolify > /backup/coolify_backup_$(date +%F).sql
cp -r /data/coolify /backup/coolify_data_$(date +%F)
```

### Step 2: Validate Running Clinical Workloads
Verify that the clinical application is healthy via public endpoints:
```bash
curl -f https://api.healthnova.ai/api/v1/health/
```

### Step 3: Upgrade Staging Control Plane
Update `COOLIFY_VERSION.md` and test the target image digest on the staging host:
```bash
# Pull pinned target image
docker pull ghcr.io/coollabsio/coolify:v4.0.0-beta.380

# Restart control plane container
docker compose -f /data/coolify/source/docker-compose.yml up -d
```

### Step 4: Verification & Sanity Checks
- Verify Traefik proxy continues routing HTTPS traffic.
- Verify API connectivity via `GET /api/v1/servers`.
- Execute a test staging deployment using `infra/scripts/deploy_staging.sh`.

### Step 5: Rollback if Upgrade Fails
If control plane issues arise:
```bash
# Revert to previous image
docker compose -f /data/coolify/source/docker-compose.yml down
# Restore previous image version and restart
```
Running clinical containers will continue uninterrupted during control plane restarts.
