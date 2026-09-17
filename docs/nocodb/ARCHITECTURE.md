# NocoDB Integration Architecture

> **HealthNova AI — Clinical Decision Support System (BPY-CSE-2666)**  
> **Topology:** Dual-Tier Analytics Engine | **Authoritative Store:** Neon PostgreSQL

---

## 1. System Topology & Boundary Definition

NocoDB (v0.258.0) is integrated strictly as an **auxiliary, controlled data workspace and internal analytics/informatics platform**.

```
+-----------------------------------------------------------------------------------+
|                                 HealthNova AI                                     |
|                                                                                   |
|  [ Clinicians & Users ]        [ Informaticists & Admins ]       [ AI Agents ]    |
|             |                               |                          |          |
|             v                               v                          v          |
|  +--------------------+         +-----------------------+     +---------------+   |
|  | Next.js Frontend   |         | Next.js DataWorkspace |     | MCP Gateway   |   |
|  | Role-Scoped Views  |         | NocoDB Embedded Grid  |     | Policy Guard  |   |
|  +--------------------+         +-----------------------+     +---------------+   |
|             |                               |                          |          |
|             +-------------------------------+--------------------------+          |
|                                             |                                     |
|                                             v                                     |
|                             +-------------------------------+                     |
|                             | Django REST Backend (/nocodb) |                     |
|                             | - RBAC & Row/Col Filtering    |                     |
|                             | - PHI Minimization & Redact   |                     |
|                             | - SSRF Defense & Audit Log    |                     |
|                             +-------------------------------+                     |
|                                             |                                     |
|                     +-----------------------+-----------------------+             |
|                     |                                               |             |
|                     v                                               v             |
|       +----------------------------+                 +----------------------------+
|       | Neon PostgreSQL            |                 | NocoDB Service             |
|       | (SOLE AUTHORITATIVE TRUTH) |                 | (Auxiliary Workspace)      |
|       | - Patients & Vitals        |                 | - Internal Port 8080       |
|       | - ML Predictions & Models  |                 | - Isolated SQLite meta.db  |
|       | - Immutable Audit Log      |                 | - Sync via Django Engine   |
|       +----------------------------+                 +----------------------------+
+-----------------------------------------------------------------------------------+
```

### Core Invariants
1. **Neon PostgreSQL is the SOLE AUTHORITATIVE SOURCE OF TRUTH.**
2. **Metadata Isolation:** All NocoDB internal state resides in an isolated metadata database (`noco.db` or dedicated schema). Clinical tables never contain `nc_*` prefixes or foreign keys pointing to NocoDB.
3. **No Direct Clinical Table Writeback:** NocoDB has zero write permissions into core clinical tables (`patients`, `encounters`, `prescriptions`). All data interactions flow through Django service APIs with strict validation.
4. **Controlled Analytics Projection:** Data exposed to NocoDB is materialized/projected as pseudonymous analytical tables or synced views.

---

## 2. Monorepo Alignment (NocoDB v0.258.0)

HealthNova AI leverages design patterns and schemas inspired by NocoDB v0.258.0:
- **Nested Schema Descriptors:** Columns define field types (`SingleLineText`, `Number`, `Rating`, `Select`, `MultiSelect`, `Formula`, `Attachment`).
- **View Specifications:** Grid, Form, and Gallery representations with sorting, multi-criteria filtering, and column hiding.
- **RESTful API Compatibility:** Exposing `/api/v1/nocodb/datasets/<dataset_id>/rows/` adhering to standard NocoDB data payload contracts for high interoperability.

---

## 3. Data Flow & Sync Mechanisms

1. **Scheduled Projection Sync:** Celery tasks (`backend/celery_tasks/ai_tasks.py` & `backend/apps/nocodb/services/sync_service.py`) synchronize analytics metrics from Neon PostgreSQL into NocoDB workspace datasets on scheduled intervals (every 15-60 minutes).
2. **Event-Driven Push:** When ML inference completes or feature drift exceeds thresholds, Django signals dispatch webhook/sync payloads to NocoDB workspace feeds.
3. **Realtime Broadcast:** Changes to workspace records are broadcast over Django Channels WebSockets to subscribed Informaticists and IT Admins.
