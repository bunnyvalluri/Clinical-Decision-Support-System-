# Clinical Safety & Decision Support Invariants — BPY-CSE-2666

## Fundamental Invariant
```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║ HealthNova AI IS A CLINICAL DECISION SUPPORT SYSTEM (CDSS).                            ║
║ IT DOES NOT PROVIDE AUTONOMOUS MEDICAL DIAGNOSES, PRESCRIPTIONS, OR THERAPEUTIC ORDERS.║
║ ALL RISK PREDICTIONS REQUIRE HUMAN CLINICIAN ATTESTATION PRIOR TO MEDICAL ACTION.     ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

## Safety Mechanisms & Quality Gates

### 1. Deterministic Rule Overrides
The system executes a deterministic physiological rules engine before displaying ML outputs. Critical vital sign thresholds (such as MAP < 65 mmHg, HR > 150 bpm with systolic BP < 90 mmHg) trigger an immediate escalation to `HIGH` or `CRITICAL` risk regardless of model probabilities.

### 2. Predictive Uncertainty & Clinical Abstention
When an incoming clinical observation is borderline or high-entropy, the model abstains from returning a misleading diagnostic tier.
- If normalized Shannon entropy exceeds `0.85`:
  `is_abstaining = True`
  Status: `REVIEW_REQUIRED`
- Plain-English explanation provided: "Model confidence is insufficient for automated tier classification. Attending physician manual evaluation is required."

### 3. Out-of-Distribution (OOD) Guardrails
Statistical Mahalanobis / z-score distances detect physiological observations diverging from the training manifold. Out-of-distribution records trigger an amber alert chip and reduce confidence scores.

### 4. Immutable Auditability
Every clinical review, concurrence, or override is saved to Neon PostgreSQL with:
- Attending physician user ID
- Action timestamp
- Clinical rationale documentation
- Historical prediction ID
