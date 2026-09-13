# Docker Containers Specification

### 1. Frontend Dockerfile (`frontend/Dockerfile`)
- Multi-stage build with Node.js 20 Alpine.
- Standalone runner output copying minimal `.next/standalone` assets.
- Runs under user `nextjs` (UID 1001).

### 2. Backend Dockerfile (`backend/Dockerfile`)
- Python 3.13-slim Debian base.
- Multi-stage dependency compilation.
- Executes Daphne ASGI server under `appuser` (UID 1000).
- Automated health check probing `http://localhost:8000/api/v1/health/live/`.
