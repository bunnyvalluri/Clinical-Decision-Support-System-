# Alerting Rules & Role-Based Routing

## 1. Alert Rule Catalog

| Alert ID | Severity | Category | Condition / Threshold | Routing / Target | Runbook |
|---|---|---|---|---|---|
| `ALERT-DB-UNAVAILABLE` | CRITICAL | DATABASE | Neon DB health check fails (`UNHEALTHY`) | SRE, IT_ADMIN | [Database Unavailable](file:///c:/4-1/docs/observability/runbooks.md#2-database-unavailable) |
| `ALERT-REDIS-UNAVAILABLE` | CRITICAL | INFRASTRUCTURE | Redis ping fails or connection refused | SRE, IT_ADMIN | [Redis Unavailable](file:///c:/4-1/docs/observability/runbooks.md#3-redis-unavailable) |
| `ALERT-HIGH-5XX-RATE` | HIGH | APPLICATION | HTTP 5xx error rate > 5.0% over sample window | Engineering, SRE | [High API Error Rate](file:///c:/4-1/docs/observability/runbooks.md#6-high-api-error-rate) |
| `ALERT-CELERY-BACKLOG` | HIGH | QUEUE | Celery unacknowledged queue backlog > 100 | SRE, Engineering | [Celery Queue Backlog](file:///c:/4-1/docs/observability/runbooks.md#4-celery-queue-backlog) |
| `ALERT-ML-INFERENCE-ERROR` | HIGH | ML | Model inference errors > 3% or pipeline exception | Medical Informaticist, SRE | [ML Inference Failure](file:///c:/4-1/docs/observability/runbooks.md#8-ml-inference-failure) |
| `ALERT-WEBSOCKET-FAILURE` | MEDIUM | APPLICATION | WebSocket connection errors > 10 | Engineering, SRE | [WebSocket Failure](file:///c:/4-1/docs/observability/runbooks.md#5-websocket-failure) |

## 2. Role-Based Alert Visibility
Alerts are filtered before serialization to adhere to least-privilege principles:
- **`IT_ADMIN` / `SUPERUSER`**: Full visibility across Infrastructure, Database, Application, Security, and ML alerts.
- **`MEDICAL_INFORMATICIST`**: Access to ML, Dataset, and AI Pipeline alerts.
- **`DOCTOR` / `NURSE`**: High-level clinical workflow operational status; infrastructure alerts are suppressed.
- **`PATIENT`**: Zero access to internal operational alerts or infrastructure topologies.
