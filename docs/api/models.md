# Model Registry API

Endpoints for monitoring model versions, promotion, and performance telemetry.

---

## 1. Endpoints

### 1.1 `GET /api/v1/models/`
Lists all registered ML models with status (`ACTIVE`, `CANDIDATE`, `ARCHIVED`) and benchmark accuracy.

### 1.2 `POST /api/v1/models/{id}/promote/`
Promotes a model version to `ACTIVE`, automatically invalidating the in-memory cache on web workers. Requires `ADMIN` privileges.
