# Clinical Data Governance & Pipeline Integrity — BPY-CSE-2666

> **Standard**: HIPAA Security & Privacy Rule • BPY-CSE-2666 Production ML  
> **Authoritative Store**: Neon PostgreSQL

---

## 1. Zero-Leakage Patient-Level Splitting

In clinical machine learning, naive random record splitting is catastrophic: records from the same patient across hospital visits leaking into both training and validation sets cause severe over-optimistic performance inflation.

### Policy
- **Mandatory Patient Grouping**: All dataset splits MUST use patient-level grouping (`GroupShuffleSplit` or `GroupKFold` grouped strictly on `patient_id`).
- **Zero Cross-Split Contamination**: Automated pipeline verification tests confirm:
  $$\text{Patients}(D_{\text{train}}) \cap \text{Patients}(D_{\text{val}}) \cap \text{Patients}(D_{\text{test}}) = \emptyset$$
- **Temporal Holdout**: For prospective validation, clinical encounters are ordered chronologically; older patient encounters constitute the training cohort and subsequent calendar periods constitute the temporal evaluation cohort.

---

## 2. Biological Plausibility & Data Quality Gates

Clinical data must never be silently imputed or arbitrarily coerced. Records failing biological plausibility are flagged with audit warnings:

| Measurement | Valid Clinical Range | Rejection / Review Criteria |
| :--- | :--- | :--- |
| **Systolic BP** | 70 – 260 mmHg | < 60 or > 280 mmHg (Physiologically incompatible) |
| **Diastolic BP** | 40 – 160 mmHg | Diastolic >= Systolic BP (Contradiction) |
| **Heart Rate** | 30 – 240 bpm | < 25 or > 260 bpm |
| **Oxygen Saturation ($SpO_2$)** | 65% – 100% | < 50% or > 100% |
| **Total Cholesterol** | 80 – 500 mg/dL | < 50 or > 600 mg/dL |
| **Fasting Blood Glucose** | 40 – 600 mg/dL | < 30 or > 700 mg/dL |
| **ST Depression** | 0.0 – 8.0 mm | < 0.0 or > 10.0 mm |

---

## 3. Privacy-Preserving De-Identification & PHI Shield

Before clinical data is transformed into training matrices or evaluation datasets:
1. **Direct Identifier Stripping**: Patient names, medical record numbers (MRN), phone numbers, email addresses, and home addresses are completely excluded from ML feature tensors.
2. **Deterministic Pseudonymization**: `patient_id` UUIDs are hashed or pseudonymized during offline model analysis.
3. **Secret & Credential Scanning**: Automated regex filters detect and eliminate accidental API keys, tokens, or private secrets in telemetry metadata.
