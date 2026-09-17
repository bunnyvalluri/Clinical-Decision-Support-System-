# Database Architecture Specification: Neon PostgreSQL

**Spec ID**: `DB-SPEC-001`  
**Domain**: Authoritative Persistence, Migrations, & Relational Constraints  
**Status**: `CONVERGED`  
**Store**: Neon Serverless PostgreSQL  

---

## 1. Authoritative Clinical Source of Truth

1. **Sole Source of Truth**:
   - **Neon PostgreSQL** holds all authoritative state: patient entities, vitals, clinical risk predictions, clinician reviews, user accounts, and immutable audit logs.
   - Redis is ephemeral (caching and Celery broker).
   - Meilisearch is an eventual-consistency read index.
   - PocketBase and NocoDB are strictly auxiliary workspaces.
2. **ACID Transactions**:
   - All state mutations are wrapped in Django `transaction.atomic()`.
   - Real-time broadcasts are deferred until post-commit via `transaction.on_commit()`.

---

## 2. Core Relational Entities & Constraints

```
┌──────────────┐       1:N       ┌────────────────────────┐
│   patients   │ ─────────────── │     patient_vitals     │
└──────────────┘                 └────────────────────────┘
       │                                     │
       │ 1:N                                 │ 1:N
       ▼                                     ▼
┌────────────────────────┐       1:N     ┌────────────────────────┐
│    risk_predictions    │ ───────────── │   clinician_reviews    │
└────────────────────────┘               └────────────────────────┘
```

- **`patients`**: Primary key UUID, encrypted demographic fields, assigned clinician references.
- **`patient_vitals`**: Foreign key to `patients` (`ON DELETE CASCADE`), timestamped physiological observations with check constraints (`heart_rate > 0`, `systolic_bp > 0`).
- **`risk_predictions`**: UUID PK, FK to `patients`, model identifier, version tag, risk level (`LOW`, `MEDIUM`, `HIGH`), risk score (0.0000 - 1.0000), TreeSHAP attributions JSONB, uncertainty score, timestamp.
- **`clinician_reviews`**: FK to `risk_predictions`, clinician UUID FK, review status (`AGREED`, `DISAGREED`, `OVERRIDDEN`), clinical rationale text, signed timestamp.

---

## 3. Migration Safety Standards

1. **Non-Blocking Operations**: Schema changes must not lock production tables for > 100ms.
2. **Backward-Compatible Columns**: New columns must be `NULL` or provide safe database defaults.
3. **Rollback Verification**: Every migration file must have a documented rollback plan tested in CI.
