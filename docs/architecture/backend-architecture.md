# Backend Architecture

The backend is built with **Django 5.0** and **Django REST Framework (DRF)**, powered by the **Daphne ASGI** server to concurrently handle high-throughput REST APIs and persistent WebSocket channels.

---

## 1. Layered Architecture Pattern

```
┌───────────────────────────────────────────────────────────┐
│                       HTTP / WSS Request                  │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│              Custom Middleware (Metrics, JWT, CORS)       │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│          API View / ViewSet (Request Validation & Auth)   │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│           Service Layer (Business Logic & Transactions)   │
│           - PredictionService                             │
│           - ExplanationService                            │
│           - ReportService                                 │
└──────────────────┬───────────────────────┬────────────────┘
                   ▼                       ▼
┌──────────────────────────┐    ┌───────────────────────────┐
│   Repository / ORM Layer │    │   ML Inference Engine     │
│   (Neon PostgreSQL)      │    │   (In-Memory scikit-learn)│
└──────────────────────────┘    └───────────────────────────┘
```

### Why Decouple Business Logic from Views?
In naive Django applications, business logic is frequently embedded directly into ViewSets or model save methods. In PatientRisk CDSS, business logic is strictly encapsulated within the **Service Layer** (`services/`):
- **Portability:** The exact same prediction logic is executed by the REST API (`PredictionViewSet`), the background batch worker (`celery_tasks/ml_tasks.py`), and automated integration tests.
- **Auditability:** Transactions, clinical overrides, and audit log entries are managed in atomic units within service methods.
- **Testability:** Unit tests can mock repository methods or ML models without needing complex HTTP test client setups.
