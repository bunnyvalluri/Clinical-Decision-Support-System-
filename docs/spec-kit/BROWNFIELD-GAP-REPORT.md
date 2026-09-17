# Brownfield Gap Analysis & Remediation Report

**Project**: Enhancing Clinical Decision Support Systems Through Patient Risk Level Prediction Using Machine Learning Techniques  
**Evaluation Date**: 2026-09-17  
**Evaluation Methodology**: Spec Kit Spec-Driven Development Discovery against Brownfield Repository Assets  
**Document**: `docs/spec-kit/BROWNFIELD-GAP-REPORT.md`  

---

## 1. Executive Summary

A comprehensive, truthful audit was conducted across the existing application architecture, source code (`backend/`, `frontend/`, `ml/`), test suites (`pytest`, `bruno/`), and documentation (`docs/`). 

Prior to Prompt 41, the repository contained advanced domain logic, machine learning pipelines, and multi-portal interfaces. However, requirements and clinical safety invariants were fragmented across disparate README and ADR documents without formal traceability or deterministic quality gates.

Integrating GitHub Spec Kit provides the required **engineering governance layer** to remediate these gaps systematically without disrupting existing runtime services.

---

## 2. Prioritized Gap Matrix

| Gap ID | Category | Severity | Description | Remediation Implemented in Prompt 41 | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-001** | Clinical Safety | **CRITICAL** | Absence of formal, machine-verifiable rule enforcing non-diagnostic language and deterministic qSOFA override. | Established Article I & XXII in Constitution; drafted `specs/clinical/CLINICAL-SAFETY-SPEC.md` and deterministic override test suite. | **RESOLVED** |
| **GAP-002** | Security / Auth | **CRITICAL** | Need for explicit object-level authorization (`HasPatientAccess`) verification across all patient detail endpoints to prevent IDOR. | Enforced in Article V; specified in `specs/security/SECURITY-PRIVACY-SPEC.md`; mapped to Bruno tests and DRF test suite. | **RESOLVED** |
| **GAP-003** | Data Invariant | **CRITICAL** | Risk of auxiliary tools (PocketBase, NocoDB, Meilisearch) drifting into secondary sources of truth. | Formalized Neon PostgreSQL as the sole authoritative clinical source of truth in Article VI and `specs/database/DATABASE-SPEC.md`. | **RESOLVED** |
| **GAP-004** | AI Governance | **HIGH** | Lack of formal boundary demarcation between untrusted RAG retrieved context and system instructions. | Designed multi-layer prompt injection defense and tool allowlist in `specs/ai/AI-ASSISTANT-RAG-SPEC.md`. | **RESOLVED** |
| **GAP-005** | UI Design | **HIGH** | Strict requirement for pure White/Light theme must be constitutionally protected against accidental dark mode toggles. | Codified strict White/Light design invariant in Article XX & `specs/frontend/FRONTEND-SPEC.md`; validated by React Doctor. | **RESOLVED** |
| **GAP-006** | Traceability | **HIGH** | Disconnect between feature requests, implementation code, and test suites. | Created `specs/TRACEABILITY-MATRIX.md` establishing bi-directional mapping from `FR-*` to code and tests. | **RESOLVED** |
| **GAP-007** | ML MLOps | **MEDIUM** | Metric documentation lacked structured schema for TreeSHAP baseline values and automated drift alerts. | Standardized `ml-spec-template.md` and `specs/ml/ML-GOVERNANCE-SPEC.md` with PSI drift thresholds. | **RESOLVED** |
| **GAP-008** | Real-Time Sync | **MEDIUM** | Potential race condition if WebSocket broadcast fired before DB transaction finished. | Standardized commit-first rule (`transaction.on_commit()`) in `specs/realtime/REALTIME-CHANNELS-SPEC.md`. | **RESOLVED** |
| **GAP-009** | Documentation | **LOW** | Architectural docs lacked centralized specification index. | Created `specs/INDEX.md` and synchronized `specs/architecture/` with active services. | **RESOLVED** |

---

## 3. Remediation Roadmap & Continuing Governance

1. **Short-Term (Immediate)**:
   - Run `python scripts/validate_specs.py` on every PR.
   - Run `python scripts/converge.py` to gate all Level 2-4 production merges.
2. **Medium-Term**:
   - Gradually back-specify remaining secondary features (notifications, report generation) using the new `spec-template.md`.
3. **Long-Term**:
   - Maintain strict separation: Spec Kit remains developer governance tooling; production application runtime remains 100% independent.
