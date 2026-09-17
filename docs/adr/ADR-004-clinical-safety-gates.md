# ADR-004: Clinical Safety Verification Gates

**Status**: Accepted  
**Date**: 2026-09-17  
**Deciders**: Senior Healthcare Software Architect, Clinical Informatics Lead, Medical Informaticist  

---

## Context
Deploying ML risk prediction models and AI clinical assistants into inpatient environments carries life-safety implications. An algorithmic prediction must never be misconstrued as a clinical diagnosis or treatment prescription.

---

## Decision
Enforce deterministic clinical safety verification gates across the entire development and runtime lifecycle:
1. **Constitutional Invariant**: AI and ML systems **NEVER** issue autonomous medical diagnoses or prescriptions.
2. **Clinical Decision Support (CDSS) Scope**: All prediction outputs are strictly advisory.
3. **Deterministic Clinical Guardrails**:
   - Algorithmic predictions are audited against deterministic scoring rules (qSOFA, NEWS2).
   - If an ML model predicts Low Risk while deterministic qSOFA $\ge 2$, the system automatically overrides the score to `HIGH_RISK_REVIEW_REQUIRED`.
4. **Mandatory Human Sign-Off**: Actionable patient alerts require an authorized attending clinician to review, evaluate TreeSHAP explanations, and sign off (`AGREED`, `DISAGREED`, `OVERRIDDEN`) in Neon PostgreSQL before affecting clinical care pathways.

---

## Consequences
- Guarantees patient safety, reinforces clinician authority, and eliminates algorithmic opacity.
