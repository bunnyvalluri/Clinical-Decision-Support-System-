# Clinical Safety, Invariants & Deterministic Guardrails — BPY-CSE-2666

## Core Architectural Invariants

HealthNova AI enforces non-negotiable safety guardrails across the entire machine learning inference and decision support pipeline.

```
╔════════════════════════════════════════════════════════════════════════════╗
║ 1. Neon PostgreSQL is the SOLE AUTHORITATIVE SOURCE OF TRUTH.              ║
║ 2. ZERO patient PHI is stored in agent memory or shared vector indices.    ║
║ 3. AI NEVER issues autonomous medical diagnoses or final prescriptions.   ║
║ 4. ALL clinical recommendations require human clinician sign-off.         ║
║ 5. ML metrics (ROC-AUC, F1, Recall) must derive from actual evaluations.   ║
║ 6. Arbitrary shell, raw SQL, and unredacted PHI exports are FORBIDDEN.     ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## Deterministic Clinical Rules Implementation

Implemented in `backend/services/clinical_decision_support_service.py` and persisted in `clinical_rules`:

### 1. qSOFA Sepsis Screening
- **Criteria**:
  - Respiratory Rate $\ge 22$ breaths/min (1 point)
  - Systolic Blood Pressure $\le 100$ mmHg (1 point)
  - Altered Mental Status / Glasgow Coma Scale $< 15$ (1 point)
- **Action**:
  - Score $\ge 2$: Triggers `CRITICAL_EMERGENCY` alert for suspected sepsis.
  - Escalates suggested review urgency to `MANDATORY_STAT`.

### 2. NEWS2 Acute Deterioration Track
- Aggregates multi-parameter physiological deviation (Respiration, SpO2, SBP, Pulse, Temperature, Consciousness).
- Scores $\ge 5$ trigger `HIGH` alert; scores $\ge 7$ mandate emergent clinical escalation.

### 3. Acute Critical Thresholds
- **Severe Hypoxia**: $SpO_2 < 88\%$ forces `CRITICAL` risk status and flags respiratory depression.
- **Hypertensive Crisis**: $SBP \ge 180$ mmHg or $DBP \ge 120$ mmHg flags emergency cardiovascular risk.
- **Severe Tachycardia**: Heart rate $> 130$ bpm.

---

## Machine Learning Abstention Protocol

To prevent hazardous hallucinated or overconfident predictions on ambiguous or out-of-distribution patients:
1. **Shannon Entropy**: Normalized entropy $H_{norm} > 0.85$ triggers abstention.
2. **Probability Margin**: Top-2 margin $M < 0.08$ flags near-uniform classification ambiguity.
3. **Out-of-Distribution Detection**: Unseen physiological vectors flag `ood_status="OUT-OF-DISTRIBUTION"`.
4. **Behavior**: When abstaining, the system renders `is_abstaining=True`, marks status `REVIEW_REQUIRED`, displays an uncertainty alert, and prompts the clinician for manual assessment.

---

## Human-in-the-Loop Clinical Audit

Every clinical prediction lifecycle includes:
- Attending physician review and confirmation.
- Direct capability for clinical override with mandatory documentation of clinical rationale.
- Cryptographically verifiable and immutable PostgreSQL audit trails (`AuditLog`) capturing:
  - User ID and role (DOCTOR, CLINICIAN)
  - Patient ID and Prediction ID
  - Original AI prediction and overridden clinical tier
  - Timestamp and IP address
