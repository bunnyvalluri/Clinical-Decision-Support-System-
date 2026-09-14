# Clinical System Security & Defense-in-Depth Specification

## Core Security Principles

### 1. Zero Trust Frontend
The browser environment is considered untrusted. No security decision rests solely on client-side state:
- Frontend routes isolate layouts and streamline clinician navigation.
- All actual data mutations, queries, and PHI (Protected Health Information) accesses require valid cryptographic tokens validated against backend cryptographic keys.

### 2. Role-Based Access Control (RBAC) Matrix

| Resource Scope | PATIENT | NURSE | DOCTOR | INFORMATICIST | IT ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Personal Health Records | Read (Self) | Read (Assigned) | Read / Write (All) | De-identified | Audit Only |
| Bedside Vitals / Triage | Read (Self) | Read / Write | Read | Read (Telemetry) | Denied |
| AI Risk Stratification | Summary Only | View / Alert | Full Model & SHAP | MLOps Drift & Benchmark | System Health |
| Clinical Review Sign-off | Denied | Denied | Approved Sign-off | Review Analytics | Denied |
| System Infrastructure & Logs | Denied | Denied | Denied | Audit Ledger | Full Control |

---

## Defense-in-Depth Pipeline

```
User Request (URL / Action)
       │
       ▼
[Edge Middleware]  ──(Role Mismatch)──▶ Auto-Redirect to Role Dashboard
       │ (Allowed)
       ▼
[Client Layout Guard (RoleGuard)] ──(Mismatch)──▶ router.replace(Role Dashboard)
       │ (Authorized)
       ▼
[Page Render & UI Shell]
       │
       ▼
[HTTP API Request with Bearer JWT]
       │
       ▼
[DRF Authentication & Permission Classes] ──(Forbidden)──▶ HTTP 403 Forbidden JSON
       │ (Authorized)
       ▼
[Postgres Database / Redis Cache]
```

---

## Token & Session Security
- **Access Tokens**: Short-lived JWTs (15-minute expiration) passed via `Authorization: Bearer <token>`.
- **Refresh Tokens**: Secure rotating refresh tokens stored with strict same-origin controls.
- **Role Cookie (`clinical_role`)**: Synchronized by the auth store with `SameSite=Strict; Path=/` to enable zero-latency Next.js Edge Middleware route evaluation without database roundtrips.
- **Logout Clean-up**: Completely clears localStorage, active tokens, cookies, and cached React Query keys before navigating to `/login`.
