# Redis Channel Layer Infrastructure

Redis acts as the low-latency pub/sub backbone connecting Daphne ASGI workers.

---

## 1. Key Namespaces in Redis

- `asgi:group:dashboard`: Group holding active workstation connection channels.
- `asgi:group:risk_alerts`: Group holding triage and emergency station channels.
- `task_lock:<key>`: Distributed idempotency locks with TTL.
- `task_status:<task_id>`: Ephemeral 24-hour cache of Celery task state transitions.
