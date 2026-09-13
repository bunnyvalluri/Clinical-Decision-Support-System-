# 04. Technology Stack Inventory

This document details the complete technology stack powering the PatientRisk Clinical Decision Support System, including exact package versions, roles, and rationales.

---

## 1. Technology Matrix

| Layer | Technology | Version | Purpose in Application |
|---|---|---|---|
| **Frontend Framework** | Next.js | `16.3.5` | React application framework with App Router, SSR, and standalone build runner |
| **UI Library** | React | `19.0.0` | Declarative component UI rendering |
| **Language (Frontend)** | TypeScript | `^5.0.0` | Type safety, clinical schema enforcement, and compilation safety |
| **Styling** | Tailwind CSS | `^3.4.1` | Utility-first styling with custom clinical color tokens and responsive grid |
| **Icons** | Lucide React | `^0.475.0` | Modern SVG clinical and interface icons |
| **State Management** | Zustand | `^5.0.3` | Lightweight client state stores (`authStore`, `clinicalStore`) |
| **HTTP Client** | Axios | `^1.7.9` | REST API requests with request/response interceptors for JWT rotation |
| **Backend Framework** | Django | `5.0.14` | High-level Python web framework, ORM, and migration engine |
| **API Framework** | Django REST Framework | `3.15.2` | RESTful API serialization, viewsets, and permission controllers |
| **ASGI Server** | Daphne | `4.1.2` | Twisted-based ASGI server for concurrent HTTP and WebSocket connections |
| **Real-Time Channels** | Django Channels | `4.1.0` | WebSocket routing, connection lifecycles, and room multiplexing |
| **Channel Layer** | channels-redis | `4.2.0` | Redis-backed channel layer for cross-worker event broadcasting |
| **Background Queue** | Celery | `5.4.0` | Asynchronous task queue for long-running computational jobs |
| **Database** | Neon PostgreSQL | `16` (Cloud) | Serverless PostgreSQL with auto-scaling, branching, and connection pooling |
| **DB Driver** | psycopg2-binary | `2.9.10` | High-performance PostgreSQL database adapter for Python |
| **In-Memory Cache** | Redis | `7-Alpine` | Channel layer broker, Celery queue broker, and distributed lock engine |
| **Redis Client** | redis-py | `5.2.1` | Python interface to Redis |
| **ML Libraries** | scikit-learn | `1.6.1` | Machine learning modeling (SVM, Random Forest, AdaBoost) |
| **Explainable AI** | SHAP | `0.46.0` | TreeSHAP calculation for feature factor attribution |
| **Data Processing** | NumPy & Pandas | `2.2.3` / `2.2.3`| Numerical computations, dataframes, and matrix operations |
| **Model Persistence** | joblib | `1.4.2` | High-throughput pipeline serialization and deserialization |
| **PDF Generation** | ReportLab | `4.3.1` | Programmatic clinical PDF summary compilation |
| **Reverse Proxy** | Nginx | `1.25-Alpine` | Reverse proxy, static asset caching, and TLS termination |
| **Container Engine** | Docker & Compose | `24+` / `v2+` | Containerization of frontend, backend, worker, and Redis services |

---

## 2. Selection Rationale

### Why Next.js 16 & React 19?
Next.js provides a unified App Router architecture where static pages (landing, documentation, sign-in) are prerendered for instant first-contentful-paint (FCP), while dynamic authenticated patient dashboards use client-side hydration for zero-reload WebSocket event streaming.

### Why Daphne ASGI instead of standard WSGI?
Traditional WSGI servers (e.g., standard Gunicorn sync workers) block threads on long-lived connections, making WebSockets prohibitively expensive. Daphne natively handles asynchronous ASGI event loops, allowing thousands of simultaneous hospital WebSocket subscriptions while serving standard REST HTTP traffic.

### Why Neon Serverless PostgreSQL?
Neon separates storage and compute, enabling instant database branching for safe migration dry-runs, automatic scale-to-zero when idle in testing, and built-in connection pooling via PgBouncer to prevent connection exhaustion during concurrent clinical traffic.
