# HealthNova AI — Production Docker Architecture

## 1. Overview
HealthNova AI uses multi-stage, security-hardened Docker images built on minimal base distributions:
- **Backend & Workers**: Python 3.11/3.12-slim base, multi-stage wheel compilation, unprivileged `appuser` (UID 1001), strict file permissions, deterministic dependencies without dev packages.
- **Frontend**: Node 20 LTS Alpine base, standalone output (`next.config.ts`), unprivileged `nextjs` (UID 1001), telemetry disabled, minimal runtime bundle.
- **Reverse Proxy**: Hardened Nginx on Alpine Linux terminating connections, injecting security headers, and forwarding WebSocket upgrades.

## 2. Docker Images & Stage Layout

### Backend (`Dockerfile` / `infra/docker/Dockerfile.backend.prod`)
```
[Stage 1: builder]
python:3.11-slim
  ├── Install build-essential, libpq-dev, curl
  ├── Copy requirements/base.txt, requirements/production.txt
  └── Compile binary wheels into /build/wheels

[Stage 2: runner]
python:3.11-slim
  ├── Install libpq5 runtime & curl
  ├── Install pre-built wheels
  ├── Copy application code & ML artifacts
  ├── Create non-root system user 'appuser' (UID 1001)
  ├── Configure healthcheck (/api/v1/health/)
  └── Entrypoint: Daphne ASGI (HTTP + WebSockets) or Celery Worker
```

### Frontend (`frontend/Dockerfile` / `infra/docker/Dockerfile.frontend.prod`)
```
[Stage 1: deps]
node:20-alpine
  ├── Install libc6-compat, curl
  └── npm ci (frozen package-lock.json)

[Stage 2: builder]
node:20-alpine
  ├── Copy node_modules & source code
  └── npm run build (standalone output enabled)

[Stage 3: runner]
node:20-alpine
  ├── Non-root system user 'nextjs' (UID 1001)
  ├── Copy .next/standalone and .next/static
  ├── Expose PORT 3000
  ├── Configure healthcheck (/api/health)
  └── Entrypoint: node server.js
```

## 3. Worker & Async Services
Both `celery-worker` and `celery-beat` leverage the exact same hardened backend image without image duplication:
- **Worker command**: `celery -A config worker --loglevel=INFO --concurrency=4 -n worker-prod@%h`
- **Beat command**: `celery -A config beat --loglevel=INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler`

## 4. Local Build & Run Instructions
```bash
# Build backend image locally
docker build -t healthnova-backend:local -f Dockerfile .

# Build frontend image locally
docker build -t healthnova-frontend:local -f frontend/Dockerfile ./frontend

# Start full compose stack
docker compose up -d
```
