# Production Environment Variables Catalog

| Variable Name | Sample / Default Value | Purpose |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | Active Django settings module |
| `SECRET_KEY` | *(Cryptographic 50+ chars)* | Cryptographic signing key |
| `ALLOWED_HOSTS` | `cdss.hospital.org` | Allowed HTTP host headers |
| `CSRF_TRUSTED_ORIGINS` | `https://cdss.hospital.org` | Approved CSRF origins |
| `DATABASE_URL` | `postgresql://...@ep-pooler.neon.tech/neondb` | Pooled Neon PostgreSQL connection |
| `DIRECT_DATABASE_URL` | `postgresql://...@ep.neon.tech/neondb` | Direct Neon PostgreSQL connection |
| `REDIS_URL` | `redis://redis:6379/0` | Redis channel layer & broker |
| `CELERY_BROKER_URL` | `redis://redis:6379/0` | Celery message broker |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/0` | Celery task result backend |
| `CELERY_WORKER_CONCURRENCY`| `4` | Number of worker processes |
| `LOG_LEVEL` | `INFO` | Root logging threshold |
