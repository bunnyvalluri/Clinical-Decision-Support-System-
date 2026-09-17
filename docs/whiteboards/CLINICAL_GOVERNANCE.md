# Clinical Governance & Non-Authoritativeness Invariant

> **Mandatory Rule:** Whiteboards are auxiliary visualization tools. They are NEVER authoritative clinical records.

---

## 1. The Non-Authoritativeness Invariant

```
╔════════════════════════════════════════════════════════════════════════════╗
║ 1. A clinical whiteboard is an auxiliary workflow and documentation tool.  ║
║ 2. Drawn annotations (e.g. "Risk = High", "Dose = 100mg") are NON-BINDING.║
║ 3. The authoritative source of clinical risk remains solely in Neon        ║
║    PostgreSQL via the Django ML prediction service.                        ║
║ 4. Whiteboards can link to predictions by reference, but cannot alter      ║
║    the underlying features, model weights, or prediction probabilities.    ║
║ 5. Clinical diagrams involving patient care require human doctor sign-off. ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Whiteboard Types & Authorized Roles

| Whiteboard Type | Allowed Roles | Description |
| :--- | :--- | :--- |
| `CARE_PLAN` | DOCTOR, NURSE, PATIENT | Multidisciplinary patient care trajectory & goals. |
| `CLINICAL_WORKFLOW` | DOCTOR, NURSE | Ward protocols, admission & discharge flowcharts. |
| `PATIENT_JOURNEY` | DOCTOR, NURSE, PATIENT | Patient health literacy & educational trajectory. |
| `TRIAGE_WORKFLOW` | DOCTOR, NURSE | Emergency triage decision pathways (ESI / qSOFA). |
| `RISK_ANALYSIS` | DOCTOR, INFORMATICIST | Visual breakdown of patient risk factors linked to ML. |
| `DECISION_TREE` | DOCTOR, INFORMATICIST | Sepsis, cardiac, or oncology clinical decision trees. |
| `CLINICAL_EDUCATION`| ALL ROLES | Anatomic, pathophysiologic, and pharmacological diagrams. |
| `TEAM_COLLABORATION`| ALL CLINICIANS | Handoffs, morning rounds whiteboard notes. |
| `ML_WORKFLOW` | INFORMATICIST, ADMIN | Training pipelines, validation splits, drift monitors. |
| `AI_WORKFLOW` | INFORMATICIST, ADMIN | RAG pipelines, agent coordination, safety gates. |
| `DATA_LINEAGE` | INFORMATICIST, ADMIN | Data ingestion from EHR, transformation, feature stores. |
| `SYSTEM_ARCHITECTURE`| IT ADMIN, INFORMATICIST| Django, Neon, Redis, Celery infrastructure diagrams. |
| `INCIDENT_RESPONSE` | IT ADMIN, INFORMATICIST| Root cause analysis, failover procedures, post-mortems. |
| `GENERAL` | ALL ROLES | General purpose scratchpad diagrams. |

---

## 3. Patient Linking & Privacy Policies

1. **Explicit Association**: A whiteboard may link to a patient by setting `patient_id`.
2. **Classification Auto-Upgrade**: Linking a patient automatically escalates the whiteboard classification to `PHI` or `SENSITIVE`.
3. **Data Minimization Requirement**: Even on patient-linked whiteboards, clinicians are prompted not to draw direct patient identifiers (SSN, phone, full address, MRN).
4. **Patient Access Rights**: Patients have view access only to whiteboards where `patient_id == current_user.patient_id` and `classification == "PHI"` and `type IN ('CARE_PLAN', 'PATIENT_JOURNEY')`. Patients are strictly prohibited from viewing internal ML pipelines or system architecture boards.
