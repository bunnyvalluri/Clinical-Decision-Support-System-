# HealthNova AI — ADR-OBSERVABILITY-STACK: Observability Architecture Decision Record

## Status
**ACCEPTED** (2026-09-18)

## Context
HealthNova AI is an enterprise Clinical Decision Support System (CDSS) operating under strict HIPAA invariants:
1. Neon PostgreSQL is the sole authoritative source of truth.
2. Zero patient PHI or credentials in telemetry, logs, or metrics.
3. Telemetry must not degrade clinical inference or become a single point of failure.
4. Clean Architecture abstractions must isolate business logic from monitoring systems.

## Decision
We implemented a multi-tiered, standards-based observability layer:
1. **Clean Architecture Core Abstractions**:
   - `MetricsService`: In-memory thread-safe sliding-window counter and latency histograms (p50, p95, p99) bounded to 1,000 samples per bucket to prevent memory explosion.
   - `SensitiveDataRedactor` & `RedactedLogFilter`: Pre-configured regex scrubbing for Bearer tokens, DB credentials, API keys (`sk-...`, `ghp_...`), and SSN/PHI on standard logging handlers.
   - `CorrelationContext` & `TracingService`: Distributed context propagation via `contextvars`, generating RFC 4122 `X-Request-ID` and `X-Correlation-ID` preserved across HTTP, Celery, and DB boundaries.
   - `AlertService`: Deterministic SLO/SLA rule evaluations with role-based visibility filtering.
   - `IncidentService`: Real state machine (`DETECTED` -> `ACKNOWLEDGED` -> `INVESTIGATING` -> `MITIGATING` -> `RESOLVED` -> `POSTMORTEM`).
   - `AuditService`: Immutable event auditing writing directly into Neon PostgreSQL with redacted payloads.
   - `ObservabilityProvider`: Facade consolidating metrics, tracing, health, alerts, and incident dispatch.

2. **Telemetry Exporter Compatibility**:
   - Built to emit standard OpenTelemetry-compatible traces and Prometheus metric schemas.
   - Minimal overhead: In the absence of an external OTel Collector or Loki daemon, the application operates synchronously with zero dropped clinical requests or blocking network calls.

## Consequences
- Zero external SaaS dependencies required for core telemetry.
- Zero fake metrics: If a dependency or metric is unavailable, it is explicitly reported as `Unavailable`, `Unknown`, or `Not connected`.
- Role-based isolation prevents patients and non-admin clinicians from viewing infrastructure topologies.
