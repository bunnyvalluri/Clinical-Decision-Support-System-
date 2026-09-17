# Clinical Safety Specification

**Spec ID**: `CLINICAL-SPEC-001`  
**Domain**: Clinical Invariants, Deterministic Guardrails, & Human Sign-off  
**Status**: `CONVERGED`  
**Reviewer**: `Clinical Safety Agent`  

---

## 1. Primary Clinical Invariants

1. **Advisory Decision Support Only**:
   - The CDSS is an assistive tool for licensed healthcare providers.
   - Autonomous diagnosis is strictly prohibited: The system MUST NEVER generate definitive medical diagnoses or prescribe treatment plans autonomously.
   - Every risk output is clearly labeled: *"Model prediction indicates elevated physiological risk. Requires independent clinical assessment."*
2. **Mandatory Human-in-the-Loop (HITL)**:
   - High-risk triage flags or critical sepsis/deterioration warnings require explicit clinical sign-off (Physician or Triage Nurse confirmation) in the Neon PostgreSQL database.
3. **Deterministic Clinical Baselines (qSOFA / NEWS2)**:
   - All ML risk outputs are compared against deterministic clinical calculators:
     - **qSOFA** (Quick Sequential Organ Failure Assessment): Respiration >= 22/min, Altered mentation, Systolic BP <= 100 mmHg.
     - **NEWS2** (National Early Warning Score 2): Aggregate score from 6 physiological parameters.
   - If an ML model predicts "Low Risk" but the deterministic qSOFA score is >= 2, the system **MUST OVERRIDE** the ML prediction to `HIGH_RISK_REVIEW_REQUIRED`.

---

## 2. Physiological Guardrails & Abstention Criteria

| Parameter | Valid Physiological Range | Extreme Anomaly Action | Missingness Handling |
| :--- | :--- | :--- | :--- |
| **Systolic BP** | 50 – 250 mmHg | Flag Sensor Anomaly | If missing > 4 hours, mark `DATA_STALE` |
| **Heart Rate** | 30 – 220 bpm | Flag Sensor Anomaly | Mark `INSUFFICIENT_INFORMATION` |
| **Respiratory Rate** | 6 – 60 breaths/min | Flag Sensor Anomaly | Mark `INSUFFICIENT_INFORMATION` |
| **SpO2** | 70 – 100% | Critical Alarm if < 85% | Mark `DATA_INCOMPLETE` |
| **Temperature** | 32.0 – 42.0 °C | Flag Extreme Hypo/Hyperthermia | Forward-fill max 2 hours |

---

## 3. Safe Failure & Degraded States

1. **Model Abstention**:
   When prediction entropy exceeds the approved safety threshold ($\sigma > 0.45$), the system withholds categorical classification and emits `REVIEW_REQUIRED`.
2. **System Outage Fallback**:
   If ML inference workers or AI services fail, the clinician dashboard displays pure deterministic rules (qSOFA/NEWS2) with a clear banner: *"ML decision support offline; showing deterministic physiological scores."*
