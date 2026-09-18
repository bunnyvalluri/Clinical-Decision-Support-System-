# HealthNova AI — Health Checks & Readiness Strategy

## 1. Multi-Tier Health Check Protocol

| Component | Endpoint / Probe Command | Interval | Timeout | Retries | Success Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Next.js Frontend** | `wget -qO- http://localhost:3000/api/health` | 20s | 5s | 3 | HTTP 200 JSON `{ status: "healthy" }` |
| **Django Backend** | `curl -f http://localhost:8000/api/v1/health/ready/` | 15s | 5s | 3 | HTTP 200 JSON `{ status: "healthy", ready: true }` |
| **Redis Broker** | `redis-cli ping` | 10s | 3s | 5 | Returns `PONG` |
| **Celery Worker** | Internal heartbeat / Celery ping inspection | 30s | 10s | 3 | Worker node responds to broker ping |
| **Meilisearch** | `curl -f http://localhost:7700/health` | 10s | 5s | 3 | HTTP 200 JSON `{ status: "available" }` |
| **Ollama LLM** | `ollama list \|\| exit 1` | 15s | 5s | 3 | Ollama CLI returns model catalog successfully |
| **Nginx Proxy** | `curl -f http://localhost/healthz` | 15s | 3s | 2 | Returns HTTP 200 `healthy\n` |

## 2. Readiness vs Liveness
- **Liveness (`/api/v1/health/`)**: Confirms the Daphne ASGI process is alive and accepting connections.
- **Readiness (`/api/v1/health/ready/`)**: Verifies downstream connectivity to Neon PostgreSQL and Redis before traffic routing.
- **No Fake Status Policy**: If a dependency is unreachable, the endpoint emits an honest `DEGRADED` or `UNHEALTHY` status with the specific failure cause. Never return synthetic "ok" if a subsystem is broken.
