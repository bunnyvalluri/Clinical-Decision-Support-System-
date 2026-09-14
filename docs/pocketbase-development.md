# PocketBase Local Development Guide

## Prerequisites
- Docker & Docker Compose or precompiled PocketBase binary (`v0.25.9`).
- Node.js 20+ & npm.
- Python 3.12+ (in `backend/venv`).

## Running with Docker Compose
To run the full stack including PocketBase:
```bash
docker-compose up -d pocketbase
```
PocketBase will be accessible at:
- Service API: `http://localhost:8090/api/`
- Admin UI: `http://localhost:8090/_/` (development only)

## Running Manually (Standalone Binary)
1. Download PocketBase `v0.25.9` for your platform:
   - Windows: `pocketbase_0.25.9_windows_amd64.zip`
   - Linux: `pocketbase_0.25.9_linux_amd64.tar.gz`
   - macOS: `pocketbase_0.25.9_darwin_arm64.tar.gz`
2. Place executable in `services/pocketbase/`.
3. Launch with migrations applied:
   ```bash
   ./pocketbase serve --dir=./pb_data --http="127.0.0.1:8090"
   ```

## Frontend Configuration
In `.env` or `frontend/.env.local`:
```env
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```
If `NEXT_PUBLIC_POCKETBASE_URL` is omitted or PocketBase is down, the Next.js frontend defaults to graceful offline fallback without any runtime crashes.
