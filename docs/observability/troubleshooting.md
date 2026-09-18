# Observability Troubleshooting Guide

## 1. Missing Metrics in Admin Dashboard
- **Check**: Ensure `AuditLogMiddleware` is loaded in `MIDDLEWARE` setting.
- **Check**: Verify `/api/v1/observability/metrics/` returns valid JSON with `http.total_requests > 0`.
- **Check**: If running behind a reverse proxy, ensure `X-Forwarded-For` and `Host` headers are forwarded.

## 2. Alerts Not Triggering
- **Check**: Confirm health checks in `/api/v1/observability/health/` reflect true dependency status.
- **Check**: Review threshold configurations in `backend/integrations/observability/alerts.py`.

## 3. Logs Not Redacting Secrets
- **Check**: Confirm `RedactedLogFilter` is attached to handlers in `settings.LOGGING`.
- **Check**: Inspect raw strings passed to logger; ensure they match the patterns defined in `SensitiveDataRedactor`.

## 4. Broken Correlation IDs
- **Check**: Confirm incoming requests have `X-Request-ID` or `X-Correlation-ID` headers, or verify middleware generates a valid UUID v4 fallback.
- **Check**: For background tasks, pass `correlation_id` explicitly in Celery `apply_async(headers={"correlation_id": ...})`.
