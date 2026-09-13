# Configuration & Environment Variables

All backend settings are externalized and configured through environment variables.

---

## 1. Essential Configuration Keys

```env
# Django Core
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=production-crypto-key
ALLOWED_HOSTS=cdss.hospital.org,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://cdss.hospital.org

# Neon Cloud PostgreSQL
DATABASE_URL=postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require
DIRECT_DATABASE_URL=postgresql://user:pass@ep.neon.tech/neondb?sslmode=require

# Redis & Channels
REDIS_URL=redis://redis:6379/0
CHANNEL_LAYERS_BACKEND=channels_redis.core.RedisChannelLayer

# Celery Background Processing
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
CELERY_WORKER_CONCURRENCY=4

# Telemetry & Logging
LOG_LEVEL=INFO
ENABLE_STRUCTURED_JSON_LOGGING=True
```
