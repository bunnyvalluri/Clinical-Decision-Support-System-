# Centralized Structured Logging & Redaction

## 1. Structured Logging Format
Logs emitted by Django and FastAPI workers are formatted as structured JSON or sanitized strings conforming to standard operational schema:
- `timestamp`: ISO-8601 UTC timestamp.
- `level`: Log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`).
- `service`: Service identifier (`healthnova-backend`, `healthnova-celery`, `healthnova-frontend`).
- `environment`: `production`, `staging`, or `development`.
- `request_id`: Unique per-request UUID.
- `correlation_id`: End-to-end trace correlation UUID.
- `user_role`: Authenticated role (`IT_ADMIN`, `DOCTOR`, etc.) without exposing username or email.
- `endpoint`: HTTP method and normalized route.
- `status_code`: HTTP response status.
- `duration_ms`: Execution time in milliseconds.

## 2. Redaction Engine
All logging handlers in HealthNova AI pass through `RedactedLogFilter` backed by `SensitiveDataRedactor`.
Regex filters scrub:
1. `Bearer <jwt>` tokens -> `Bearer [REDACTED]`
2. `sk-...` (OpenAI / Anthropic keys) -> `[REDACTED]`
3. `ghp_...` (GitHub tokens) -> `[REDACTED]`
4. `postgres://user:password@host...` -> `postgresql://user:***@host...`
5. `password=...`, `token=...`, `secret=...` keys in dictionary payloads.
6. Social Security / National ID regex (`\b\d{3}-\d{2}-\d{4}\b`).

## 3. Retention Policies
- **Application Logs**: 30 days retention.
- **Audit Logs (Neon DB)**: 7 years compliance retention (immutable, tamper-evident).
- **Security Logs**: 90 days retention with continuous alerting for auth anomalies.
