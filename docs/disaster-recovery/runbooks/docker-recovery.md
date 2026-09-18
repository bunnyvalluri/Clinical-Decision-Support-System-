# Runbook 05: Docker Host & Image Recovery

## 1. Symptoms
- Docker daemon unresponsive (`Cannot connect to the Docker daemon`).
- Containers fail to start due to corrupted overlayfs or exhausted inodes.
- Host disk usage reports 100% full.

## 2. Detection
- System alerts flag host disk exhaustion (`df -h`).
- Docker commands hang or return `no space left on device`.

## 3. Preconditions
- Host VM root / SSH access available.
- Persistent database storage resides safely in Neon PostgreSQL (not on Docker disk).

## 4. Authorization
- IT Infrastructure Administrator or SRE.

## 5. Step-by-Step Execution
1. **Prune Dangling Containers and Build Cache**:
   ```bash
   docker system prune -af --volumes=false
   ```
2. **Restart Docker Daemon**:
   ```bash
   sudo systemctl restart docker
   ```
3. **Verify Host Storage Availability**:
   ```bash
   df -h /var/lib/docker
   ```
4. **Recreate Stack from Version-Controlled Compose**:
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d
   ```

## 6. Validation
- `docker ps` shows all 5 core containers (`nginx`, `frontend`, `backend`, `celery_worker`, `redis`) in `healthy` or `up` status.
- System logs show zero daemon I/O errors.

## 7. Rollback
- If Docker daemon fails to restart, re-provision clean compute VM from Coolify snapshot.

## 8. Escalation Path
- Infrastructure SRE Lead -> Cloud Provider Support.

## 9. Post-Recovery Monitoring
- Monitor disk usage trends and Docker container health checks every 15 minutes.
