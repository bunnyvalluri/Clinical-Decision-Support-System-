# Ollama Operations, Deployment & Runbook

## 1. Container Lifecycle
The Ollama daemon runs as a dedicated Docker container `ollama` managed by Docker Compose or Coolify.
- **Image**: `ollama/ollama:0.5.12`
- **Port**: `11434` (Internal private network)
- **Persistent Storage**: Named volume `ollama_data` mounted at `/root/.ollama`

## 2. Healthcheck & Liveness Probes
- **Endpoint**: `GET /api/tags`
- **Interval**: 10 seconds
- **Timeout**: 5 seconds
- **Retries**: 3
- **Restart Policy**: `unless-stopped`

## 3. Pre-loading & Model Warmup
To prevent cold-start latency for clinical users:
1. The Celery startup script or application initializer calls `/api/generate` with an empty prompt or warmup payload.
2. `OLLAMA_KEEP_ALIVE=15m` retains active model weights in memory/VRAM across consecutive clinician queries.

## 4. Resource Allocation & CPU/GPU Fallback
- **GPU (Production)**: NVIDIA Container Toolkit passes GPUs (`deploy.resources.reservations.devices`).
- **CPU (Fallback/Staging)**: If no GPU is present, Ollama falls back automatically to AVX2/AVX-512 CPU execution threads.
- Maximum concurrency is throttled via Django connection pool and queue limits to avoid thrashing system RAM.
