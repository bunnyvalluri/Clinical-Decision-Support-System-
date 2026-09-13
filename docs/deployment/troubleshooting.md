# Troubleshooting Runbook

### 1. Database Connection Timeout
- **Symptom:** API returns 500 with `psycopg2.OperationalError`.
- **Resolution:** Verify Neon compute has not suspended or check that `DATABASE_URL` specifies `sslmode=require`.

### 2. WebSocket Reconnection Loops
- **Symptom:** Frontend badge flashes `Connecting...`.
- **Resolution:** Verify Nginx reverse proxy configuration includes `Upgrade $http_upgrade` and `Connection "upgrade"`.

### 3. Celery Report Generation Delays
- **Symptom:** Reports remain in `PROCESSING` status.
- **Resolution:** Check `GET /api/v1/health/celery/` to verify worker containers are active and inspect Redis memory.
