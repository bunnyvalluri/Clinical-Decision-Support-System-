# Deployment & Infrastructure Specification

**Spec ID**: `INFRA-SPEC-001`  
**Domain**: Docker Containers, Coolify Deployment, Nginx, & Observability  
**Status**: `CONVERGED`  
**Deployment Platform**: Coolify + Docker Compose + Neon Cloud PostgreSQL  

---

## 1. Container Topology & Resource Quotas

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits: { cpus: '1.5', memory: 1536M }

  backend-api:
    build: ./backend
    command: gunicorn backend.wsgi:application -b 0.0.0.0:8000 -w 4 -k uvicorn.workers.UvicornWorker
    environment:
      - DATABASE_URL=${NEON_DATABASE_URL}
      - REDIS_URL=redis://redis:6379/0
    deploy:
      resources:
        limits: { cpus: '2.0', memory: 2048M }

  celery-worker:
    build: ./backend
    command: celery -A backend worker -l INFO -c 4
    deploy:
      resources:
        limits: { cpus: '2.0', memory: 3072M }

  redis:
    image: redis:7-alpine
    deploy:
      resources:
        limits: { cpus: '0.5', memory: 512M }
```

---

## 2. Zero-Downtime Rolling Updates & Health Checks
- Health check endpoints:
  - Frontend: `GET /api/health` (HTTP 200)
  - Backend: `GET /api/v1/health/` (Checks Neon DB connection, Redis ping, Celery heartbeat)
- Rolling updates ensure minimum 1 healthy container serving traffic during migration and deployment.
