"""
Generator for docs/deployment/, docs/development/, and docs/project/
"""
from pathlib import Path

DOCS_DIR = Path(r"c:\4-1\docs")


def write_file(rel_path: str, content: str):
    p = DOCS_DIR / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Created {rel_path} ({len(content)} chars)")


def generate():
    # =============================================================
    # docs/deployment/ (9 files)
    # =============================================================
    write_file("deployment/overview.md", """
# Deployment Overview

The **PatientRisk Clinical Decision Support System** is packaged using a containerized microservice architecture connecting to external managed cloud infrastructure.

---

## 1. Production Architecture Principles

- **No PostgreSQL in Docker:** Production database persistence is delegated entirely to **Neon Cloud PostgreSQL**.
- **Non-Root Execution:** Every service runs under dedicated unprivileged system users (`appuser`, `nextjs`).
- **Nginx Ingress:** Terminates SSL/TLS, proxies WebSocket traffic, and caches static assets.
- **Asynchronous Task Workers:** Dedicated Celery worker and scheduler containers offload computational jobs from web threads.
""")

    write_file("deployment/local-development.md", """
# Local Development with Docker Compose

To run the complete multi-container stack locally:

```bash
# Clone repository and copy environment configuration
cp .env.example .env

# Build and launch containers
docker-compose up --build
```

### Exposed Endpoints
- **Frontend Application:** `http://localhost:3000`
- **Backend REST API:** `http://localhost:8000/api/v1/`
- **Reverse Proxy:** `http://localhost:80`
- **Redis Cache:** `localhost:6379`
""")

    write_file("deployment/docker.md", """
# Docker Containers Specification

### 1. Frontend Dockerfile (`frontend/Dockerfile`)
- Multi-stage build with Node.js 20 Alpine.
- Standalone runner output copying minimal `.next/standalone` assets.
- Runs under user `nextjs` (UID 1001).

### 2. Backend Dockerfile (`backend/Dockerfile`)
- Python 3.13-slim Debian base.
- Multi-stage dependency compilation.
- Executes Daphne ASGI server under `appuser` (UID 1000).
- Automated health check probing `http://localhost:8000/api/v1/health/live/`.
""")

    write_file("deployment/environment-variables.md", """
# Production Environment Variables Catalog

| Variable Name | Sample / Default Value | Purpose |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | Active Django settings module |
| `SECRET_KEY` | *(Cryptographic 50+ chars)* | Cryptographic signing key |
| `ALLOWED_HOSTS` | `cdss.hospital.org` | Allowed HTTP host headers |
| `CSRF_TRUSTED_ORIGINS` | `https://cdss.hospital.org` | Approved CSRF origins |
| `DATABASE_URL` | `postgresql://...@ep-pooler.neon.tech/neondb` | Pooled Neon PostgreSQL connection |
| `DIRECT_DATABASE_URL` | `postgresql://...@ep.neon.tech/neondb` | Direct Neon PostgreSQL connection |
| `REDIS_URL` | `redis://redis:6379/0` | Redis channel layer & broker |
| `CELERY_BROKER_URL` | `redis://redis:6379/0` | Celery message broker |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/0` | Celery task result backend |
| `CELERY_WORKER_CONCURRENCY`| `4` | Number of worker processes |
| `LOG_LEVEL` | `INFO` | Root logging threshold |
""")

    write_file("deployment/production.md", """
# Production Rollout Guide

Step-by-step production deployment procedure:

1. **Provision Neon Database:** Ensure production branch is active and connection strings are set.
2. **Execute Database Migrations:**
   ```bash
   python manage.py migrate --database=default
   ```
3. **Build and Tag Production Images:**
   ```bash
   docker build -t cdss-backend:latest ./backend
   docker build -t cdss-frontend:latest ./frontend
   ```
4. **Deploy Containers:** Launch backend, celery worker, celery beat, redis, and frontend.
5. **Verify Health Probes:** Inspect `GET /api/v1/health/metrics/` and `GET /api/v1/health/ready/`.
""")

    write_file("deployment/nginx.md", """
# Nginx Reverse Proxy & TLS Configuration

Nginx acts as the primary ingress controller (`docker/nginx/nginx.conf`).

---

## 1. Key Configuration Directives

```nginx
# WebSocket Upgrade Mapping
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# Proxy WebSockets to Daphne
location /ws/ {
    proxy_pass http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 86400s;
}

# Proxy REST API to Daphne
location /api/ {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```
""")

    write_file("deployment/ci-cd.md", """
# GitHub Actions CI/CD Pipeline

Continuous Integration and Deployment is defined in `.github/workflows/ci-cd.yml`.

---

## 1. Pipeline Stages

1. **`lint`**: Flake8, Ruff, ESLint.
2. **`type-check`**: Mypy backend, TypeScript `tsc --noEmit`.
3. **`frontend-tests`**: Next.js production build validation.
4. **`backend-tests`**: Pytest REST API and RBAC test suite.
5. **`ml-tests`**: Inference accuracy, bounds, and SHAP tests.
6. **`build`**: Docker image compilation.
7. **`deployment-readiness`**: Django deployment check (`python manage.py check --deploy`).
""")

    write_file("deployment/monitoring.md", """
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
""")

    write_file("deployment/troubleshooting.md", """
# Troubleshooting Runbook

### 1. Database Connection Timeout
- **Symptom:** API returns 500 with `psycopg2.OperationalError`.
- **Resolution:** Verify Neon compute has not suspended or check that `DATABASE_URL` specifies `sslmode=require`.

### 2. WebSocket Reconnection Loops
- **Symptom:** Frontend badge flashes `Connecting...`.
- **Resolution:** Verify Nginx reverse proxy configuration includes `Upgrade $http_upgrade` and `Connection "upgrade"`.

### 3. Celery Report Generation Delays
- **Symptom:** Reports remain in `PROCESSING` status.
- **Resolution:** Check `GET /api/v1/health/celery/` to verify worker containers are active and inspect Redis memory.
""")

    # =============================================================
    # docs/development/ (6 files)
    # =============================================================
    write_file("development/getting-started.md", """
# Developer Getting Started Guide

Welcome to the PatientRisk CDSS development team. Follow these steps to prepare your local machine.

---

## 1. Initial Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/hospital/patientrisk-cdss.git
   cd patientrisk-cdss
   ```
2. **Initialize Environment Variables:**
   ```bash
   cp .env.example .env
   ```
3. **Boot Local Stack:**
   ```bash
   docker-compose up -d
   ```
4. **Run Migrations & Seed Active Model:**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```
""")

    write_file("development/coding-standards.md", """
# Coding Standards & Style Guide

- **Python:** Strict compliance with PEP 8. Format with Black/Ruff; max line length 100 characters. All functions must include type annotations.
- **TypeScript:** Strict mode enabled. No `any` types permitted in clinical interfaces.
- **Tailwind CSS:** Use predefined design system color tokens rather than arbitrary hex values.
""")

    write_file("development/git-workflow.md", """
# Git Workflow

We adhere to standard trunk-based feature branch workflows.

---

## 1. Commit Message Convention

Format: `type(scope): description`
- `feat(ml)`: Add AdaBoost hyperparameter tuning.
- `fix(reports)`: Resolve PDF table padding overflow.
- `docs(api)`: Update predictions endpoint documentation.
- `test(e2e)`: Expand 15-step integration assertions.
""")

    write_file("development/branching-strategy.md", """
# Branching Strategy

- `main`: Production-ready release branch.
- `develop`: Integration branch for validated feature branches.
- `feature/*`: Short-lived feature branches.
- `fix/*`: Urgent patch branches.
""")

    write_file("development/pull-requests.md", """
# Pull Request Review Guidelines

Before a PR can be merged into `develop`:
1. All 7 GitHub Actions CI/CD jobs must pass.
2. Code review approval from at least one senior engineer.
3. No decrease in automated test coverage.
4. Any new clinical parameters must include input validation.
""")

    write_file("development/contribution-guide.md", """
# Contribution Guide

Guidelines for contributing machine learning models, clinical vitals features, and UI components to the PatientRisk CDSS project.
""")

    # =============================================================
    # docs/project/ (5 files)
    # =============================================================
    write_file("project/roadmap.md", """
# Project Roadmap

- **Phase 1 (Completed):** Core architecture, Django ASGI, Neon PostgreSQL, Next.js frontend, and ML models.
- **Phase 2 (Completed):** Real-time WebSockets, Celery background worker, ReportLab PDF discharge summaries, and E2E testing.
- **Phase 3 (Current):** Production containerization, CI/CD pipeline, and structured monitoring.
- **Phase 4 [PLANNED]:** HL7 / FHIR integration for hospital EHR interoperability.
- **Phase 5 [PLANNED]:** Multi-modal 12-lead ECG signal processing and federated learning.
""")

    write_file("project/changelog.md", """
# Project Changelog

### Version 1.0.0 (Production Release)
- Initial production release certified for hospital clinical decision support.
- Fully integrated Next.js 16 / React 19 frontend and Django 5.0 ASGI backend.
- Deployed Random Forest, SVM, and AdaBoost models with TreeSHAP explainability.
- Added real-time WebSocket dashboard and Celery PDF report compilation.
- Integrated PatientRisk brand visual identity.
""")

    write_file("project/known-limitations.md", """
# Known Limitations

1. **Cleveland Cohort Demographic Bias:** Models trained on baseline clinical cohorts may show variance in patient sub-populations; clinical evaluation remains mandatory.
2. **EHR Direct Sync [PLANNED]:** Current release requires manual or API-based observation entry rather than native HL7/FHIR socket polling.
3. **Browser Compatibility:** WebSocket telemetry requires modern browsers supporting HTML5 WebSockets (Chrome 80+, Firefox 75+, Safari 14+, Edge 80+).
""")

    write_file("project/future-enhancements.md", """
# Future Enhancements [PLANNED]

1. **FHIR R4 API Adaptor [PLANNED]:** Ingest vitals and patient observations directly from Epic, Cerner, or hospital EHR buses.
2. **Deep Learning ECG Feature Extraction [PLANNED]:** 1D-CNN architecture to process raw ECG waveform voltages.
3. **Federated Multi-Hospital Learning [PLANNED]:** Train models across distributed healthcare networks without transferring sensitive patient data.
""")

    write_file("project/glossary.md", """
# Clinical & Machine Learning Glossary

- **CDSS:** Clinical Decision Support System.
- **MRN:** Medical Record Number.
- **SHAP:** SHapley Additive exPlanations (cooperative game-theory method for feature attribution).
- **TreeExplainer:** Polynomial-time algorithm for computing SHAP values on tree ensembles.
- **Platt Scaling:** Logistic regression calibration technique applied to SVM decision margins.
- **Brier Score:** Mean squared difference between predicted probabilities and observed outcomes (calibration metric).
- **ASGI:** Asynchronous Server Gateway Interface.
- **PITR:** Point-In-Time Recovery.
""")

    print("Generated deployment, development, and project documentation.")


if __name__ == "__main__":
    generate()
