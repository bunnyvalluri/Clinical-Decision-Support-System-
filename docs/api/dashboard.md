# Dashboard & Health Telemetry API

Endpoints for real-time dashboard aggregation and operational health metrics.

---

## 1. Endpoints

### 1.1 `GET /api/v1/health/`
Liveness probe returning `{ "status": "healthy" }`.

### 1.2 `GET /api/v1/health/metrics/`
Operational metrics registry returning API latency percentiles, error counts, active WebSocket connections, and database query timings.

### 1.3 `GET /api/v1/health/db/`
PostgreSQL connectivity probe.

### 1.4 `GET /api/v1/health/redis/`
Redis round-trip ping probe.

### 1.5 `GET /api/v1/health/celery/`
Celery background worker queue health probe.
