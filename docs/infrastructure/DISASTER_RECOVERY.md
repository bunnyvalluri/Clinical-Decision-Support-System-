# Disaster Recovery & Business Continuity — HealthNova AI CDSS

> **RPO (Recovery Point Objective)**: < 5 minutes (via Neon WAL point-in-time recovery)  
> **RTO (Recovery Time Objective)**: < 30 minutes (rebuild application containers from Git)

---

## 1. Failure Mode Matrix & Remediation

| Failure Scenario | Impact on CDSS | Recovery Procedure |
| :--- | :--- | :--- |
| **Coolify Control Plane Crash** | Zero runtime impact. Running containers continue serving patients. | Restart Coolify container (`docker restart coolify`). No database or clinical workload rebuild needed. |
| **Docker Host Server Loss** | Services down. | Spin up new server, run Coolify install script, reconnect to Git repository, redeploy Compose stack. |
| **Neon PostgreSQL Outage** | Application enters degraded read-only mode. | Trigger Neon instant branch restore or point-in-time recovery (PITR) to latest checkpoint. |
| **Redis Broker Failure** | Async tasks pause; real-time WebSockets fallback. | Restart Redis container (`docker restart redis`); Celery auto-reconnects to queue. |
| **Meilisearch Outage** | Fast search projections unavailable. | Automatic fallback to `PostgresFallbackSearchService`; re-index projections once online. |

---

## 2. Server Loss Rebuild Procedure

1. Provision clean Linux VM with Docker Engine.
2. Clone HealthNova AI repository:
   ```bash
   git clone https://github.com/healthnova/cdss-platform.git /opt/healthnova
   ```
3. Inject production `.env` from secure secret store.
4. Launch production Compose stack:
   ```bash
   docker compose -f infra/coolify/docker-compose.prod.yml up -d
   ```
5. Verify clinical liveness:
   ```bash
   curl -f http://localhost:8000/api/v1/health/ready/
   ```
