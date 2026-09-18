# Clinical Decision Support System Architecture — BPY-CSE-2666

## Technology Stack Overview
- **Authoritative Database:** Neon PostgreSQL (Lakebase)
- **Application Tier:** Django 5 / Django REST Framework (Python 3.13)
- **Real-Time Layer:** Django Channels + Redis + ASGI WebSocket Consumers
- **Background Workers:** Celery + Redis Task Queue
- **Search & Knowledge:** Meilisearch + Firecrawl
- **AI Intelligence:** Ollama + Neon AI Gateway + Ruflo Multi-Agent Swarm
- **Frontend Presentation:** Next.js 16 (App Router, Turbopack) + TypeScript + shadcn/ui (Strict White/Light Theme Only)

## Topology Diagram
```
                     Next.js 16 Frontend
                             │
                             ▼
                    Django 5 REST API
                             │
             +---------------+---------------+
             │                               │
             ▼                               ▼
     Clinical Services                   AI Gateway
             │                               │
             ├── ML Risk Engine              ├── Ollama
             ├── Model Registry              └── Knowledge (Firecrawl)
             ├── Data Quality Engine
             ├── Safety Rules Engine
             └── Timeline Aggregator
                             │
                             ▼
                    Neon PostgreSQL (DB)
                             │
                             ▼
                 Redis + Django Channels
                             │
                             ▼
                 Authorized WebSockets
```

## Security & Privacy Boundary
1. **Strict White Theme:** Absolutely zero `dark:*` Tailwind classes in public or clinical user interfaces.
2. **Context Minimization:** Identifiable Patient Health Information (PHI) is isolated from external LLM prompts and vector indices.
3. **5-Role Access Control Matrix:** Granular object-level permissions enforced in Django (`DOCTOR`, `NURSE`, `MEDICAL_INFORMATICIST`, `ADMIN`, `PATIENT`).
