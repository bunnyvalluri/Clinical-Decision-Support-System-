# Celery Architecture

Celery manages asynchronous, distributed background task execution.

---

## 1. Worker Topology

- **Broker:** Redis 7 (`redis://redis:6379/0`).
- **Result Backend:** Redis 7 (`redis://redis:6379/0`).
- **Concurrency:** Pre-fork model with 4 worker processes per container (`CELERY_WORKER_CONCURRENCY=4`).
- **Scheduler:** Celery Beat process executing scheduled cron tasks.
