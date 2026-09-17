# Architecture Decision Record (ADR): Bruno Integration

**Date**: 2026-09-17  
**Status**: Accepted  
**Deciders**: Senior Architecture Team, DevSecOps, Healthcare Informatics, API Engineering  
**Context**: Prompt 35 — Integration of Bruno into BPY-CSE-2666 Clinical Decision Support System

---

## 1. Context and Problem Statement

The HealthNova AI CDSS application exposes critical, high-stakes REST endpoints spanning patient demographics, clinical vitals, ML risk predictions (SVM, Random Forest, AdaBoost), SHAP explainability, multi-agent AI orchestration (Ruflo), NocoDB analytics, Meilisearch fast projections, and security audits.

Prior to this integration, API testing was fragmented between individual unit tests and manual curl scripts. The engineering team required an enterprise-grade, Git-native, collaborative API platform that could:
1. Provide plain-text, version-controlled API request collections stored directly in the repository.
2. Execute automated contract and regression tests in CI/CD pipelines.
3. Rigorously test the 5-Role RBAC model (Doctor, Nurse, Informaticist, IT Admin, Patient) and detect Insecure Direct Object References (IDOR).
4. Strictly forbid cloud sync or vendor lock-in that might risk exposing clinical endpoints or secrets to third parties.

---

## 2. Decision Drivers

1. **Git-Native Storage**: Collections must live alongside application source code in `.bru` plain-text files to enable code reviews and branch workflows.
2. **Security & Data Privacy**: Zero PHI and zero secrets committed to Git; Safe Mode sandboxing enforced by default in CLI runners.
3. **Deterministic Contract Testing**: Ability to validate HTTP response codes, JSON schemas, required attributes, and error envelopes.
4. **No Desktop Embedding**: Avoid embedding heavy Electron UI into the clinical Next.js frontend.
5. **No Production Destructive Tests**: Strict guardrails preventing destructive updates or deletes against production targets.

---

## 3. Considered Options

1. **Postman Cloud**: Rejected due to cloud synchronization requirements, potential PHI exposure risks, and opaque binary collection exports.
2. **Insomnia**: Rejected due to account-based cloud sync enforcement and heavier footprint.
3. **Custom Python / Pytest Scripts Only**: While necessary for backend unit tests, Python scripts alone lack a standardized declarative format for cross-functional API exploration by frontend engineers and DevOps.
4. **Bruno**: **Selected**. Completely offline-first, Git-native, declarative `.bru` markup, active MIT open-source ecosystem, default Safe Mode sandbox in CLI 3.x+, and lightweight headless CLI (`bru run`).

---

## 4. Architectural Rules & Invariants

1. **Neon PostgreSQL Remains Authoritative**: Bruno is strictly a client and test framework. All writes pass through Django authorization and business logic.
2. **Safe Mode Default**: All automated executions (`bru run`) run with `--sandbox=safe`. Developer sandbox mode is disabled unless explicitly justified.
3. **No Fake Endpoints**: Bruno collections map 1:1 to genuine Django REST Framework endpoints in `backend/config/urls.py`. Missing endpoints are marked `NOT IMPLEMENTED`.
4. **Zero Secrets in Git**: Sensitive tokens and passwords are gitignored and supplied dynamically via environment variables or CI secrets.
5. **Synthetic Test Data Only**: All fixtures use synthetic IDs and values marked `TEST_ONLY`. Real patient data is prohibited.

---

## 5. Consequences

### Positive
- Unified, readable API specifications co-located with code in `bruno/`.
- Automated regression gates in CI/CD preventing unauthorized schema breaks.
- Comprehensive 5-Role RBAC and IDOR validation on every build.
- Clean separation between developer tooling and production clinical runtime.

### Negative / Trade-offs
- Developers must maintain `.bru` files when API schemas evolve (mitigated by automated CI drift detection).
- WebSockets require dedicated Django Channels tests, as Bruno is primarily oriented toward HTTP/REST request workflows.
