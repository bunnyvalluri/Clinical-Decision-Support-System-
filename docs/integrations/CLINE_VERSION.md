# Pinned Cline Version Specification — HealthNova AI CDSS

> **Framework**: Cline Autonomous Agent & Tool Execution Engine  
> **Source Repository**: https://github.com/cline/cline.git  
> **Pinned Version**: `v3.42.0` (Engine & Extension) / `@cline/sdk@3.42.0`  
> **Target Toolchain**: Bun 1.3.13 / Node >= 22 (Monorepo engine) | npm / Node 20+ (Next.js Application)  
> **Authoritative Healthcare Database**: Neon PostgreSQL (Lakebase Postgres)  
> **Authoritative Business & Authorization Layer**: Django / Django REST Framework  

---

## 1. Upstream Architecture & Pinning Policy

In accordance with BPY-CSE-2666 DevSecOps standards, unpinned branches (`main`, `master`) and floating tags (`latest`) are strictly forbidden. The Cline agent integration is pinned to stable release **v3.42.0**.

| Component | Pinned Version / Artifact | Role & Scope in HealthNova CDSS |
| :--- | :--- | :--- |
| **@cline/sdk** | `3.42.0` | Embeddable core agent engine and tool-calling protocol |
| **Cline Core Engine** | `v3.42.0` | Isolated asynchronous worker runtime for engineering subtasks |
| **MCP Protocol** | `JSON-RPC 2.0 (MCP 2024-11-05)` | Interoperability gateway for sandboxed microservices |
| **Language Runtime** | Bun 1.3.13 (Internal monorepo engine) | Strictly isolated inside containerized worker environments |
| **App Runtime** | Python 3.12 / Next.js 15 App Router | Primary clinical application stack (remains authoritative) |

---

## 2. Invariants & Separation of Concerns

```
                     CLINICAL CLINICIAN / USER
                                 |
                                 v
                     Next.js Frontend (Port 3000)
                                 |
                                 v  (HTTPS / JWT Bearer)
                     Django REST API (Port 8000)
                                 |
                     +-----------+-----------+
                     |                       |
                     v                       v
               NEON POSTGRESQL          AI GATEWAY
             (Authoritative DB)     (Safety & Policy Engine)
                                             |
                                             v
                                     CLINE AGENT SERVICE
                                   (Celery Worker Sandbox)
                                             |
                              +--------------+--------------+
                              |                             |
                              v                             v
                      Controlled Tools             Sandboxed MCP Server
                   (Read-Only / Sandboxed)        (Default-Deny Gateway)
```

1. **Neon PostgreSQL Remains Sole Authoritative Truth**: Cline possesses zero private databases. All agent sessions, tasks, events, and approvals are stored durably in Neon PostgreSQL via Django ORM.
2. **Zero Autonomous Clinical Decisions**: Cline is forbidden from generating standalone patient diagnoses, prescribing medication, or modifying clinical encounter notes without clinician review.
3. **Controlled Sandboxing**: Production shell access and arbitrary SQL execution are default **DENY**. Engineering tasks run in restricted workspace sandboxes.
4. **Human-in-the-Loop Sign-off**: Actions marked `HIGH` or `CRITICAL` risk (e.g. Coolify deployment requests, config changes) mandate explicit authorization.
