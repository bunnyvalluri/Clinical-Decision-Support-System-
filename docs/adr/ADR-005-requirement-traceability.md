# ADR-005: Requirement Traceability & Durable Identifiers

**Status**: Accepted  
**Date**: 2026-09-17  
**Deciders**: Principal Software Architect, Senior QA/Test Engineer, Technical Writer  

---

## Context
Complex enterprise systems suffer when requirements are disconnected from actual code, tests, and documentation. When an API changes or a model is updated, determining which requirements are impacted or untested becomes difficult without structured traceability.

---

## Decision
1. Implement durable requirement identifiers across all project artifacts:
   - Functional Requirements: `FR-[DOMAIN]-[SEQ]` (e.g., `FR-PRED-001`, `FR-AI-001`, `FR-DOCTOR-001`)
   - Non-Functional Requirements: `NFR-[DOMAIN]-[SEQ]` (e.g., `NFR-SEC-001`, `NFR-PERF-001`, `NFR-DESIGN-001`)
   - Domain Requirements: `ML-[SEQ]`, `AI-[SEQ]`, `RT-[SEQ]`, `DB-[SEQ]`, `AUDIT-[SEQ]`, `CLINICAL-[SEQ]`
2. Maintain a live **Traceability Matrix** at `specs/TRACEABILITY-MATRIX.md` linking:
   $$\text{Requirement ID} \to \text{Specification} \to \text{Implementation Plan} \to \text{Actionable Task} \to \text{Code Implementation} \to \text{Automated Test} \to \text{Status}$$
3. Reference Requirement IDs in git commit messages, pull request descriptions, and automated test names.

---

## Consequences
- Guarantees complete auditability from clinical requirement to test execution, enabling automated gap detection and regression tracking.
