# Cline Architecture Rules — HealthNova AI CDSS

1. Neon PostgreSQL is the sole authoritative source of truth.
2. Django REST Framework is the authoritative authentication, authorization, and business logic layer.
3. Next.js 15 App Router provides the user interface with a strictly white-only palette (NO dark mode).
4. Celery coordinates background and asynchronous agent tasks; agent code never blocks web request threads.
5. Redis acts strictly as an ephemeral broker and cache, never as the authoritative database.
