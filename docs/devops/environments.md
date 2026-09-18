# HealthNova AI — Environments Management Guide

## 1. Environment Separation Strategy
HealthNova AI strictly isolates three runtime environments:
1. **Development (`development`)**:
   - `DEBUG=True`
   - Local or development Neon branch
   - In-memory or local Redis (`redis://localhost:6379/0`)
   - Mocked external APIs or sandbox credentials
   - Zero real patient PHI
2. **Staging (`staging`)**:
   - `DEBUG=False`
   - Staging Neon database branch with de-identified synthetic test fixtures
   - Isolated Redis (`redis://redis-staging:6379/0`)
   - Traefik TLS termination at `staging-app.healthnova.local`
   - Used for end-to-end synthetic testing and regression audits
3. **Production (`production`)**:
   - `DEBUG=False`
   - Authoritative Production Neon PostgreSQL (`DATABASE_URL` with SSL required)
   - High-availability Redis broker with strict password authentication
   - Let's Encrypt TLS via Traefik / Nginx at `app.healthnova.ai` and `api.healthnova.ai`
   - Strict human-approval gating before release

## 2. Environment Matrix Comparison

| Variable Category | Development | Staging | Production |
| :--- | :--- | :--- | :--- |
| `DJANGO_DEBUG` | `True` | `False` | `False` |
| `DJANGO_SETTINGS_MODULE` | `config.settings.development` | `config.settings.development` / `staging` | `config.settings.production` |
| Database | Dev Neon Branch / SQLite | Staging Neon Branch | Authoritative Prod Neon DB |
| Redis | Local 6379 / Container | Staging Internal 6379 | Hardened Prod Redis |
| Celery Concurrency | 2 | 2 | 4 |
| Ollama Inference | Mock / Local 11434 | Private internal stack | Private internal stack |
| Security Testing | Active / Strix / Bruno | Authorized test targets | Disabled by default |
