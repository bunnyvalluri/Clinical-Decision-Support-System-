# Security Architecture

The PatientRisk CDSS security architecture is designed to adhere to healthcare data security best practices, including HIPAA security rules.

---

## 1. Core Security Pillars

1. **Dual-Token JWT Authentication:**
   - Access tokens have a 15-minute lifespan to minimize the attack surface of token interception.
   - Refresh tokens (7-day lifespan) are stored in secure HTTP-only cookies or encrypted local stores and rotated upon use.
2. **Clinical Role-Based Access Control (RBAC):**
   - Endpoints enforce granular permission classes (`IsClinician`, `IsAdminUser`, `IsPatientOwner`).
   - Patients can never access other patients' records; staff actions are restricted to assigned departments.
3. **Immutable Clinical Auditing:**
   - Every modification to patient records, risk predictions, or clinical overrides triggers an automated entry in the `AuditLog` table.
   - Audit logs capture the user ID, client IP, action type, and JSON metadata diff.
4. **Secret Sanitation:**
   - Production secrets (database credentials, secret keys, Redis URLs) are injected solely via environment variables and never committed to source control.
