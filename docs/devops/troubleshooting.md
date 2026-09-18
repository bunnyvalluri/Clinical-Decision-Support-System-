# HealthNova AI — DevOps Troubleshooting Guide

## 1. Common Incident Scenarios & Diagnostics

### A. Daphne ASGI Backend Returns 502 / Bad Gateway
- **Symptom**: Nginx or Traefik logs `upstream prematurely closed connection while reading response header from upstream`.
- **Diagnosis**:
  1. Check backend container logs: `docker logs healthnova-backend-1`
  2. Test healthcheck directly: `curl -v http://localhost:8000/api/v1/health/`
  3. Verify PostgreSQL connectivity via Neon: ensure `DATABASE_URL` has `sslmode=require` and pool connections are not exhausted.

### B. Redis Broker Unreachable / Celery Tasks Hanging
- **Symptom**: Celery worker logs `Cannot connect to redis://redis:6379/0: Error 111 connecting to redis:6379. Connection refused.`
- **Diagnosis**:
  1. Verify Redis container status: `docker ps -f name=redis`
  2. Run ping probe: `docker exec -it <redis-container> redis-cli ping`
  3. Confirm both backend and celery-worker share the `app-internal` network.

### C. WebSocket Connection Dropped or Failing Handshake
- **Symptom**: Browser console logs `WebSocket connection to 'wss://api.healthnova.ai/ws/...' failed: Error during WebSocket handshake`.
- **Diagnosis**:
  1. Ensure Nginx configuration includes:
     ```nginx
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
     proxy_read_timeout 86400s;
     ```
  2. Verify Channels Redis layer configuration in `config/settings/production.py`.
  3. Confirm Traefik/Coolify router is configured with WebSocket passthrough.

### D. Next.js Standalone Build Missing Assets
- **Symptom**: Frontend container crashes with `Error: Cannot find module 'server.js'` or static files 404.
- **Diagnosis**:
  1. Ensure `next.config.ts` specifies `output: "standalone"`.
  2. Confirm Dockerfile copies both `.next/standalone` and `.next/static`:
     ```dockerfile
     COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
     COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
     ```

### E. Ollama Out-of-Memory / High Latency
- **Symptom**: Ollama container killed by OOM killer or taking >30 seconds per completion.
- **Diagnosis**:
  1. Verify resource limits in `ollama.yml`: minimum 4GB reservation, 16-32GB limit.
  2. Ensure `OLLAMA_NUM_PARALLEL` is tuned to CPU/GPU cores (default 2-4).
  3. Verify AI Gateway circuit breaker activates to route requests gracefully to de-identified fallback.
