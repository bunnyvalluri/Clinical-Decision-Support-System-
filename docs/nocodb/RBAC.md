# NocoDB Role-Based Access Control (RBAC) & Scoping

> **HealthNova AI — Clinical Decision Support System (BPY-CSE-2666)**  
> **Governance:** Least Privilege Enforcement Across 5 Clinical & Administrative Personas

---

## 1. Persona Matrix & Permissions

| Role | Permitted Route | Allowed Datasets | Access Level | Column Restrictions |
|---|---|---|---|---|
| **Medical Informaticist** | `/informaticist/data-workspace`<br>`/informaticist/nocodb` | All analytical datasets (ML, Drift, Quality, Clinical Ops) | Read/Write/Export/Create Views | Zero raw PHI; pseudonymized identifiers only |
| **IT Administrator** | `/admin/nocodb` | All datasets, Webhook configs, System Telemetry | Full Admin / Schema / Audit Logs | Full administrative controls; SSRF validation |
| **Doctor** | `/doctor/data-workspace` | Assigned Clinical Ops, ML Model Explanations, Quality Issues | Read-Only / Filter / Bookmark Views | Restricted to clinical decision support metrics |
| **Nurse** | `/nurse/data-workspace` | Workflow Metrics, Triage Quality Queue | Read-Only | Restricted to operational shift metrics |
| **Patient** | `/user/data` | Personal Wellness / Exported Aggregates | Read-Only (Self-Only) | Strictly personal records; zero ML internal telemetry |

---

## 2. Row-Level & Column-Level Enforcement

Permissions are evaluated in `backend/apps/nocodb/permissions.py`:
1. **Role Verification:** Requests without valid JWT / session credentials matching the target persona are rejected with HTTP 403 Forbidden.
2. **Column Masking:** For non-admin personas, sensitive columns (such as infrastructure endpoints or internal tokens) are pruned dynamically before response serialization.
3. **Dataset Scoping:** The `get_queryset()` in dataset views filters available datasets strictly based on `dataset.allowed_roles.contains(request.user.role)`.
