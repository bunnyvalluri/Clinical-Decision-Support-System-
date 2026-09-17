# Ollama Troubleshooting & Incident Response

## 1. Common Incident Scenarios & Remediation

### Scenario 1: Ollama Daemon Unreachable (Connection Refused)
- **Symptom**: Django logs `OllamaConnectionError: Failed to connect to http://ollama:11434`.
- **Impact**: AI explanations and chat features return degraded status; ML risk predictions continue functioning normally.
- **Root Causes**:
  1. Docker container `ollama` exited or crashed.
  2. Out-of-memory (OOM) killer terminated the process during large model load.
- **Remediation**:
  1. Inspect container logs: `docker logs --tail 100 cdss_ollama`.
  2. Verify memory utilization: `docker stats cdss_ollama`.
  3. Restart container: `docker compose restart ollama`.

### Scenario 2: High Latency / Slow Token Generation
- **Symptom**: TTFT > 10 seconds, tokens/sec < 5.
- **Root Causes**:
  1. Model was evicted from VRAM/RAM due to keep-alive timeout.
  2. Context window exceeded, causing excessive KV cache swap.
  3. Concurrent requests saturating CPU/GPU compute.
- **Remediation**:
  1. Increase `OLLAMA_KEEP_ALIVE` to `30m` or `1h`.
  2. Enforce context budget truncation in `chat.py`.
  3. Scale Ollama replicas or adjust concurrency gate `OLLAMA_MAX_CONCURRENCY`.

### Scenario 3: Circuit Breaker Open
- **Symptom**: Requests fail immediately with `CircuitBreakerOpenError`.
- **Root Causes**: Ollama returned 5 consecutive timeouts or 500 errors within 60 seconds.
- **Remediation**:
  1. The circuit breaker will automatically enter `HALF_OPEN` state after 30 seconds to test recovery.
  2. Check Ollama daemon health: `curl http://localhost:11434/api/tags`.
  3. Inspect `/api/v1/ai/providers/ollama/health/` in Django.

### Scenario 4: Structured Output Validation Failure
- **Symptom**: Client receives `StructuredOutputValidationError`.
- **Root Causes**: Model generated markdown wrappers (e.g. ````json ... ````) or malformed JSON keys.
- **Remediation**:
  1. Ensure `format: "json"` is passed in API payload.
  2. Temperature should be set to deterministic value (`0.1`).
  3. `structured_output.py` contains auto-strip sanitizers for markdown markers.
