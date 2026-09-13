# Deployment Architecture

The deployment architecture uses a multi-container Docker topology designed for zero-downtime deployments, horizontal worker scaling, and cloud database connectivity.

---

## 1. Container Topology

```mermaid
flowchart TD
    Internet((Clinician Users)) -->|HTTPS / WSS| Nginx[Nginx Reverse Proxy]
    Nginx -->|Port 3000| Frontend[Next.js 16 Standalone Container]
    Nginx -->|Port 8000| Backend[Daphne ASGI Backend Container]
    Backend <-->|Broker & Pub/Sub| Redis[(Redis 7 Container)]
    Backend <-->|Cloud DB Queries| NeonPostgres[(Neon PostgreSQL Cloud)]
    Redis <--> CeleryWorker[Celery Worker Container]
    Redis <--> CeleryBeat[Celery Beat Container]
    CeleryWorker <--> NeonPostgres
```

### 1.1 Separation of Database & Compute
As mandated by production guidelines, **PostgreSQL is never run inside a Docker container in production**. Neon Cloud PostgreSQL provides enterprise-grade durability, automated backups, and storage tier replication, freeing the container cluster to focus purely on stateless compute.
