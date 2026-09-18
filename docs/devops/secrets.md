# HealthNova AI — Secrets & Credential Management Policy

## 1. Cardinal Security Invariants
1. **Zero Production Secrets in Git**: No API keys, passwords, connection strings, or private certificates may ever be committed to the repository.
2. **Neon PostgreSQL Authoritative Store**: `DATABASE_URL` is supplied exclusively via environment variables provided by Coolify or CI/CD secret managers.
3. **Frontend Context Minimization**: Only variables prefixed with `NEXT_PUBLIC_` are bundled into client JavaScript. Never prefix API tokens, private keys, or control plane credentials with `NEXT_PUBLIC_`.
4. **No Raw Credentials in Logs**: Daphne, Celery, and Nginx logs must redact authorization headers, tokens, passwords, and clinical PHI.

## 2. Secrets Inventory

### Application & Auth
- `DJANGO_SECRET_KEY`: Cryptographically random 50+ character string
- `JWT_SECRET`: Secret key for RS256 / HS256 signing of clinical session tokens

### Authoritative Database
- `DATABASE_URL`: Connection string with `sslmode=require` targeting Neon PostgreSQL

### Cache & Broker
- `REDIS_URL`: Authenticated connection string for Celery tasks and Django Channels

### AI & Search
- `OLLAMA_BASE_URL`: Private internal endpoint (`http://ollama:11434`)
- `MEILISEARCH_MASTER_KEY`: 32+ char high-entropy secret for search engine administration

### Coolify Platform Control
- `COOLIFY_API_URL`: Internal control plane URL (`/api/v1`)
- `COOLIFY_API_TOKEN`: Least-privilege bearer token for trigger/rollback operations
- `COOLIFY_WEBHOOK_URL_STAGING`: Webhook URL for staging automated releases
- `COOLIFY_WEBHOOK_URL_PROD`: Webhook URL for production human-approved releases

### CI/CD & Registry
- `GITHUB_TOKEN` / `CONTAINER_REGISTRY_TOKEN`: Access tokens for GHCR container publishing
- `KAGGLE_USERNAME` & `KAGGLE_KEY`: Pipeline credentials for Kaggle dataset synchronization
