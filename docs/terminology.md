# HealthNova AI — Terminology Services & Clinical Code Mapping

> **Authoritative Coding Systems:** LOINC, SNOMED CT, ICD-10-CM, RxNorm  
> **Backend Model:** `apps.interoperability.models.TerminologyMapping`  
> **Document Identifier:** HN-TERMINOLOGY-2026

---

## 1. Supported Clinical Code Systems

HealthNova AI maintains explicit, version-controlled crosswalks between standard international healthcare terminologies and internal risk-prediction feature definitions:

| Coding System | Code URI | Clinical Domain |
| :--- | :--- | :--- |
| **LOINC** | `http://loinc.org` | Vital signs, laboratory observations, clinical panel measurements |
| **SNOMED CT** | `http://snomed.info/sct` | Clinical conditions, clinical findings, comorbidities, procedures |
| **ICD-10-CM** | `http://hl7.org/fhir/sid/icd-10-cm` | Diagnostic codes, reimbursement classifications, billing conditions |
| **RxNorm** | `http://www.nlm.nih.gov/research/umls/rxnorm` | Medications, active clinical ingredients, prescription orders |

---

## 2. Canonical Vitals Crosswalk (LOINC -> HealthNova)

| LOINC Code | Display Name | Internal ClinicalRecord Metric | Standard Unit | Normal Range |
| :--- | :--- | :--- | :--- | :--- |
| `8867-4` | Heart rate | `heart_rate` | `beats/minute` (`/min`) | 40 – 180 |
| `8480-6` | Systolic blood pressure | `systolic_bp` | `mm[Hg]` | 70 – 220 |
| `8462-4` | Diastolic blood pressure | `diastolic_bp` | `mm[Hg]` | 40 – 130 |
| `2708-6` | Oxygen saturation in Arterial blood (SpO2) | `oxygen_saturation` | `%` | 70 – 100 |
| `8310-5` | Body temperature | `temperature` | `Cel` (°C) / `[degF]` | 32.0 – 43.0 °C |
| `9279-1` | Respiratory rate | `respiratory_rate` | `breaths/minute` (`/min`) | 8 – 50 |
| `2345-7` | Glucose in Blood | `blood_sugar` | `mg/dL` / `mmol/L` | 30 – 600 mg/dL |
| `2160-0` | Creatinine in Serum or Plasma | `serum_creatinine` | `mg/dL` | 0.2 – 15.0 mg/dL |
| `6690-2` | Leukocytes (WBC) in Blood | `wbc_count` | `10*3/uL` (`k/uL`) | 1.0 – 50.0 k/uL |

---

## 3. Terminology Mapping Lifecycle

```
[External Code Received]
           │
           ▼
[Search TerminologyMapping Table]
           ├── Exact Active Match ────────► [MAPPED] (Safe to use in ML Pipeline)
           ├── Partial Match ─────────────► [PARTIALLY_MAPPED] (Flag for Informaticist)
           └── No Match Found ────────────► [UNMAPPED] (Preserve text; Review Queue)
```

1. **`MAPPED`**: Verified by a certified Medical Informaticist. Translated directly into numerical features for the ML model registry and risk inference pipeline.
2. **`PARTIALLY_MAPPED`**: Code matches a broad semantic category but requires sub-type verification.
3. **`UNMAPPED`**: Raw text and coding are safely stored in Neon PostgreSQL JSON attributes, but isolated from ML scoring until formally mapped.
4. **`REVIEW_REQUIRED`**: Source code is flagged as ambiguous or has experienced a version deprecation in the upstream terminology release.
