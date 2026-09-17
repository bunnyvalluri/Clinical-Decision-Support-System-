# AI Agent Security & Data Protection Policy

## 1. Zero Trust Architectural Controls
The HealthNova AI agent platform operates under Zero Trust:
1. **JWT Authentication**: All REST requests and WebSocket connections (`ws/ai/agent/`) require an authenticated JSON Web Token.
2. **Object-Level Patient Scoping**: Requests with a `patient_id` parameter are verified against the calling user's authorized assignment list via `CanAccessPatientData`.
3. **SSRF Firewall**: External network requests are strictly filtered through domain allowlists (NIH, CDC, WHO, NEJM, Lancet, JAMA). Private, loopback, and link-local IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16) are rejected at the network client layer.
4. **Input Hashing & Cryptographic Audit**: Every tool call computes an SHA-256 hash of arguments, ensuring data provenance and tamper-evident audit trails in Neon PostgreSQL.
