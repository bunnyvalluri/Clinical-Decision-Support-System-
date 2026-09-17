# Architecture Specification: Real-Time Healthcare CDSS

**Spec ID**: `ARCH-001`  
**Domain**: System Architecture & Component Topology  
**Status**: `CONVERGED`  
**Authoritative Backend**: Django REST Framework + Neon PostgreSQL  

---

## 1. System Topology Overview

The system implements a decoupled, event-driven, multi-tier architecture designed for low-latency clinical decision support, strict multi-tier authorization, and resilient degradation:

```
[ Healthcare Users / Clinicians ]
                │
                ▼
[ Next.js 15 Frontend (App Router, shadcn/ui, White-Only Design) ]
                │  (HTTPS / REST)                       │ (WSS / WebSockets)
                ▼                                       ▼
[ Django REST API Gateway (ASGI/Gunicorn) ] ◄──► [ Django Channels (Daphne) ]
                │                                       │
                ├───────────────────┬───────────────────┤
                ▼                   ▼                   ▼
       [ Domain Services ]   [ Celery Workers ]   [ Redis Broker / Channel Layer ]
                │                   │
                ▼                   ▼
     [ Neon PostgreSQL ]     [ ML Pipeline ] ──► [ SVM / RF / AdaBoost / SHAP ]
  (Authoritative Store)             │
                                    ▼
                          [ AI Gateway / Ollama ]
                                    │
                                    ▼
                         [ Meilisearch RAG Index ]
```

---

## 2. Invariants & Boundary Rules

1. **Spec Kit Position**: Spec Kit resides entirely in the engineering/governance lifecycle (`.specify/`, `specs/`). It is **NEVER** instantiated in production runtime Docker containers, HTTP request handlers, or Celery workers.
2. **Neon PostgreSQL Authority**: Neon PostgreSQL is the sole clinical source of truth. Redis, Meilisearch, and PocketBase are caches, indices, or scratch environments.
3. **Frontend Presentation Isolation**: Next.js communicates strictly via the Django REST API or Daphne WebSocket gateway. The frontend never accesses Neon PostgreSQL directly or calls Ollama directly.
4. **Asynchronous Decoupling**: Heavy ML model training, drift calculations, and RAG index synchronizations run exclusively in Celery background workers.
5. **Strict Theme Constraint**: UI components are restricted to a white/light theme palette. No dark mode CSS or theme toggles are allowed.
