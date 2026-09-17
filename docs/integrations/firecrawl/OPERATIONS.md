# Firecrawl Operational Runbook & Deployment Guide

## 1. Deployment Models

### Mode A: Managed Firecrawl Cloud
For production setups requiring zero infrastructure overhead:
```bash
FIRECRAWL_ENABLED=true
FIRECRAWL_MODE=managed
FIRECRAWL_BASE_URL=https://api.firecrawl.dev
FIRECRAWL_API_KEY=fc-prod-live-secret-key
```

### Mode B: Self-Hosted Firecrawl Infrastructure (Coolify / Docker)
For air-gapped or on-premise healthcare data center deployments:
```bash
FIRECRAWL_ENABLED=true
FIRECRAWL_MODE=self_hosted
FIRECRAWL_BASE_URL=http://firecrawl-api:3002
FIRECRAWL_API_KEY=local-firecrawl-internal-key
```

A complete Docker Compose manifest pinned to release `v1.10.2` is maintained at:
`docker/firecrawl/docker-compose.firecrawl.yml`

---

## 2. Telemetry, Health Probes & Observability

The IT Admin dashboard exposes real-time telemetry from `/api/v1/web/admin/health/`:
- **API Reachability**: Active HTTP `GET /health` probe against `FIRECRAWL_BASE_URL`.
- **Roundtrip Latency**: Measured in milliseconds.
- **Circuit Breaker Status**: `CLOSED` (Healthy), `OPEN` (Degraded/Tripped), `HALF_OPEN` (Testing Recovery).
- **Active / Queued Jobs**: Real-time counts from Neon PostgreSQL `WebCrawlJob` table.
- **Celery Worker State**: Ping status of asynchronous Celery workers.
- **Zero Fake Metrics Invariant**: Telemetry fields reflect actual database and network query responses; never hardcoded uptime or fabricated percentages.

---

## 3. Maintenance & Log Rotation
- Celery periodic task `cleanup_expired_jobs_task` runs nightly to purge raw HTML caches older than `FIRECRAWL_RETENTION_DAYS` (default: 30 days).
- Audit entries in `WebContentAudit` are retained permanently for healthcare compliance.
