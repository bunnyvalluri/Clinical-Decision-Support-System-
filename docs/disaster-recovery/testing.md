# HealthNova AI CDSS — Disaster Recovery Testing & Failure Injection Protocol

## 1. Safety Invariants for Failure Testing

> [!CAUTION]
> **Production Protection Rule**:
> Failure injection testing (Chaos Engineering) is strictly forbidden against the production clinical cluster during operational hours.
> Failure injection must be performed exclusively in **Staging**, **Pre-Production**, or an **Isolated DR Sandbox**.

---

## 2. 13 Standard Disaster Recovery Failure Scenarios

HealthNova AI maintains scheduled automated drills simulating 13 critical failure vectors:

| # | Failure Scenario | Simulated Fault | Expected System Behavior | Verification Standard |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Application Container Crash** | `kill -9` on Daphne ASGI PID | Docker restarts container automatically (< 5s) | HTTP 200 on `/health/` |
| 2 | **Backend DB Compute Outage** | Suspend Neon compute endpoint | Neon auto-provisions replacement compute (< 30s) | Query completes without data loss |
| 3 | **Frontend Pod Failure** | Terminate Next.js container | Nginx routes to standby instance or health holding page | Clean page load without 502 Bad Gateway |
| 4 | **Redis Broker Termination** | Stop Redis service | Cache degrades; critical alerts bypass queue synchronously | No unhandled exception in ASGI logs |
| 5 | **Celery Worker Stall** | SIGSTOP on worker processes | Tasks queue up in broker; worker restarts and drains queue | Task completion within retry window |
| 6 | **Meilisearch Failure** | Stop search daemon | Clinical record searches switch to PostgreSQL `ILIKE` | Search returns results with degraded latency |
| 7 | **Ollama AI Offline** | Disconnect inference socket | UI renders `"Prediction service unavailable"` | Zero synthetic risk score emitted |
| 8 | **Database Corrupted Table** | Drop non-critical test table | Restore via Neon zero-copy branch from timestamp `T-1` | Census count matches pre-drop baseline |
| 9 | **Registry Pull Failure** | Mock registry 404 response | System deploys cached local image digest | Deployment succeeds using local cache |
| 10 | **Deployment Rollback** | Deploy bugged release branch | Dispatch rollback to previous known-good commit | Service reverts to stable release (< 60s) |
| 11 | **Configuration Drift** | Modify Nginx proxy config | Git configuration reconciles and restores nominal conf | Reverse proxy routes nominal |
| 12 | **Credential Compromise** | Invalidate active secret key | Emergency rotation workflow issues new key; old revoked | Auth succeeds with new token |
| 13 | **Total Environment Rebuild** | Empty sandbox host VM | Full stack reconstructed from Git + Neon PITR branch | All 14 verification probes pass |

---

## 3. Scheduled Testing Cadence

- **Automated Synthetic Probes**: Continuous (every 60 seconds) via `/api/v1/infrastructure/health/`.
- **Pre-Release 14-Point Drill**: Executed before every major production release via CI/CD.
- **Monthly Isolated DR Drill**: SRE team executes end-to-end sandbox recovery using the newest cold backup.
- **Annual Tabletop Review**: Multi-disciplinary review including Clinical Safety Officer and CISO.
