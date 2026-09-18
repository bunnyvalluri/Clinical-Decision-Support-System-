# ADR-BACKUP-DISASTER-RECOVERY: Production Backup, Disaster Recovery, Business Continuity, and Rollback Architecture

- **Status**: APPROVED
- **Date**: 2026-09-18
- **Authors**: Platform Engineering, Database Reliability, SRE, Security, MLOps
- **Deciders**: Chief Technology Officer, Chief Information Security Officer, Clinical Safety Officer
- **Mandate**: BPY-CSE-2666 / Prompt 61

---

## 1. Context & Problem Statement

HealthNova AI is a Clinical Decision Support System (CDSS) providing medical risk predictions, early warning scores, and diagnostic evidence retrieval to hospital bedside staff. The platform requires high resilience against infrastructure partitions, accidental data corruption, container failures, and cyber compromise.

The platform relies on:
- **Authoritative Data Layer**: Managed Neon PostgreSQL (`divine-smoke-01982543`, branch `production`).
- **Orchestration**: Coolify on dedicated Docker VM host with Daphne ASGI and Next.js frontend.
- **Async & Realtime**: Redis message broker, Celery task workers, Django Channels WebSockets.
- **Machine Learning**: Scikit-learn (RandomForest, AdaBoost, SVM), SHAP explanations, Model Registry.
- **Search & AI**: Derived Meilisearch indexes and local Ollama / AI Gateway inference.

A disaster recovery and rollback strategy must preserve patient safety, guarantee zero clinical data loss, ensure cryptographic auditability, and strictly forbid fabricating fake recovery metrics, RPO/RTO targets, or synthetic test results.

---

## 2. Mandatory Clinical & Operational Invariants

```
╔════════════════════════════════════════════════════════════════════════════╗
║ 1. Neon PostgreSQL is the SOLE AUTHORITATIVE SOURCE OF TRUTH.              ║
║ 2. ZERO patient PHI is stored in backups in plaintext or unredacted logs.  ║
║ 3. AI NEVER issues autonomous medical diagnoses or final prescriptions.   ║
║ 4. ALL clinical recommendations require human clinician sign-off.         ║
║ 5. RPO and RTO targets are NEVER invented; report 'Not yet defined' when    ║
║    unconfigured until approved by authorized IT Administrators.           ║
║ 6. Arbitrary shell, raw SQL, and unredacted PHI exports are FORBIDDEN.     ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 3. Data Classification Architecture

| Category | Classification | Representative Artifacts | Authoritative Strategy |
| :--- | :--- | :--- | :--- |
| **Category A** | Critical Clinical Data | Patients, clinical observations, risk predictions, clinician reviews, audit ledger | Neon continuous WAL PITR (6-hour continuous window) + daily encrypted S3 cold export. Immutable append-only. |
| **Category B** | Operational State | Server metadata, deployment history, notification state, workflow state | PostgreSQL tables + Git version control. |
| **Category C** | Machine Learning Data | Kaggle dataset metadata, model registry artifacts, training run lineage | SHA-256 artifact checksums, immutable registry rows, reproducible pipeline seeds. |
| **Category D** | Derived / Rebuildable | Meilisearch indexes, Redis cache keys, Celery transient tasks, Docker layers | Safe to discard; rebuildable on-demand from Neon PostgreSQL authoritative tables. |
| **Category E** | Secrets & Cryptographic Keys | DB connection passwords, API keys, TLS private keys, JWT signing secrets | Strict exclusion from backups; isolated secret store; emergency rotation runbook. |

---

## 4. Decision

We adopt a decoupled, tier-aware Disaster Recovery and Rollback Architecture:

1. **Sole Clinical Source of Truth**:
   Neon PostgreSQL remains the sole database. No secondary production database will be provisioned. Continuous WAL archiving to Neon Safekeepers and durable copy-on-write page servers on AWS S3 provides sub-second RPO. Point-In-Time Recovery (PITR) branches are created with zero storage copy overhead.

2. **Zero-Copy Pre-Migration Snapshots**:
   Prior to executing Django schema migrations, a zero-copy branch snapshot (e.g. `pre-migration-<timestamp>`) is created. In the event of locking or failure, production endpoints instantly switch to the snapshot branch.

3. **Statutory Encrypted Cold Storage Exports**:
   For 7-year HIPAA compliance, logical `pg_dump` exports are encrypted using AES-256-GCM / AWS KMS envelope encryption and dispatched to an isolated, access-logged S3 bucket with Object Lock (WORM).

4. **14-Point Restoration Verification Standard**:
   A restoration drill is strictly marked `VERIFIED` only when all 14 diagnostic probes pass:
   - Service starts
   - Database connects
   - Schema is valid
   - Critical APIs respond
   - Authentication works
   - RBAC enforced
   - WebSockets functional
   - Celery workers active
   - ML model loads
   - Model version correct
   - Dataset lineage intact
   - Audit logging active
   - Health checks pass & Observability works
   - No secrets exposed

5. **Version-Aware Multi-Tier Rollback**:
   - Applications revert to immutable Docker image digests or Git commit SHAs.
   - ML models revert only to previously `APPROVED` versions in the registry with validated feature schema compatibility.
   - Rollback requires explicit human confirmation (`CONFIRM_ROLLBACK`) and is audited.

6. **Degraded Operational Modes**:
   If optional AI (Ollama) or search (Meilisearch) services fail, clinical core workflows remain online. The UI explicitly renders `"Prediction service unavailable"` rather than fabricating a risk score.

---

## 5. Consequences

### Positive:
- Instantaneous RTO (< 30 seconds compute provisioning, < 2 minutes branch promotion).
- Sub-second RPO with continuous WAL streaming.
- Complete regulatory audit trail (`backup.created`, `backup.validated`, `rollback.completed`, `secret.rotated`).
- Elimination of alert fatigue and fake status reporting.
- Strict isolation of patient PHI from ordinary backups and development environments.

### Negative / Trade-offs:
- Cold exports require storage budget for AWS S3 KMS encryption and transfer.
- Rollbacks across schema-breaking database migrations require expand/contract dual-version database compatibility.
