# Ruflo Deployment & Infrastructure Architecture

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. Deployment Topology

The application infrastructure utilizes Docker containers orchestrated via `docker-compose`:

```
[Client Browsers]
       │
       ▼
[Nginx Reverse Proxy :80/:443]
       ├── / ──────────────> [Next.js Frontend Service :3000]
       ├── /api/ ──────────> [Daphne / Django ASGI Service :8000]
       └── /ws/ ───────────> [Daphne WebSocket Service :8000]
                                      │
                 ┌────────────────────┼────────────────────┐
                 ▼                    ▼                    ▼
        [Neon PostgreSQL]       [Redis 7 :6379]     [Celery Worker]
         (Cloud Database)       (PubSub & Cache)    (Async Tasks)
                                      │
                                      ▼
                         [Ruflo Orchestration Harness]
```

---

## 2. Environment Variables & Secret Configuration

Secrets are never committed to version control. They are managed via environment variables:

| Variable | Description | Classification |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled connection string | SECRET |
| `REDIS_URL` | Redis connection URL | SECRET |
| `DJANGO_SECRET_KEY` | Core Django cryptographic key | SECRET |
| `JWT_SIGNING_KEY` | Token signing secret | SECRET |
| `RUFLO_SECURITY_LEVEL` | Enforced security profile (`strict`) | INTERNAL |
| `RUFLO_MAX_WORKFLOW_TIMEOUT` | Hard ceiling on agent execution (60s) | INTERNAL |

---

## 3. Environment Isolation (Dev / Staging / Production)

- **Development**: Local SQLite/Neon branch, DEBUG=True, mock external notification endpoints.
- **Staging**: Neon isolated branch, full security guardrails, test patient datasets.
- **Production**: Authoritative Neon PostgreSQL, DEBUG=False, strict rate-limiting, hardened SSL/TLS, and human-in-the-loop gates enforced.
