# ADR-006: Automated Convergence Verification Gates

**Status**: Accepted  
**Date**: 2026-09-17  
**Deciders**: Principal Architect, DevSecOps Lead, Senior QA Engineer  

---

## Context
A chronic failure mode in software engineering is "specification drift"—where the specification documents behavior A, the code implements behavior B, the automated tests assert behavior C, and the user documentation describes behavior D.

---

## Decision
Establish an automated, programmatic **Convergence Gate** via a unified CLI script (`python scripts/converge.py` and `make converge`):
1. **Functional Convergence**: Verifies that all Functional Requirements (`FR-*`) map to implemented code files and passing automated unit/integration tests.
2. **Security Convergence**: Verifies that object-level authorization (`HasPatientAccess`) is enforced, prompt injection barriers are present, and zero PHI is leaked into logs or specs.
3. **Clinical Convergence**: Verifies that clinical predictions include non-diagnostic disclaimers, qSOFA overrides are active, and clinician review models exist.
4. **Data & Architecture Convergence**: Verifies that Neon PostgreSQL is the sole authoritative clinical store and that frontend components strictly enforce the White-Only theme.
5. **Documentation Convergence**: Verifies that specifications, architecture documents, ADRs, and API docs are in complete alignment.

---

## Consequences
- Prevents premature release claims. A feature is only marked `CONVERGED` when the automated convergence script executes and succeeds with 100% verification across all gates.
