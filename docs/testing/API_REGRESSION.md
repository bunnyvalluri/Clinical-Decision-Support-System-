# API Regression Testing Suite — HealthNova AI CDSS

Every fixed security vulnerability or integration defect is mapped to an executable regression test in Bruno:

| Regression ID | Integration / Area | Defect Description | Bruno Verification File | Asserted Invariant |
| :--- | :--- | :--- | :--- | :--- |
| `REG-AUTH-001` | Authentication | Token refresh with expired token returns 401 | `bruno/auth/AUTH-EXPIRED-001.bru` | `res.status == 401`, code `token_not_valid` |
| `REG-IDOR-001` | Patient Privacy | Patient A requesting Patient B record | `bruno/security/IDOR/IDOR-PATIENT-001.bru` | `res.status == 403` or `404` |
| `REG-RBAC-001` | Admin Boundary | IT Admin attempting to read raw clinical vitals | `bruno/security/RBAC/RBAC-ADMIN-VITALS-001.bru` | `res.status == 403`, error detail logged |
| `REG-MEILI-001` | Meilisearch | Search cluster down triggers PostgreSQL fallback | `bruno/meilisearch/MEILI-FALLBACK-001.bru` | `res.body.is_degraded == true` |
| `REG-NOCO-001` | NocoDB | Unauthorized write to read-only analytics dataset | `bruno/nocodb/NOCO-WRITE-DENIED-001.bru` | `res.status == 403` |
| `REG-PRED-001` | ML Inference | Invalid systolic blood pressure range rejected | `bruno/predictions/PRED-INVALID-BP-001.bru` | `res.status == 400`, validation error |
| `REG-INJECT-001`| Search Security | Boolean filter injection (`OR 1=1`) in search | `bruno/security/injection/INJECT-FILTER-001.bru` | Filter sanitized, no data leakage |
| `REG-HEADERS-001`| DevSecOps | HSTS and X-Content-Type-Options present | `bruno/security/headers/HEADERS-SECURITY-001.bru` | Required security headers present |
