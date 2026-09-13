# Immutable Clinical Audit Logging

Every critical clinical mutation triggers an entry in the `AuditLog` table.

---

## 1. Schema (`apps.core.models.AuditLog`)

- `user`: Foreign key to the acting user.
- `action`: `CREATE`, `UPDATE`, `DELETE`, `PREDICT`, `OVERRIDE`.
- `resource_type`: Target entity name (e.g., `Prediction`, `Patient`).
- `resource_id`: UUID of target entity.
- `ip_address`: Client IP address.
- `metadata`: JSON diff capturing before/after values and clinical rationale.
