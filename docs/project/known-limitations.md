# Known Limitations & Clinical Boundary Guidelines

This document establishes the formal boundaries, statistical caveats, and operational limitations of the Clinical Decision Support System (CDSS) machine learning subsystem.

> [!IMPORTANT]
> **Clinical Non-Autonomous Disclaimer**
> The CDSS is an assistive statistical tool. It **does NOT provide autonomous medical diagnoses**, prescribe medications, or replace the diagnostic judgment of a licensed healthcare practitioner.

---

## 1. Clinical & Operational Boundaries

1. **Non-Autonomous Decision Making**:
   - The ML models output calibrated probabilities and risk tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - Outputs must be interpreted in conjunction with direct bedside examination, patient history, and clinician expertise.
   - Deterministic clinical safety rules (qSOFA, NEWS2, SpO2 limits) automatically escalate low-confidence or high-acuity vitals, overriding statistical predictions.

2. **Uncertainty & Mandatory Abstention**:
   - Predictions with high entropy ($H(p) > 0.85$) or narrow margins ($\Delta p < 0.15$) trigger the directive: *"Prediction requires additional review."*
   - Clinicians are explicitly alerted not to rely on abstained predictions for triage decisions.

3. **Out-of-Distribution (OOD) Operational Envelope**:
   - The OOD detector computes multivariate Mahalanobis distance based on the training cohort covariance.
   - Patients presenting with atypical vital constellations (e.g., severe hypothermia paired with extreme hypertension) or rare pediatric physiological profiles fall outside the validated envelope.
   - OOD alerts mandate immediate bedside assessment without relying on statistical outputs.

---

## 2. Demographic & Fairness Limitations

1. **Cohort Representation**:
   - Models are trained on balanced synthetic multi-encounter cohorts modeled after adult emergency department and inpatient admissions.
   - While demographic parity was confirmed across adult age tiers ($<40, 40-65, 65+$) and gender designations ($>0.80$ disparity ratio), the system has not been validated on pediatric cohorts ($<18$ years) or specialized obstetric populations.

2. **Unmeasured Clinical & Social Confounders**:
   - The feature schema incorporates physiological vitals, basic lab panels, and visit contexts.
   - It does not account for unmeasured social determinants of health (SDOH), historical healthcare access inequities, or institutional referral patterns.

---

## 3. Data Ingestion & Integration Limitations

1. **Biological Constraints & Strict Validation**:
   - Inputs violating biological plausibility (e.g., Heart Rate $<20$ or $>300\text{ bpm}$, $\text{Systolic BP} \le \text{Diastolic BP}$) are rejected at the ingestion boundary with validation errors rather than silently imputed.
2. **EHR Direct Synchronization**:
   - Current release accepts data via secure REST APIs and clinician web UI. Native HL7/FHIR push-socket listeners are slated for future infrastructure releases.
3. **Model Drift & Calibration Decay**:
   - Population health patterns change seasonally and demographically. Calibrated probabilities must be continuously monitored using population stability index (PSI) and Brier scores. Human-in-the-loop review is enforced before any retrained model can be approved for production.
