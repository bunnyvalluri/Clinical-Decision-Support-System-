# Architecture Decision Record (ADR): NocoDB Integration for Clinical Analytics

- **Status:** Approved
- **Deciders:** HealthNova AI Architectural Review Board, Clinical Informatics Lead, DevSecOps Lead
- **Date:** 2026-09-17

---

## Context

Clinical Decision Support Systems (CDSS) require multi-disciplinary data interfaces:
- Informaticists need rapid exploration of machine learning drift, evaluation registries, and data quality issues.
- IT Administrators require visibility into API telemetry, audit logs, and integration health.
- Doctors and Nurses need concise, tabular operational queues without context-switching into deep code or query consoles.

Direct SQL consoles or unmanaged spreadsheet exports risk HIPAA PHI breaches, spreadsheet formula injection attacks, and concurrency conflicts against transactional clinical databases.

## Decision

We integrate **NocoDB (v0.258.0)** under a **Sustainable Use License (SUL 1.0)** compliant internal deployment architecture with the following invariants:
1. **Neon PostgreSQL is the SOLE AUTHORITATIVE SOURCE OF TRUTH.**
2. **Metadata Isolation:** NocoDB operates on its own dedicated SQLite metadata database (`noco.db`), completely separated from clinical tables (`patients`, `encounters`, `vitals`).
3. **Controlled Projection:** Only approved, de-identified analytical datasets (ML predictions, drift metrics, data quality logs) are exposed into NocoDB workspaces.
4. **Django API Gateway Mediation:** All frontend interactions pass through Django REST Framework (`/api/v1/nocodb/`) ensuring strict role-based access control, column-level masking, and audit logging.
5. **SSRF Defense:** Strict IP and URL validation prevents connections to cloud metadata (`169.254.169.254`) and internal RFC 1918 subnets.
6. **Formula Sanitization:** All spreadsheet exports escape formula characters (`=`, `+`, `-`, `@`) to prevent CSV injection.

## Consequences

### Positive
- Accelerated clinical informatics and MLOps monitoring without custom ad-hoc dashboards for every new metric.
- Clear separation between OLTP clinical workflows and analytical data exploration.
- Strict HIPAA compliance via automated PHI minimization and pseudonymization.
- Full auditability via immutable `NocoDBAuditEvent` records in Neon PostgreSQL.

### Negative / Trade-offs
- Additional auxiliary container in the Docker composition (`nocodb/nocodb:0.258.0`).
- Synchronization latency (up to 15 minutes for periodic batch sync, though critical alerts trigger near-realtime push).
- Requires continuous maintenance of projection schemas alongside evolving ML models.
