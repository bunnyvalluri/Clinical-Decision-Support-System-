# External API Governance & Role Authorization Matrix

> **Governance Standard — BPY-CSE-2666**

---

## 1. Five-Role Authorization Matrix

| Role | External API Permissions | Allowed Endpoints | Visual Constraints |
|---|---|---|---|
| **Doctor / Clinician** | Query approved medical references, drug warnings, NPI provider lookup | `/doctor/external-data` | High-prominence source provenance tags; cannot alter patient chart silently |
| **Nurse** | Read-only triage references (dosage calculation guidelines, nutrition) | `/nurse/triage` | Non-diagnostic labels; no raw configuration access |
| **Medical Informaticist** | Catalog inspection, schema versioning, drift impact, approval requests | `/informaticist/external-apis/*` | Technical metrics, contract schemas, quality evaluations |
| **IT Administrator** | Integration lifecycle, circuit breaker resets, credential rotation, audit log | `/admin/integrations/*` | Infrastructure only; **no access to unredacted clinical data** |
| **Patient / User** | Educational public health resources, approved dietary guidelines | `/patient/health` | Sanitized consumer language; no API debugging info or credentials |

---

## 2. API Approval State Machine
Every external API entry in `ExternalAPIRegistry` must progress through the following verified stages before live traffic is enabled:

```
[DISCOVERED]
     │
     ▼
[UNDER_REVIEW]
     │
     ▼
[SECURITY_REVIEW] ──(SSRF, Auth, Domain allowlist checked)
     │
     ▼
[PRIVACY_REVIEW]  ──(Zero PHI boundary verified)
     │
     ▼
[CLINICAL_REVIEW] ──(Medical relevance and evidence quality confirmed)
     │
     ▼
[APPROVED]        ──(Clinician / Admin signed off)
     │
     ▼
[ACTIVE]          ──(Live gateway queries enabled)
     │
     ├─► [SUSPENDED]  ──(Temporarily disabled due to failures / rate limits)
     │
     ├─► [DEPRECATED] ──(Retained for audit trail, new queries disabled)
     │
     └─► [REJECTED]   ──(Failed any review stage)
```

---

## 3. Human Gatekeeper Mandate
- Ruflo multi-agent swarms may analyze schemas, perform health probes, and recommend approvals, but **CANNOT autonomously activate an API**.
- Activation strictly requires a designated Clinician or IT Administrator sign-off via `ExternalAPIApproval`.
