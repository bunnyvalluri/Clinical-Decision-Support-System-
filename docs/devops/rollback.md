# HealthNova AI — Production Rollback Procedure

## 1. Overview
In the event of an incident or failed production release, HealthNova AI provides both automated pipeline rollbacks and explicit administrator-driven rollback via the Coolify integration and script tooling.

## 2. Guardrails & Requirements
1. **Explicit Human Confirmation**: Automated rollbacks never execute destructive database changes (`DROP TABLE` or `DROP COLUMN`).
2. **Immutable Artifact Target**: Rollbacks must target a known, previously verified Git commit SHA or container digest.
3. **Payload Confirmation**: Calling `/api/v1/infrastructure/rollback/` requires the payload string `confirmation='CONFIRM_ROLLBACK'`.
4. **Audit Trail**: Every rollback generates an immutable `DeploymentRecord` and `AuditLog` entry.

## 3. Rollback Execution via Script
The repository provides `infra/scripts/rollback_deployment.sh`:
```bash
# Set Coolify variables
export COOLIFY_API_URL="https://coolify.healthnova.local/api/v1"
export COOLIFY_API_TOKEN="your-token"

# Run rollback script (prompts for explicit confirmation)
./infra/scripts/rollback_deployment.sh <application_uuid> <target_commit_sha>
```

## 4. Rollback Execution via API
```bash
curl -X POST https://api.healthnova.ai/api/v1/infrastructure/rollback/ \
  -H "Authorization: Bearer <IT_ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": "app-be-prod",
    "target_commit_sha": "a1b2c3d4e5f6",
    "confirmation": "CONFIRM_ROLLBACK"
  }'
```

## 5. Database Considerations
Neon PostgreSQL supports branching and point-in-time recovery. If a migration broke production, investigate backward compatibility before running reverse migrations. Never rollback application containers if database schema changes are backward-incompatible without prior staging verification.
