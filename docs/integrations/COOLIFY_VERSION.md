# Pinned Coolify Version Specification — HealthNova AI CDSS

> **Framework**: Coolify Self-Hosted Platform & Infrastructure Control Plane  
> **Source Repository**: https://github.com/coollabsio/coolify.git  
> **Pinned Version**: `v4.0.0-beta.380`  
> **Container Images**:
> - `ghcr.io/coollabsio/coolify:v4.0.0-beta.380` (Control Plane API & Engine)
> - `ghcr.io/coollabsio/coolify-helper:v4.0.0-beta.380` (Docker Host Agent)
> - `traefik:v3.2` (Edge Reverse Proxy & Automatic TLS Termination)
> **Authoritative Healthcare Database**: Neon PostgreSQL (Lakebase Postgres)  
> **Authoritative Business & Authorization Layer**: Django / Django REST Framework

---

## 1. Upstream Architecture & Pinning Policy

In accordance with enterprise DevSecOps and healthcare infrastructure standards, floating tags (e.g. `latest`, `v4-latest`) are **strictly prohibited** in production deployments. All Coolify control plane services must execute pinned container digests or immutable release tags.

| Component | Pinned Version / Tag | Runtime Purpose |
| :--- | :--- | :--- |
| **Coolify Core** | `ghcr.io/coollabsio/coolify:v4.0.0-beta.380` | Deployment engine, Git webhook listener, API server |
| **Coolify Helper** | `ghcr.io/coollabsio/coolify-helper:v4.0.0-beta.380` | Docker host agent, container log streaming, metrics |
| **Traefik Proxy** | `traefik:v3.2` | SNI routing, automatic Let's Encrypt TLS, HTTP->HTTPS |
| **Redis Cache** | `redis:7-alpine` | Control plane background queue & job broker |
| **PostgreSQL (Local)** | `postgres:16-alpine` | **Coolify internal configuration only** (Not clinical data) |

---

## 2. Separation of Concerns & Invariants

```
               COOLIFY CONTROL PLANE (Port 8000/internal)
                                   |
           +-----------------------+-----------------------+
           |                                               |
           v                                               v
    TRAEFIK PROXY                                  DOCKER DAEMON
 (TLS & Host Routing)                            (Workload Engine)
           |                                               |
           +-----------------------+-----------------------+
                                   |
                                   v
             RUNNING CLINICAL WORKLOADS (Isolated Networks)
                                   |
           +-----------------------+-----------------------+
           |                                               |
           v                                               v
     Next.js Frontend                               Django ASGI Backend
   (Port 3000 / Edge)                             (Daphne / Port 8000)
                                                           |
                                            +--------------+--------------+
                                            |                             |
                                            v                             v
                                     NEON POSTGRESQL                REDIS / CELERY
                                  (Authoritative Store)         (Inference & Queues)
```

1. **Neon PostgreSQL Remains Sole Authoritative Store**: Coolify's internal PostgreSQL database stores only platform metadata (projects, servers, environment variables). It must never hold patient data, clinical encounters, or risk predictions.
2. **Control Plane Independence**: A crash, restart, or upgrade of the Coolify container does **not** terminate or disrupt running application containers.
3. **No Clinical Workload Credentials in Coolify UI**: Clinical credentials (database passwords, master keys) are injected securely via server-side environment files, never browsable by unauthorized personnel.
