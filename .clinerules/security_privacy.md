# Security & Privacy Rules — HealthNova AI CDSS

1. Zero Protected Health Information (PHI) is permitted in shared or permanent agent memory.
2. Prompt injection scans and PHI redaction must run on every inbound prompt.
3. Production shell access and arbitrary raw SQL execution are strictly DENIED.
4. Secrets, environment files (.env), and private keys must never be read or output by agents.
5. All sensitive operations mandate audit logging in Neon PostgreSQL.
