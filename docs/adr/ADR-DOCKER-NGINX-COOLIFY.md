# Architecture Decision Record (ADR): Production-Grade Docker, Nginx, and Coolify Deployment Architecture

**Date**: 2026-09-18  
**Status**: Accepted  
**Deciders**: Senior DevOps, Cloud Infrastructure, Docker, Linux, Nginx, Coolify, Security, SRE, Platform Engineering, Database, Networking, CI/CD, and MLOps Team  
**Context**: Prompt 59 — Implement Production-Grade Docker, Nginx and Coolify Deployment Architecture for HealthNova AI

---

## 1. Context and Problem Statement
HealthNova AI Clinical Decision Support System requires a complete, secure, reproducible, production-ready containerization and continuous delivery deployment architecture. The deployment stack must bridge developer workflows, CI/CD automation, registry artifact publishing, Coolify platform orchestration, Nginx reverse proxy routing, and real-time clinical telemetry without introducing secondary clinical databases or fake operational data.

---

## 2. Decision Drivers
1. **Neon PostgreSQL as Sole Authoritative Store of Truth**: All clinical and business data resides exclusively in Neon PostgreSQL. No production clinical data is containerized or hosted in ephemeral databases.
2. **Deterministic & Hardened Container Images**: Multi-stage Docker builds running exclusively as unprivileged non-root users (`appuser` UID 1001 for backend/worker, `nextjs` UID 1001 for frontend), minimal attack surface, stripped compilers, pinned dependencies, zero baked-in secrets.
3. **Multi-Tier Network Segregation**: Strict separation into `public-web`, `app-internal`, and `data-internal` private networks. Redis, Celery broker, Ollama LLM, and Meilisearch are **never** exposed to the public internet.
4. **Clean Architecture Deployment Abstractions**: Deployment actions are governed through standardized abstractions (`ContainerRegistryClient`, `CoolifyClient`, `DeploymentService`, `HealthCheckService`, `DeploymentRollbackService`, `DeploymentAuditService`).
5. **Traceable ML & Code Lineage**: Every release immutably records Git commit SHA, frontend version, backend version, Docker image digest, ML model version, dataset version, timestamp, and actor.
6. **Zero Downtime & Safe Rollback**: Controlled blue/green transitions supported by Traefik/Nginx health probes, accompanied by human-confirmed rollback mechanisms requiring `CONFIRM_ROLLBACK`.
7. **Honest Operational Status**: Absolutely no fabricated health checks, metrics, or status indicators.

---

## 3. Decision
We adopt a unified 3-tier container deployment architecture:
1. **Reverse Proxy / Ingress Layer**:
   - Production Nginx / Traefik routing HTTP/HTTPS and WebSocket traffic.
   - Strict HTTP Strict Transport Security (HSTS), X-Frame-Options DENY, nosniff, and granular Permissions-Policy headers.
   - Dedicated proxy configurations for `/api/`, `/admin/`, `/ws/` (with WebSocket upgrade), and `/healthz`.
2. **Application Tier**:
   - **Frontend**: Next.js 16 Standalone production build (`node server.js`) on Node 20 LTS Alpine.
   - **Backend**: Django REST Framework ASGI via Daphne (`config.asgi:application`), supporting simultaneous REST HTTP and Channels WebSockets over secure pipes.
   - **Async Tasks**: Celery worker and Celery beat reusing the hardened backend runtime image with bounded concurrency and Redis queue isolation.
3. **Internal Data & Auxiliary Services**:
   - **Redis 7 Alpine**: In-memory broker and channel layer on private networks.
   - **Meilisearch v1.12.0**: Isolated retrieval index with master key protected.
   - **Ollama 0.5.12**: Self-hosted private LLM layer behind AI Gateway without public port exposure.
4. **Orchestration & CI/CD**:
   - **Registry**: GitHub Container Registry (`ghcr.io`) publishing immutable commit SHA tags.
   - **Platform**: Coolify v4.0.0-beta.380 coordinating isolated Compose manifests (`docker-compose.prod.yml`, `docker-compose.staging.yml`, `ollama.yml`).
   - **Pipelines**: GitHub Actions (`cd.yml`) and GitLab CI (`docker.yml`, `deploy.yml`) enforcing automated tests, container scans (Trivy), staging health verification, and human-gated production releases.

---

## 4. Consequences

### Positive
- Fully reproducible, isolated, and multi-tenant resilient deployments.
- Complete regulatory alignment with HIPAA / GDPR / NIST SP 800-53 security controls.
- Full traceability linking clinical ML models, datasets, and codebase revisions.
- Resilient circuit breaking preventing cascading platform outages.

### Negative / Operational Trade-offs
- Deployment to production requires manual human sign-off; fully automated hands-off production releases are prohibited.
- Self-hosted Ollama requires dedicated memory reservations (minimum 4GB, up to 32GB) on hosting nodes.
