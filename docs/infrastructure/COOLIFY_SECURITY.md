# Coolify Infrastructure Security & Least Privilege — HealthNova AI CDSS

> **Classification**: Security Architecture Standard  
> **Applicability**: IT System Administrators, Platform Engineers, DevSecOps

---

## 1. 5-Role RBAC & Infrastructure Boundaries

Infrastructure management is strictly separated from clinical roles:

| Role | Access to Coolify Dashboard | Can Trigger Deployments | Can View Server Telemetry | Can Roll Back Containers |
| :--- | :---: | :---: | :---: | :---: |
| **Doctor** | ❌ None | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **Nurse** | ❌ None | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **Patient** | ❌ None | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **Informaticist** | ❌ None | ❌ Forbidden | 👁️ Read-Only Status | ❌ Forbidden |
| **IT Administrator**| 🔑 Authorized | ✅ Authorized | ✅ Authorized | ✅ Authorized (With Confirmation) |

Clinical users (Doctor, Nurse, Patient) never see infrastructure menu items or receive infrastructure tokens.

---

## 2. Token Protection & Secret Hygiene

1. **Server-Side Token Storage**: The Coolify API Bearer token (`COOLIFY_API_TOKEN`) is injected into Django via secure environment variables. It is never passed to frontend client code or embedded in HTML templates.
2. **Scrubbing in Telemetry**: Application logs and audit records redact all bearer tokens, webhook signatures, and SSH fingerprints.
3. **No Docker Socket in Application Containers**: Application workloads (Django, Next.js) do **not** mount `/var/run/docker.sock`. Only the dedicated Coolify helper agent accesses the Docker socket.

---

## 3. Human Approval Gate for Clinical Production

Production clinical releases must **never** be autonomously triggered by AI agents:
- Multi-agent swarms (Ruflo) can analyze deployment logs or suggest optimizations.
- Production deployment execution requires explicit, authenticated human IT Admin approval recorded with an immutable audit entry (`AuditLog` action: `DEPLOY_PRODUCTION`).
