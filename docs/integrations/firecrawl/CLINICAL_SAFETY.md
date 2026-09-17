# Clinical Safety Invariants for Web Intelligence

## 1. Non-Diagnostic Invariant

Retrieved web content is purely informational and serves as research evidence for human clinicians.

```
+-------------------------------------------------------------------------------+
| MANDATORY HEALTHCARE SAFETY INVARIANT                                         |
|                                                                               |
| 1. Web retrieval NEVER issues autonomous medical diagnoses or prescriptions.  |
| 2. Web evidence NEVER overrides deterministic clinical rules (qSOFA, NEWS2).   |
| 3. Web evidence NEVER overrides machine learning patient risk predictions.    |
| 4. ALL clinical actions require human attending clinician sign-off.           |
+-------------------------------------------------------------------------------+
```

---

## 2. Conflicting Evidence & Uncertainty Reporting

When external sources offer conflicting recommendations or contradictory trial results:
- The AI assistant must NOT artificially choose one source as truth.
- The synthesis must explicitly highlight:
  - **Divergence**: Pointing out differing clinical study methodologies or guideline editions.
  - **Source Provenance**: Contrasting publication dates, evidence grades, and sponsoring bodies.
  - **Uncertainty Rating**: Clearly labeling the finding as `CONFUSED` or `REQUIRES_CLINICIAN_EVALUATION`.

---

## 3. Patient Portal Safeguards

Patient-facing educational queries (`/user/education`) are constrained to:
- Plain language summaries derived only from `TIER_1` approved health authorities (CDC, WHO, NIH).
- Prominent non-diagnostic disclaimer:
  *"This information is for general educational purposes only. It is not a medical diagnosis or treatment plan. Please consult your physician regarding any medical symptoms or conditions."*
