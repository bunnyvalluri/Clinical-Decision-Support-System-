# Coolify Deployment & Preview Environments — HealthNova AI CDSS

## 1. Git-Triggered Deployment Pipeline

Every deployment follows an auditable Git flow:

```
Developer Push to Feature Branch
   ↓
Pull Request Created on GitHub
   ↓
Automated GitHub Actions CI
   ├── Backend Unit Tests (pytest)
   ├── Frontend Tests & Typecheck (npm test && tsc)
   ├── Bruno API Contract Tests (bru run --env Test)
   └── React Doctor Quality Audit (npx react-doctor)
   ↓
Coolify Spawns Ephemeral Preview Environment (Synthetic Seed Data Only)
   ↓
Clinician & Peer Code Review
   ↓
Merge to Main Branch
   ↓
Staging Automated Deployment via Coolify Webhook
   ↓
Human IT Admin Production Release Sign-Off
   ↓
Coolify Production Rolling Deployment
```

---

## 2. Preview Environment Safety Rules

1. **Synthetic Data Mandate**: Preview environments are provisioned with ephemeral SQLite or containerized test databases seeded with synthetic records (`TEST_ONLY`).
2. **Never Connect to Production Neon**: Preview environments are strictly prohibited from referencing `DATABASE_URL` pointing to the production Neon cluster.
3. **Resource Caps**: Preview containers have strict resource quotas (Max 0.5 CPU, 512MB RAM) and automatic 48-hour TTL cleanup.

---

## 3. Rollback Protocol

If post-deployment smoke tests or clinical telemetry indicate a regression:
1. IT Administrator initiates a rollback via the Admin Infrastructure dashboard (`/admin/infrastructure`) or the CLI script:
   ```bash
   ./infra/scripts/rollback_deployment.sh --app-id <APP_UUID> --target-sha <KNOWN_GOOD_SHA>
   ```
2. Coolify switches Traefik routing to the previously tagged container image.
3. Database migrations must be backwards-compatible (expand/contract schema pattern).
