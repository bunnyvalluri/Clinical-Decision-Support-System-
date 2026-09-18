# HealthNova AI — Coolify Deployment & Control Plane Integration

## 1. Overview
Coolify is an open-source, self-hosted PaaS platform orchestrating container deployments across isolated Docker hosts.
- **Pinned Version**: `v4.0.0-beta.380` (enforced via `docs/integrations/COOLIFY_VERSION.md`)
- **License Compliance**: Apache License 2.0 (documented in `docs/integrations/COOLIFY_LICENSE.md`)
- **Authoritative Database**: Neon PostgreSQL is the sole authoritative data store. Coolify does **NOT** deploy a separate production PostgreSQL database.

## 2. Deployment Architecture
```
[Developer / CI]
       │
       ▼
GitHub / GitLab
       │
       ▼
GitHub Actions (cd.yml) / GitLab CI (deploy.yml)
       │
       ├─► Linting, Typecheck, Unit & Integration Tests
       ├─► Docker Build (Multi-stage)
       ├─► Security Scan (Trivy)
       ├─► Push to GHCR (ghcr.io/healthnova/backend:<SHA>)
       │
       ▼
Trigger Coolify Webhook (Staging / Production)
       │
       ▼
Coolify Control Plane
       │
       ├─► Pulls immutable image digest from GHCR
       ├─► Starts container on isolated network
       ├─► Executes healthcheck probes
       ├─► Traefik switches traffic gracefully
       └─► Verifies post-deployment readiness
```

## 3. Webhook Integration & Security
Coolify deployment webhooks are secured via secret tokens:
- Staging Webhook: `COOLIFY_WEBHOOK_URL_STAGING`
- Production Webhook: `COOLIFY_WEBHOOK_URL_PROD`
Webhook tokens are protected as GitHub/GitLab repository secrets and **never** exposed to browser bundles or client JavaScript.

## 4. Compose Stacks
- `infra/coolify/docker-compose.prod.yml`: Production stack with Traefik TLS labels, resource limits, and health checks.
- `infra/coolify/docker-compose.staging.yml`: Staging stack with synthetic test fixtures and isolated network boundaries.
- `infra/coolify/ollama.yml`: Internal inference stack on private network `internal_cdss_network` (no public port exposure).
