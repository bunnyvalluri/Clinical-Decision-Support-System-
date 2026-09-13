# Data Protection & Encryption

- **Encryption in Transit:** Mandatory TLS 1.3 / HTTPS for all HTTP traffic and WSS for WebSockets.
- **Encryption at Rest:** Neon PostgreSQL enforces AES-256 transparent data encryption across storage volumes.
- **Soft Deletion:** Records are soft deleted (`is_deleted=True`) to maintain audit continuity.
