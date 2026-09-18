# HealthNova AI Observability Platform Overview

## 1. Primary Objective
The HealthNova AI Observability Platform provides full-stack visibility across Application, Infrastructure, Neon Database, Redis, Celery, WebSockets, ML inference, and Security subsystems without sacrificing clinical performance or compromising Protected Health Information (PHI).

## 2. Core Architecture
```
HealthNova AI Subsystems
(HTTP, ASGI Channels, Celery, ML Pipelines, AI Gateway)
                    │
                    ▼
       Clean Architecture Observability
  ┌─────────────────────────────────────────┐
  │ • MetricsService (p50, p95, p99, RPS)   │
  │ • SensitiveDataRedactor (Zero-PHI)      │
  │ • CorrelationContext (X-Request-ID)     │
  │ • TracingService (Span Lifecycle)       │
  │ • AlertService (Rule Evaluator)         │
  │ • IncidentService (Lifecycle States)    │
  │ • AuditService (Neon Immutable Store)   │
  └─────────────────────────────────────────┘
                    │
                    ▼
     RBAC-Governed REST Endpoints
  ┌─────────────────────────────────────────┐
  │ /api/v1/observability/overview/         │
  │ /api/v1/observability/health/           │
  │ /api/v1/observability/metrics/          │
  │ /api/v1/observability/alerts/           │
  │ /api/v1/observability/incidents/        │
  └─────────────────────────────────────────┘
                    │
                    ▼
   White-Only Frontend Command Centers
  ┌─────────────────────────────────────────┐
  │ /admin/monitoring (Live Telemetry)      │
  │ /admin/incidents  (Incident Management) │
  │ /admin/health     (Dependency Matrix)   │
  └─────────────────────────────────────────┘
```

## 3. Guiding Principles
- **No Fake Data**: Real counters and real measurements only. If an agent, worker, or metric is missing, the status is explicitly `Unavailable` or `Not connected`.
- **Zero PHI in Telemetry**: All logs, metrics, traces, and alert messages are filtered through `SensitiveDataRedactor`.
- **Fail-Safe Operation**: If observability pipelines experience network pressure, telemetry is dropped or buffered locally; clinical inference and patient care are never blocked.
