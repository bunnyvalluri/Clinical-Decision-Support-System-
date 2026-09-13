# Background Job Monitoring

Monitoring task health in production:
1. **API Polling Endpoint:** `GET /api/v1/health/celery/` checks worker availability.
2. **Live WebSocket Updates:** Tasks broadcast progress (0% -> 20% -> 100%) to `tasks_{user_id}`.
3. **Metrics Tracking:** In-memory counters log successful, failed, and retried task counts.
