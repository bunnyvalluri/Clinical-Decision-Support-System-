# Audit Log API

Endpoints for compliance and security audit trails.

---

## 1. Endpoints

### 1.1 `GET /api/v1/audit/`
Retrieves immutable audit entries (resource type, user ID, IP address, timestamp, metadata diff). Requires `ADMIN` privileges.
