# Search Role-Based Access Control (RBAC) Matrix

**Project:** BPY-CSE-2666 HealthNova AI  
**Scope:** 5-Role Healthcare Security Matrix for Search & Autocomplete  

---

## 1. Five-Role Permitted Indexes & Projections

| Role | Allowed Search Indexes | Enforced Server-Side Filters | Excluded Fields |
| :--- | :--- | :--- | :--- |
| **DOCTOR** | `patients`, `clinical_records`, `predictions`, `escalations`, `clinical_tasks`, `models`, `whiteboards`, `knowledge_sources` | Scoped to assigned department / primary physician or hospital active census. | Internal audit logs, raw AI prompt templates, system events. |
| **NURSE** | `patients`, `triage_records`, `clinical_tasks`, `escalations`, `predictions`, `whiteboards` | Scoped to active ward/bed assignments and unassigned triage intake queue. | Model training metrics, financial data, raw system logs. |
| **MEDICAL_INFORMATICIST** | `models`, `data_quality`, `ai_evaluations`, `predictions` (de-identified), `whiteboards`, `knowledge_sources` | Strips patient direct identifiers (names, SSNs, phone numbers). Shows pseudonymized IDs. | Direct patient demographic contact details (phone, email, address). |
| **IT_ADMIN** | `system_events`, `data_quality`, `models`, `whiteboards`, `knowledge_sources` | Service and infrastructure metadata only. | Direct clinical vitals and patient encounter notes. |
| **PATIENT (USER)** | `patients` (self), `predictions` (self), `clinical_records` (self), `knowledge_sources` | `user_id = <authenticated_user.id>` AND `is_active = true` strictly enforced. | All other patients' data, clinical internal escalation notes, model registry. |

---

## 2. Policy Enforcement Engine (`SearchPolicyService`)

All searches pass through `SearchPolicyService.can_search_index(user, index_name)` and `SearchPolicyService.get_enforced_filters(user, index_name)`:
- Client-supplied filters are validated against an allowlist of attributes for that role.
- Server-side mandatory filter clauses are prepended using `AND` semantics.
- Result sets are projected using `SearchPolicyService.filter_document_fields(user, index_name, hit)` before delivery to the frontend.
