# Approved Destinations & External Integration

## 1. Destination Allowlist & Security Gates
Forwarding destinations must be explicitly created and approved by an IT Administrator:
- **`SECURE_WEBHOOK`**: Must enforce `https://` endpoint and validate against the SSRF IP blocklist.
- **`INTERNAL_API`**: Dispatches to HealthNova AI internal event bus.
- **`EMAIL`**: Approved institutional hospital SMTP server with TLS.
- **`PUSH_NOTIFICATION`**: Internal notification service with minimal non-PHI alert bodies.
- **`ENTERPRISE_CHAT`**: Dedicated internal chat bot channels with secrets securely vaulted.
- **`SMS`**: Controlled outbound SMS gateway. Strictly forbids raw PHI, OTPs, or passwords.

## 2. Webhook Request Signing Protocol
Outgoing webhooks from Celery include:
- `X-HealthNova-Signature`: `HMAC-SHA256(secret, timestamp:nonce:body)`
- `X-Timestamp`: UNIX timestamp.
- `X-Nonce`: Single-use random token.
- `X-Idempotency-Key`: Delivery correlation ID.

## 3. Rate Limiting & Circuit Breakers
If a destination experiences consecutive timeouts or HTTP 5xx responses:
- Celery applies exponential backoff (10s, 20s, 40s).
- After 3 failed attempts, event transitions to `ProcessingStatus.DEAD_LETTER` and is recorded in `DeadLetterEvent` for manual review.
