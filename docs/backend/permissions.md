# Permissions & Authorization

The backend implements custom DRF permission classes in `apps.accounts.permissions` and `apps.core.permissions`.

---

## 1. Permission Matrix

| Permission Class | Target User | Permitted Actions |
|---|---|---|
| `IsClinician` | `DOCTOR`, `CLINICIAN` | Create patients, request predictions, record clinical overrides, generate discharge summaries |
| `IsNurse` | `NURSE` | Log patient vitals, view ward telemetry alerts |
| `IsStaffUser` | `ADMIN`, `CLINICIAN`, `NURSE` | Access general clinical records |
| `IsAdminUser` | `ADMIN` | Manage users, view audit logs, promote ML model versions |
| `IsPatientOwner` | `PATIENT` | Retrieve only the patient's own profile and predictions |

Horizontal privilege escalation is strictly prevented by scoping querysets to the authenticated user's authorized patients.
