# Metrics & SLI/SLO Architecture

## 1. Metrics Collected
HealthNova AI measures live system performance across standard SLI dimensions:

### HTTP Traffic & Latency
- `http.total_requests`: Total incoming requests.
- `http.total_errors`: Total 4xx and 5xx responses.
- `http.error_rate_pct`: Ratio of errors to total requests.
- `http.p50_ms`: Median request latency.
- `http.p95_ms`: 95th percentile latency.
- `http.p99_ms`: 99th percentile latency.
- `http.top_endpoints`: Hit counts partitioned by method and route pattern.

### Celery Asynchronous Tasks
- `celery.tasks_queued`: Live estimate of unacknowledged queue items.
- `celery.tasks_completed`: Total tasks finished successfully.
- `celery.tasks_failed`: Total tasks that exited with unhandled exceptions.
- `celery.worker_active_count`: Active worker instances detected via broker heartbeat.

### WebSockets & Django Channels
- `websockets.active_connections`: Active connected client sockets.
- `websockets.connection_errors`: WebSocket handshakes or frame transmissions that failed authorization or timed out.

### ML & AI Inference
- `ml_inference.sample_count`: Total clinical risk predictions evaluated.
- `ml_inference.p50_ms`, `ml_inference.p95_ms`: Inference calculation duration.
- `ai_gateway.total_requests`: Total calls to Databricks/Neon AI Gateway or local Ollama instances.
- `ai_gateway.errors`: LLM call failures or timeouts.

## 2. Cardinality Constraints
To prevent memory exhaustion and high database egress costs:
- High cardinality parameters (e.g. `patient_id`, raw query strings, passwords, SSNs) are strictly forbidden in metric tags.
- Route paths are normalized to patterns (e.g. `/api/v1/patients/` instead of `/api/v1/patients/3b9...`).
- Latency samples are held in a ring buffer bounded to 1,000 samples per bucket.
