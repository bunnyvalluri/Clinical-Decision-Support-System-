# Production Rollout Guide

Step-by-step production deployment procedure:

1. **Provision Neon Database:** Ensure production branch is active and connection strings are set.
2. **Execute Database Migrations:**
   ```bash
   python manage.py migrate --database=default
   ```
3. **Build and Tag Production Images:**
   ```bash
   docker build -t cdss-backend:latest ./backend
   docker build -t cdss-frontend:latest ./frontend
   ```
4. **Deploy Containers:** Launch backend, celery worker, celery beat, redis, and frontend.
5. **Verify Health Probes:** Inspect `GET /api/v1/health/metrics/` and `GET /api/v1/health/ready/`.
