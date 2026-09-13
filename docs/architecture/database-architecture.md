# Database Architecture

The system utilizes **Neon Serverless PostgreSQL** as its single source of truth for all transactional, demographic, clinical, and audit data.

---

## 1. Neon Cloud Architecture & Configuration

Neon decouples Postgres compute from storage, allowing dynamic horizontal scaling and serverless scale-to-zero capabilities.

### 1.1 Connection Pooling
- **Pooled Connection String (`-pooler`):** Utilized by Django web workers. Routes queries through an integrated PgBouncer pool, supporting hundreds of concurrent connections without exhausting database memory.
- **Direct Connection String:** Utilized exclusively for schema migrations (`python manage.py migrate`), database introspection, and administrative DDL operations.

### 1.2 Branching Workflow
Neon provides zero-copy database branching in sub-seconds. In CI/CD pipelines, a temporary branch is spawned from production data to execute and validate migrations before merging.
