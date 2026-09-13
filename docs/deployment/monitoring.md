# Production Monitoring & Telemetry

System observability is implemented via in-memory registries and structured logging.

---

## 1. Health Endpoints

- `GET /api/v1/health/live/`: Returns 200 if ASGI process is alive.
- `GET /api/v1/health/ready/`: Returns 200 if database and Redis are reachable.
- `GET /api/v1/health/metrics/`: Returns Prometheus-style JSON metrics:
  - API request latency percentiles (p50, p95, p99).
  - Status code breakdown (2xx, 3xx, 4xx, 5xx).
  - ML inference latency per model version.
  - Active WebSocket connections.
  - Celery task success and failure counts.
