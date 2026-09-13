# Django Architecture & Settings

The backend configuration is partitioned into modular settings files located in `backend/config/settings/`.

---

## 1. Settings Hierarchy

- `base.py`: Universal configuration (installed apps, middleware, authentication backends, REST framework policies, JWT lifetimes, and channel layer routing).
- `development.py`: Enables debug toolbar, verbose logging, and in-memory test cache.
- `production.py`: Enforces HTTPS redirection, secure cookies, strict HSTS, Neon pooled database engine, and JSON structured logging.

---

## 2. Middleware Pipeline

Incoming requests traverse the custom middleware pipeline defined in `apps.core.middleware`:
1. `SecurityMiddleware`: Standard Django security headers.
2. `CorsMiddleware`: Validates cross-origin requests against `CORS_ALLOWED_ORIGINS`.
3. `RequestLoggingMiddleware`: Assigns a unique correlation ID (`X-Request-ID`) to each request and measures execution latency in milliseconds.
4. `AuthenticationMiddleware`: Populates `request.user` via JWT validation.
5. `MetricsMiddleware`: Records response status codes and elapsed time into the in-memory `MetricsRegistry`.
