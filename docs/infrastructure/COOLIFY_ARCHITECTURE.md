# Coolify Infrastructure Architecture — HealthNova AI CDSS

## 1. Network Segmentation & Isolation

To satisfy healthcare compliance (HIPAA § 164.312), containers are segmented across isolated Docker networks:

```
                            INTERNET
                               |
                        [ Traefik Proxy ]
                               |
              +----------------+----------------+
              | (public-web)                    | (public-web)
              v                                 v
      [ Next.js Frontend ]              [ Django ASGI Gateway ]
              |                                 |
              | (app-internal)                  | (app-internal)
              +----------------+----------------+
                               |
        +----------------------+----------------------+
        |                      |                      |
        v                      v                      v
  [ Upstash/Local Redis ] [ Celery Worker ]    [ Celery Beat ]
        |                      |                      |
        | (data-internal)      |                      |
        +----------------------+----------------------+
                               |
                               v
                       [ Meilisearch Engine ]
                               |
                               v
                    [ Neon Lakebase Postgres ]
                      (Encrypted TLS / External)
```

| Network Name | Accessibility | Permitted Services |
| :--- | :--- | :--- |
| **`public-web`** | External (Ports 80/443 via Traefik) | Next.js (`frontend`), Django (`backend`) |
| **`app-internal`** | Strictly private (Container-to-container) | Next.js, Django, Celery Workers, Redis |
| **`data-internal`** | Strictly private (No public ingress) | Redis, Meilisearch, NocoDB, PocketBase |
| **`coolify-control`**| Management only | Coolify Engine, Traefik Dashboard |

---

## 2. Decoupling of Control Plane and Clinical Runtime

1. **State Independence**: Running application containers continue executing normally even if the Coolify control plane is stopped, upgraded, or partitioned.
2. **Reverse Proxy Resiliency**: Traefik runs as a separate container managed by Docker restart policies; Traefik routes traffic directly to application containers without proxying through Coolify's internal web dashboard.
3. **Database Independence**: Neon PostgreSQL is an external managed cloud database connecting directly over TLS; Coolify downtime has zero impact on database connectivity or query execution.
