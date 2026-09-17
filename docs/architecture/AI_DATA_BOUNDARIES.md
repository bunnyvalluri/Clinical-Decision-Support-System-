# AI Data Boundaries & Clinical Privacy Architecture

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. Single Source of Truth: Neon PostgreSQL

All authoritative records reside solely in **Neon PostgreSQL**:
- Patient demographics and identifiers.
- Physiological observation time-series (vitals, laboratory findings).
- ML predictions, probabilities, and TreeSHAP values.
- Clinician reviews and sign-off decisions.
- Complete immutable audit events.

Ruflo and its agents **never create parallel or shadow databases**.

---

## 2. Five Application Role Boundaries

| Role | Permitted AI Capabilities | Disallowed Capabilities |
| :--- | :--- | :--- |
| **Patient / User** | Educational wellness summaries, explained risk factors under supervised clinician context | Raw agent execution, clinical parameter modification, raw prompt injection access |
| **Doctor** | Patient risk trend analysis, guideline grounding, TreeSHAP explainability, clinical draft note generation | Unattended autonomous diagnosis, unauthorized production model mutation |
| **Nurse** | Triage risk screening, vital sign trend summarization, protocol alerting (qSOFA/NEWS2) | Overriding physician approvals, modifying ML production configuration |
| **Medical Informaticist** | Model drift monitoring (PSI/KS), dataset quality auditing, model validation, retraining review | Accessing patient personal contact details without clinical justification |
| **IT Administrator** | Infrastructure observability, agent task queue health, token usage monitoring, security audit logs | Accessing patient clinical health records or viewing identifiable medical notes |

---

## 3. Clinical Data Minimization: `ClinicalRiskContextBuilder`

Rather than providing entire EHR dumps to an AI model, the system utilizes context minimization:
1. **Pseudonymization**: Identifiers (full name, phone, address) are stripped; only a scoped correlation ID and age/gender are retained.
2. **Temporal Windowing**: Only the most recent 5 physiological records are included.
3. **Relevance Filtering**: Only vitals associated with risk evaluation (systolic/diastolic BP, heart rate, respiratory rate, body temperature, SpO2, glucose, creatinine, potassium, lactic acid) are passed.
