# Production Deployment Guide — Clinical Decision Support System (CDSS)

## Architecture Overview

```
                          [ Client Browsers / Telemetry Devices ]
                                           │
                                           ▼ (Port 80 / 443 HTTPS / WSS)
                                   ┌───────────────┐
                                   │  Nginx Proxy  │
                                   └───────┬───────┘
                     ┌─────────────────────┴─────────────────────┐
                     │                                           │
                     ▼ (Port 3000 HTTP)                          ▼ (Port 8000 ASGI/WS)
             ┌───────────────┐                           ┌───────────────┐
             │ Next.js 16 UI │                           │  Daphne ASGI  │
             │  (Frontend)   │                           │   (Backend)   │
             └───────────────┘                           └───────┬───────┘
                                                                 │
                                    ┌────────────────────────────┼────────────────────────────┐
                                    ▼                            ▼                            ▼
                          ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
                          │ Neon PostgreSQL  │         │  Upstash / Redis │         │  Celery Workers  │
                          │ (Managed Cloud)  │         │ (Broker/Channel) │         │ (Async Reports)  │
                          └──────────────────┘         └──────────────────┘         └──────────────────┘
```

---

## 1. Prerequisites

- **Docker Engine** >= 24.0.0
- **Docker Compose** >= v2.20.0
- **Neon PostgreSQL Account & Endpoint**: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
- **Redis Server or Upstash TLS Broker**: `rediss://default:pass@host:port`
- **Domain & TLS/SSL Certificates** (e.g. Let's Encrypt Certbot or AWS ALB)

---

## 2. Environment Configuration

1. Clone the repository onto the production server:
   ```bash
   git clone https://github.com/hospital/clinical-decision-support.git /opt/cdss
   cd /opt/cdss
   ```

2. Provision the production `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   chmod 600 .env
   ```

3. Configure required secrets in `.env`:
   - `SECRET_KEY`: High-entropy 64-character secret
   - `DATABASE_URL`: Neon pooled production connection string
   - `REDIS_URL`: Redis TLS broker connection string
   - `CELERY_BROKER_URL`: Celery queue connection string
   - `DJANGO_SETTINGS_MODULE`: `config.settings.production`
   - `ALLOWED_HOSTS`: Hospital domain (e.g., `cdss.hospital.org`)
   - `CORS_ALLOWED_ORIGINS`: `https://cdss.hospital.org`
   - `CSRF_TRUSTED_ORIGINS`: `https://cdss.hospital.org`

---

## 3. Deployment with Docker Compose

Build and launch all services with a single command:

```bash
# Build multi-stage optimized production containers
docker-compose build --parallel

# Launch in background with healthcheck monitoring
docker-compose up -d
```

Verify service health:
```bash
docker-compose ps
```

All 5 core services should report `healthy`:
- `cdss_backend` (Daphne ASGI)
- `cdss_frontend` (Next.js 16 standalone)
- `cdss_celery_worker` (Reports & ML async jobs)
- `cdss_redis` (Broker & Channel Layer)
- `cdss_nginx` (Reverse proxy)

---

## 4. Database Migrations & Static File Collection

Execute initial migrations against Neon PostgreSQL:
```bash
docker-compose exec backend python manage.py migrate --noinput
docker-compose exec backend python manage.py collectstatic --noinput
```

Pre-load trained ML model weights and baseline random forest artifacts:
```bash
docker-compose exec backend python manage.py seed_trained_models
```

---

## 5. Horizontal Worker Scaling

For hospitals with high patient telemetry and heavy PDF report demands, scale Celery workers independently:
```bash
docker-compose up -d --scale celery_worker=4
```

Worker queues:
- `reports`: PDF generation and export jobs
- `ml`: Bulk asynchronous batch risk predictions
- `notifications`: Emergency clinician alert dispatch
- `default`: Periodic telemetry maintenance

---

## 6. Production Health Check & Telemetry Probes

Configure your load balancer or Prometheus/Grafana to scrape these probes:

| Endpoint | Probe Type | Description | Target Response |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/health/` | Liveness | Web server process running | HTTP 200 `{"status": "healthy"}` |
| `GET /api/v1/health/ready/` | Readiness | PostgreSQL and Redis connectivity | HTTP 200 `{"status": "ready"}` |
| `GET /api/v1/health/db/` | Database | PostgreSQL query latency check | HTTP 200 `{"database": "healthy"}` |
| `GET /api/v1/health/redis/` | Cache / Broker | Redis ping latency check | HTTP 200 `{"redis": "healthy"}` |
| `GET /api/v1/health/metrics/` | Telemetry | Latency p95, error rate, WS count | HTTP 200 `{"api": {...}, "ml": {...}}` |

---

## 7. Zero-Downtime Rolling Update Runbook

When updating application code or ML model weights:
```bash
# 1. Pull latest verified commit
git pull origin main

# 2. Build new standalone containers
docker-compose build

# 3. Apply schema migrations non-destructively
docker-compose exec backend python manage.py migrate --noinput

# 4. Reload services sequentially
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build celery_worker
docker-compose up -d --no-deps --build frontend
docker-compose restart nginx
```
