# Healthcare CDSS Specification Index

> **Authoritative Index**: Central registry of all architectural, domain, and feature specifications.

---

## 1. Foundational Governance
- [Constitution](file:///c:/4-1/specs/constitution/CONSTITUTION.md): The Thirty Articles of Healthcare CDSS Governance.
- [Traceability Matrix](file:///c:/4-1/specs/TRACEABILITY-MATRIX.md): End-to-end mapping from Requirement IDs to Code and Tests.
- [Brownfield Gap Report](file:///c:/4-1/docs/spec-kit/BROWNFIELD-GAP-REPORT.md): Gap analysis of existing codebase against SDD requirements.
- [Spec Kit Version & Lifecycle](file:///c:/4-1/docs/spec-kit/VERSION.md): Pinned version (1.0.8.dev0), installation provenance, and upgrade SOP.

---

## 2. Core Domain Specifications

| Domain | Specification Document | Key Invariants Covered | Current Status |
| :--- | :--- | :--- | :--- |
| **Architecture** | [System Architecture](file:///c:/4-1/specs/architecture/SYSTEM-ARCHITECTURE-SPEC.md) | Multi-tier topology, asynchronous Celery, Redis brokers | `CONVERGED` |
| **Clinical** | [Clinical Safety](file:///c:/4-1/specs/clinical/CLINICAL-SAFETY-SPEC.md) | No autonomous diagnosis, qSOFA/NEWS2 guardrails, clinician sign-off | `CONVERGED` |
| **Security & Privacy** | [Security & Privacy](file:///c:/4-1/specs/security/SECURITY-PRIVACY-SPEC.md) | Multi-tier authorization, IDOR defense, Zero-PHI context minimization | `CONVERGED` |
| **Database** | [Neon PostgreSQL](file:///c:/4-1/specs/database/DATABASE-SPEC.md) | Sole clinical truth, non-blocking migrations, relational constraints | `CONVERGED` |
| **Frontend** | [Next.js & UI](file:///c:/4-1/specs/frontend/FRONTEND-SPEC.md) | Strict White-Only design, 5 role portals, WCAG 2.1 AA | `CONVERGED` |
| **Backend** | [Django REST API](file:///c:/4-1/specs/backend/BACKEND-SPEC.md) | Service layer, Pydantic validation, semantic HTTP contracts | `CONVERGED` |
| **Realtime** | [Channels WebSockets](file:///c:/4-1/specs/realtime/REALTIME-CHANNELS-SPEC.md) | Commit-first broadcast (`transaction.on_commit`), topic isolation | `CONVERGED` |
| **Machine Learning** | [ML Governance](file:///c:/4-1/specs/ml/ML-GOVERNANCE-SPEC.md) | SVM, RF, AdaBoost, TreeSHAP attributions, drift monitoring (PSI) | `CONVERGED` |
| **AI & LLM** | [AI Assistant & RAG](file:///c:/4-1/specs/ai/AI-ASSISTANT-RAG-SPEC.md) | Ollama, AI Gateway, prompt injection barriers, tool allowlists | `CONVERGED` |
| **Integrations** | [External & Auxiliary](file:///c:/4-1/specs/integrations/EXTERNAL-INTEGRATIONS-SPEC.md) | Meilisearch RAG, PocketBase scratchpad, NocoDB, SmsForwarder | `CONVERGED` |
| **Web Intelligence** | [Firecrawl Web Intelligence](file:///c:/4-1/specs/integrations/FIRECRAWL-WEB-INTELLIGENCE-SPEC.md) | Controlled Web Crawling, RAG Ingestion, SSRF & Clean Room Boundary | `CONVERGED` |
| **Infrastructure** | [Deployment & SRE](file:///c:/4-1/specs/infrastructure/DEPLOYMENT-INFRA-SPEC.md) | Docker Compose, Coolify, Nginx, zero-downtime rolling deploys | `CONVERGED` |
| **Testing** | [Test Strategy & Gates](file:///c:/4-1/specs/testing/TEST-STRATEGY-SPEC.md) | Test pyramid, Bruno collections, React Doctor, IDOR tests | `CONVERGED` |
| **Operations** | [Operations & Incidents](file:///c:/4-1/specs/operations/OPERATIONS-INCIDENTS-SPEC.md) | Failure recovery, degraded states, immutable incident postmortems | `CONVERGED` |

---

## 3. Active Feature Specifications

### 1. Patient Risk Level Prediction (`FEAT-001`)
*Canonical ML Prediction and Explainability Workflow*
- [Feature Specification (`spec.md`)](file:///c:/4-1/specs/features/patient-risk-prediction/spec.md)
- [Implementation Plan (`plan.md`)](file:///c:/4-1/specs/features/patient-risk-prediction/plan.md)
- [Actionable Tasks (`tasks.md`)](file:///c:/4-1/specs/features/patient-risk-prediction/tasks.md)
- [Acceptance Criteria (`acceptance.md`)](file:///c:/4-1/specs/features/patient-risk-prediction/acceptance.md)
- [Security Requirements (`security.md`)](file:///c:/4-1/specs/features/patient-risk-prediction/security.md)
- [Clinical Safety Boundaries (`clinical-safety.md`)](file:///c:/4-1/specs/features/patient-risk-prediction/clinical-safety.md)
- [Test Plan & Bruno Verification (`test-plan.md`)](file:///c:/4-1/specs/features/patient-risk-prediction/test-plan.md)
- [Changelog (`changelog.md`)](file:///c:/4-1/specs/features/patient-risk-prediction/changelog.md)

### 2. Doctor AI Clinical Assistant (`FEAT-002`)
*Decision Support Assistant with Grounded RAG & Strict Human Oversight*
- [Feature Specification (`spec.md`)](file:///c:/4-1/specs/features/doctor-ai-assistant/spec.md)
- [Implementation Plan (`plan.md`)](file:///c:/4-1/specs/features/doctor-ai-assistant/plan.md)
- [Actionable Tasks (`tasks.md`)](file:///c:/4-1/specs/features/doctor-ai-assistant/tasks.md)
- [Acceptance Criteria (`acceptance.md`)](file:///c:/4-1/specs/features/doctor-ai-assistant/acceptance.md)
- [Security Requirements (`security.md`)](file:///c:/4-1/specs/features/doctor-ai-assistant/security.md)
- [Clinical Safety Boundaries (`clinical-safety.md`)](file:///c:/4-1/specs/features/doctor-ai-assistant/clinical-safety.md)
- [Test Plan & Bruno Verification (`test-plan.md`)](file:///c:/4-1/specs/features/doctor-ai-assistant/test-plan.md)
- [Changelog (`changelog.md`)](file:///c:/4-1/specs/features/doctor-ai-assistant/changelog.md)
