# Deployment Architecture & Environment Management

## Environments

HealthNova AI supports three strictly separated deployment tiers:

1. **Development (`development`)**:
   - Ephemeral testing sandbox.
   - Local Docker Compose or preview deployments.

2. **Staging (`staging`)**:
   - Target URL: `https://staging.healthnova.ai`.
   - Continuous deployment triggered automatically upon merge to `develop`.
   - Connects to staging database branch in Neon PostgreSQL.

3. **Production (`production`)**:
   - Target URL: `https://healthnova.ai`.
   - Requires explicit human clinician / DevOps sign-off (`when: manual`).
   - Triggered exclusively on `main` branch.
   - Controlled database migration execution with zero destructive schema operations.

---

## Coolify & Webhook Integration

HealthNova AI integrates with Coolify v4 API or incoming release webhooks:
- Protected GitLab CI/CD Variables: `COOLIFY_WEBHOOK_URL_STAGING` and `COOLIFY_WEBHOOK_URL_PROD`.
- Webhooks trigger Coolify to pull the verified immutable container tag (`$CI_COMMIT_SHA`).
- Coolify restarts Daphne ASGI and Next.js standalone containers with zero-downtime rolling updates.
