# Clinical Safety Specification Template: [CLINICAL WORKFLOW]

**Specification ID**: `CLINICAL-[DOMAIN]-[SEQ]`  
**Target Feature**: `[FEAT-XXX]`  
**Intended Use**: [Precise clinical context - e.g., Bedside risk triage assistance for adult inpatient wards]  
**Intended Clinical Users**: [Attending Physicians, Triage Nurses, Rapid Response Teams]  
**Target Patient Population**: [Adult inpatients >= 18 years, excluding specialized obstetric/pediatric units unless validated]  

---

## 1. Clinical Invariants & Safety Boundaries
- **Autonomous Diagnosis Prohibited**: System MUST NOT emit definitive diagnoses.
- **Autonomous Prescription Prohibited**: System MUST NOT order medications or titration.
- **Clinician Supremacy**: System outputs are advisory. Clinician judgment is final.
- **Clinician Sign-Off**: Actionable risk scores require explicit recorded review by an authorized clinician.

---

## 2. Clinical Decision Rules & Evidence Base
- **Deterministic Rules Baseline**: [e.g., qSOFA >= 2, NEWS2 score >= 5, sepsis bundle alerts]
- **Clinical Evidence References**: [Published clinical trials, hospital SOPs, medical guideline references]
- **Physiological Feature Inputs**:
  | Feature | Unit | Physiological Normal Range | Extreme Cutoff (Abstention) |
  | :--- | :--- | :--- | :--- |
  | Systolic Blood Pressure | mmHg | 90 - 120 | < 50 or > 250 |
  | Heart Rate | bpm | 60 - 100 | < 30 or > 220 |
  | Respiratory Rate | breaths/min | 12 - 20 | < 6 or > 60 |
  | Oxygen Saturation (SpO2) | % | 95 - 100 | < 70 |
  | Temperature | °C | 36.5 - 37.5 | < 32 or > 42 |

---

## 3. Failure Modes, Edge Cases, & Degraded Operations
- **Missing Vital Signs**: System MUST emit `DATA_INCOMPLETE` if critical vitals are absent.
- **Extreme / Unrealistic Values**: System MUST flag sensor malfunction / out-of-range inputs and request manual re-entry.
- **Model Abstention / High Uncertainty**: If entropy exceeds safety cutoff, system MUST abstain from probability estimation and output `REVIEW_REQUIRED`.

---

## 4. Clinical Audit & Review Workflow
1. Event logged with timestamp, patient pseudonym, clinician ID, and inputs.
2. Clinician records one of: `AGREE_WITH_RISK`, `DISAGREE_WITH_RISK`, `OVERRIDE_CLINICAL_REASON`.
3. Audit trail stored immutably in Neon PostgreSQL.
