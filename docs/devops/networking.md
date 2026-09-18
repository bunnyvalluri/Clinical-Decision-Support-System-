# HealthNova AI — Container Networking & Topology Architecture

## 1. Network Topology
HealthNova AI enforces multi-tier network segregation via Docker bridges:
```
Internet / Clinician Client
           │
     HTTPS (Port 443)
           │
           ▼
  ┌─────────────────────────────────┐
  │ public-web (Bridge Network)     │
  │  - Traefik / Nginx Proxy        │
  │  - Next.js Frontend (Port 3000) │
  │  - Django ASGI Backend (Port 8000)
  └────────┬────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────┐
  │ app-internal (Isolated Network) │
  │  - Django ASGI Backend          │
  │  - Celery Worker (Inference)    │
  │  - Celery Beat (Scheduler)      │
  │  - Redis (Port 6379)            │
  └────────┬────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────┐
  │ data-internal (Isolated Network)│
  │  - Redis                        │
  │  - Meilisearch (Port 7700)      │
  │  - Ollama LLM (Port 11434)      │
  └─────────────────────────────────┘
           │
     Outbound TLS (Port 5432)
           │
           ▼
Neon PostgreSQL (Managed Cloud DB)
```

## 2. Port Exposure Policy
| Service | Internal Port | Publicly Exposed? | Justification |
| :--- | :--- | :--- | :--- |
| Nginx / Traefik | 80 / 443 | **YES** | Public web traffic & TLS termination |
| Next.js Frontend | 3000 | NO (Proxied) | Routed exclusively through reverse proxy |
| Django Backend | 8000 | NO (Proxied) | Routed exclusively through reverse proxy |
| Celery Worker | N/A | **NO** | Headless consumer; no open network ports |
| Redis | 6379 | **NO** | Strictly private to `app-internal` / `data-internal` |
| Meilisearch | 7700 | **NO** | Protected internal search engine |
| Ollama LLM | 11434 | **NO** | Self-hosted model API accessible only via AI Gateway |
| Neon PostgreSQL | 5432 | External Cloud | Connects over encrypted TLS outbound |

CRITICAL: Never expose Redis (6379), Meilisearch (7700), or Ollama (11434) directly to the public internet.
