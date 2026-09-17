# Operations & Incident Management Specification

**Spec ID**: `OPS-SPEC-001`  
**Domain**: Reliability, Degradation, Disaster Recovery, & Blameless Postmortems  
**Status**: `CONVERGED`  

---

## 1. Failure-First Operations Matrix

| Outage Scenario | Blast Radius | Automated System Response | Clinician Mitigation |
| :--- | :--- | :--- | :--- |
| **Neon PostgreSQL Network Split** | System-wide reads/writes | Circuit breaker open, serve cached vitals with stale indicator | Switch to paper chart emergency mode |
| **Redis Broker Failure** | Async jobs & WebSockets | REST polling active; sync DB fallback for critical vitals | Notifications delayed to 15s poll |
| **Celery Worker Hang** | Drift monitoring & reports | Auto-restart worker after 3 missed heartbeats | Real-time risk predictions unaffected |
| **Ollama / LLM Offline** | AI Assistant unavailable | Return safe deterministic fallback banner | Core clinical decision flows unaffected |

---

## 2. Blameless Incident Protocol
1. **Identification**: Alert triggered via PagerDuty / Sentry.
2. **Containment**: Isolation of failing component, traffic routing to fallback.
3. **Root Cause Analysis**: Examination of logs, correlation IDs, and metrics.
4. **Fix Specification**: Formulation of SDD fix spec in `specs/incidents/`.
5. **Postmortem**: Blameless documentation of timelines, contributing factors, and permanent preventive actions.
