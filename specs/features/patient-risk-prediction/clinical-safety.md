# Clinical Safety Boundaries: Patient Risk Level Prediction

**Feature ID**: `FEAT-PRED-001`  
**Status**: `CONVERGED`  
**Reviewer**: Clinical Safety Agent  

---

## 1. Intended Use & Clinical Population
- **Intended Purpose**: Early identification of physiological deterioration in hospitalized adult patients.
- **Intended Users**: Attending physicians, resident physicians, bedside triage nurses.
- **Contraindications**: Not intended for outpatient home use or pediatric populations without dedicated retrained models.

---

## 2. Safety Invariants & Diagnostic Disclaimer
- **No Autonomous Diagnosis**: The system does not diagnose sepsis, cardiac arrest, or respiratory failure. It produces a statistical risk category reflecting vital sign instability.
- **Mandatory Disclaimer**: Every prediction UI card must render:
  *"Decision support only. Not a diagnostic decision. Independent clinical evaluation required."*
- **Deterministic qSOFA Guardrail**: When clinical criteria for sepsis screening (qSOFA >= 2) are met, the deterministic rule takes precedence over ML model outputs.
