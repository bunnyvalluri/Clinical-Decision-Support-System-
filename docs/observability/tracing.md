# Distributed Tracing & Correlation Tracking

## 1. Trace Propagation
HealthNova AI tracks requests across service boundaries using HTTP headers:
- `X-Request-ID`: Uniquely generated per HTTP hop or transaction.
- `X-Correlation-ID`: Shared across upstream callers, async Celery tasks, and downstream AI/ML inference calls.

```
Client (Next.js)
       │  (Injects/receives X-Request-ID, X-Correlation-ID)
       ▼
Nginx Gateway
       │  (Preserves headers, forwards upstream)
       ▼
Django ASGI Backend
       │  (AuditLogMiddleware extracts contextvars via CorrelationContext)
       ├── Celery Dispatch (Passes correlation_id in task headers)
       ├── ML Inference (Records span with TracingService)
       └── Neon PostgreSQL (Logs transaction with correlation tag)
```

## 2. Span Anatomy
Spans generated via `TracingService.start_span(operation, tags)` contain:
- `operation`: Name of the discrete execution unit (e.g. `ml_inference_sepsis`, `coolify_deploy`).
- `start_time`, `end_time`: Monotonic high-resolution timestamps.
- `duration_ms`: Wall-clock latency.
- `correlation_id`: Current correlation context.
- `status`: `OK` or `ERROR`.
- `tags`: Safe metadata (e.g. `model_name`, `dataset_version`). No PHI or sensitive values.
