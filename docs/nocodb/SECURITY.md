# NocoDB Security Architecture & DevSecOps Controls

> **HealthNova AI — Clinical Decision Support System (BPY-CSE-2666)**  
> **Security Baseline:** OWASP Top 10 API Security, HIPAA Security Rule, NIST SP 800-53

---

## 1. Network & Container Security Boundary

1. **Private Binding:** The NocoDB container service runs on an internal Docker network bridge (`127.0.0.1:8080` internally, or `nocodb:8080` within Docker compose).
2. **Reverse Proxy & Gateway Isolation:** Direct external public access to port 8080 is blocked in production. Ingress traffic is routed through the Django API gateway (`/api/v1/nocodb/*`) or Next.js authenticated proxy routes.
3. **Dedicated Metadata Volume:** NocoDB internal database (`NC_DB=sqlite3:///usr/app/data/noco.db`) is stored in an encrypted persistent container volume, completely decoupled from the PostgreSQL database connection string.

---

## 2. SSRF (Server-Side Request Forgery) Defense

When connecting NocoDB or configuring external datasources / webhooks:
- **Blocked Target Hosts:**
  - Loopback addresses (`127.0.0.1`, `localhost`, `::1`)
  - Cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`)
  - Link-local and private RFC 1918 addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) unless explicitly allowlisted in `NOCODB_ALLOWED_PRIVATE_SUBNETS` by an IT Administrator.
- **Protocol Enforcement:** Only `http:` and `https:` protocols are permitted for webhook integrations; `file:`, `gopher:`, `dict:`, `ftp:` are rejected at the Django validation boundary.

---

## 3. Spreadsheet Formula Injection (CSV/Excel Sanitization)

All export handlers in `backend/apps/nocodb/services/integration_service.py` sanitize field values prior to generating CSV/XLSX:
```python
def sanitize_cell_value(val: str) -> str:
    if isinstance(val, str) and val.startswith(('=', '+', '-', '@', '\t', '\r')):
        return "'" + val
    return val
```

---

## 4. Webhook Security & Signature Verification

- Outbound webhooks from NocoDB to HealthNova AI services must include an `X-HealthNova-Signature` header computed via HMAC-SHA256 with the shared secret `NOCODB_WEBHOOK_SECRET`.
- Replay attacks are mitigated by validating timestamp freshness (`X-HealthNova-Timestamp` within 300 seconds of current system time).

---

## 5. Audit Logging

Every data view, row insert, update, export, and schema modification is logged to the immutable `NocoDBAuditEvent` model stored in Neon PostgreSQL:
- Timestamp (UTC)
- Actor User ID & Role
- Action (`VIEW`, `FILTER`, `INSERT`, `UPDATE`, `DELETE`, `EXPORT`, `SCHEMA_CHANGE`)
- Target Dataset & View ID
- IP Address & User Agent
- Modified Fields (diff summary, PHI-redacted)
