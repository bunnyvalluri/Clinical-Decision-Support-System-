# Runbook 07: Container Image Registry Failure & Recovery

## 1. Symptoms
- Docker image pull fails during deployment: `Error response from daemon: Get https://ghcr.io/v2/...: unauthorized / timeout`.
- Rollback or redeployment fails with image missing error.

## 2. Detection
- Coolify build logs report `docker pull` failure.
- GitHub Container Registry (GHCR) or GitLab Registry reports outage.

## 3. Preconditions
- Local Docker host retains cached layers of previously approved production images.

## 4. Authorization
- Release Engineer or DevOps SRE.

## 5. Step-by-Step Execution
1. **Identify Local Image Cache**:
   List immutable image digests currently resident on the Docker host:
   ```bash
   docker images --digests | grep healthnova
   ```
2. **Switch Deployment to Local Cached Image Digest**:
   Prevent remote network pulls by referencing the exact immutable local image digest:
   ```bash
   docker tag healthnova/backend@sha256:<LOCAL_DIGEST> healthnova/backend:rollback-emergency
   ```
3. **Deploy from Local Daemon**:
   Update `docker-compose.yml` to use `image: healthnova/backend:rollback-emergency` with `pull_policy: never`.
4. **Secondary Mirror Registry**:
   If local cache is missing, configure alternate registry mirror in `/etc/docker/daemon.json`.

## 6. Validation
- Container boots cleanly from cached image.
- Health check returns HTTP 200.

## 7. Rollback
- Re-enable remote pull policy once upstream registry recovers.

## 8. Escalation Path
- Release Engineer -> Registry Provider.

## 9. Post-Recovery Monitoring
- Verify image retention policy on host ensures the last 3 production releases are never pruned.
