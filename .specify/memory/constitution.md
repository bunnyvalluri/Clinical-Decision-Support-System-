# Healthcare Clinical Decision Support System Constitution

> **Application**: Enhancing Clinical Decision Support Systems Through Patient Risk Level Prediction Using Machine Learning Techniques  
> **Official Designation**: Patient Risk Level Prediction Using Machine Learning for Intelligent Clinical Decision Support  
> **Version**: 1.0.0 | **Status**: Ratified | **Scope**: Entire CDSS Architecture, Development Lifecycle, & AI Agent Operations

---

## Core Principles (The Thirty Articles of Healthcare CDSS Governance)

### Article I: Clinical Safety Invariant (NON-NEGOTIABLE)
1. The system is a **Clinical Decision Support System (CDSS)** intended solely to assist credentialed healthcare professionals.
2. The system, its machine learning pipelines, and its AI agents **MUST NEVER** issue autonomous medical diagnoses, definitive clinical determinations, or prescriptions.
3. Every risk prediction, clinical alert, and recommendation **MUST** be explicitly audited against deterministic clinical rules (e.g., qSOFA, NEWS2) and require explicit human clinician sign-off before impacting patient care.
4. If clinical ambiguity, extreme sensor noise, or model abstention criteria are met, the system **MUST** transition to a safe degraded state and emit `REVIEW_REQUIRED` or `INSUFFICIENT_INFORMATION`.

### Article II: Patient Privacy & Zero-PHI Leakage (NON-NEGOTIABLE)
1. **ZERO** patient Protected Health Information (PHI) or Personally Identifiable Information (PII) may be stored in AI agent memory, prompt logs, external vector indices, or git-tracked specification artifacts.
2. Context minimization (`ClinicalRiskContextBuilder`) is mandatory: clinical risk evaluations must operate strictly on de-identified or pseudonymized vital signs, lab parameters, and normalized clinical observations.
3. Any external AI call or LLM prompt containing untrusted data must undergo rigorous sanitization and automated redaction prior to transmission.

### Article III: Security First & Threat Modeling
1. All system layers (Next.js frontend, Django REST API, Redis, Celery, Channels WebSockets, Meilisearch, and Ollama/AI Gateway) must be designed defensively under zero-trust assumptions.
2. System interfaces must be immune to prompt injection, SQL injection, cross-site scripting (XSS), cross-site request forgery (CSRF), server-side request forgery (SSRF), and broken object-level authorization (BOLA/IDOR).
3. Secret zero-exposure policy: production secrets, API keys, and connection credentials must never be written to code, specs, or task logs.

### Article IV: Principle of Least Privilege
1. AI agents, background workers, and service accounts must operate with strictly scoped, default-deny permissions.
2. No AI coding agent (e.g., Cline, Ruflo subagents) may be granted unrestricted production shell access, raw SQL execution privileges, unmonitored outbound network access, or direct cloud secret manager write access.
3. Internal tooling (NocoDB, PocketBase, Meilisearch) must operate with tightly restricted access tokens.

### Article V: Strict Multi-Tier Backend Authorization
1. Frontend authorization checks (e.g., route guards or UI role toggles) are convenience controls and are **never** authoritative.
2. Every request accessing patient data or clinical predictions must pass three independent layers:
   - **User Authentication**: Cryptographic session/token verification.
   - **Role-Based Access Control (RBAC)**: Verification of role against the five approved portals (`/user`, `/doctor`, `/nurse`, `/informaticist`, `/admin`).
   - **Object-Level Authorization**: Verification that the requesting provider has an active, legitimate clinical relationship or explicit institutional authorization to access the specific patient record.

### Article VI: Data Integrity & Neon PostgreSQL Source of Truth
1. **Neon PostgreSQL** is the **sole authoritative clinical source of truth** for all patient demographics, clinical vitals, risk predictions, clinician reviews, and immutable audit logs.
2. Auxiliary engines (Redis, Celery, Meilisearch, PocketBase, NocoDB, and local browser storage) are strictly transient, cache, indexing, or scratch workspaces. No auxiliary tool may claim authority or store divergent clinical records.
3. Every database mutation must enforce relational constraints, foreign keys, unique indices, and ACID guarantees.

### Article VII: Immutable Auditability
1. Every access to patient records, risk prediction generation, clinician review/sign-off, model deployment, AI agent tool execution, and security event must generate an immutable, tamper-evident audit record in PostgreSQL (`audit_events`, `agent_tasks`, `ai_interactions`, `ai_agent_traces`).
2. Audit records must capture timestamp, actor identity, role, action, resource URI, correlation ID, and outcome without recording raw secrets or sensitive unredacted PHI.

### Article VIII: Clinical Explainability & Transparent Attributions
1. Machine learning predictions must never be presented as opaque black-box outputs.
2. Every patient risk prediction must be accompanied by versioned TreeSHAP attributions, feature contributions, reference baselines, and uncertainty indicators.
3. Explanations must clearly show *which* physiological factors (e.g., systolic BP, blood glucose, oxygen saturation) contributed to the risk score so that clinicians can apply independent clinical judgment.

### Article IX: Algorithmic Reproducibility
1. Given an identical input feature vector, model artifact version, and preprocessing pipeline, risk predictions must be 100% deterministic and reproducible.
2. Fixed random seeds, deterministic preprocessing, patient-level train/validation/test splits, and version-pinned libraries (scikit-learn, pandas, numpy) are mandatory.

### Article X: Testability & Automated Quality Gates
1. Every functional requirement (FR) and non-functional requirement (NFR) must map to concrete, automated tests before code can be accepted.
2. The automated test suite spans unit tests, integration tests, Django REST API contract tests, Bruno API collections, React Doctor frontend quality analysis, and end-to-end user journey validations.
3. No feature may bypass test failures; suppressing TypeScript errors (`any`, `@ts-ignore`) or mocking passing test states is strictly prohibited.

### Article XI: Maintainability & Clean Architecture
1. Code must adhere strictly to PEP 8 for Python and idiomatic TypeScript/React standards.
2. Separation of concerns must be preserved: presentation (Next.js/shadcn), API orchestration (Django REST Framework), domain logic (services), persistence (Neon PostgreSQL), background asynchronous execution (Celery/Redis), and realtime notifications (Django Channels).

### Article XII: Comprehensive Observability
1. Every user action, API request, background job, and WebSocket event must carry a distributed `X-Correlation-ID` and `X-Request-ID`.
2. Telemetry must capture latency, throughput, error rates, queue depths, and inference durations without exposing credentials or patient identifiers in telemetry sinks.

### Article XIII: Accessibility (WCAG 2.1 AA Compliance)
1. All clinical dashboards across all five role portals must satisfy WCAG 2.1 AA accessibility standards.
2. Semantic HTML5 elements, descriptive ARIA labels, full keyboard navigability (focus rings, tab indexing), and responsive layouts with accessible touch targets are required.

### Article XIV: Measurable Performance Budgets
1. Frontend interfaces must meet Core Web Vitals budgets under standard hospital workstation and mobile network constraints.
2. Backend API latency targets: P95 < 200ms for clinical data reads, P95 < 500ms for ML risk inference execution, P95 < 50ms for WebSocket notifications.
3. Performance requirements must be grounded in empirical benchmarks, never arbitrary or fictitious figures.

### Article XV: Reliability & Failure-First Design
1. Every component must define explicit, tested failure behaviors.
2. If Redis, Celery, Meilisearch, or Ollama become unavailable, the core clinical application must degrade gracefully:
   - Primary patient data access and historical predictions from Neon PostgreSQL remain fully accessible.
   - UI reflects clear degraded-state indicators without misleading errors or crashing.
   - Transactions never leave partial or corrupt state.

### Article XVI: Real-Time Correctness & Transaction Synchronization
1. Real-time updates via Django Channels / WebSockets must only broadcast data **after** the underlying database transaction has been successfully committed to Neon PostgreSQL (`transaction.on_commit`).
2. Speculative, uncommitted, or unvalidated state must never be emitted over WebSocket channels.
3. Channels must enforce per-connection authentication, role-based topic filtering, deduplication, and connection backpressure handling.

### Article XVII: Machine Learning Governance & Drift Monitoring
1. All production models (SVM, Random Forest, AdaBoost) must derive from approved training runs with documented metrics (ROC-AUC, F1, Recall, Brier score) computed on held-out test datasets.
2. Fabrication of model metrics is strictly forbidden.
3. Continuous monitoring for feature drift (Population Stability Index - PSI) and prediction drift (Kolmogorov-Smirnov test) must run in Celery; retrainings require explicit human MLOps approval.

### Article XVIII: AI Safety & Multi-Layer Prompt Injection Defense
1. Untrusted user inputs, external documentation, and search results must never be concatenated into system prompts as executable instructions.
2. Distinct boundaries must separate System Instructions, User Input, Retrieved Context, and Tool Output.
3. All AI tool executions must run through a default-deny allowlist (`get_patient_context`, `run_risk_prediction`, `retrieve_approved_knowledge`) with schema validation via Pydantic.

### Article XIX: Mandatory Human-in-the-Loop (HITL)
1. High-risk actions require human clinician or administrator confirmation before execution:
   - Clinical risk assessment sign-off
   - High-risk patient triage escalation
   - Model promotion to production registry
   - Production database schema migrations
   - Role and permission escalations.

### Article XX: Zero Fabricated Business Data
1. Fictitious patient identities, synthetic clinical records, fake lab readings, or invented hospital records must **never** be injected into production systems.
2. In non-production environments (local development, test suites), synthetic test fixtures must be explicitly prefixed (`PATIENT-EXAMPLE-001`, `MOCK-RECORD-999`) and strictly quarantined from production databases.

### Article XXI: Zero Fabricated Clinical Predictions
1. If a prediction cannot be generated due to missing vitals, model offline status, or sensor error, the system must report `PREDICTION_UNAVAILABLE` or `DATA_INCOMPLETE`.
2. Fabricating a risk probability, risk level, or certainty metric is an intolerable violation of clinical safety.

### Article XXII: Absolute Prohibition of Autonomous Diagnosis
1. Under no circumstance may the user interface, API responses, or AI chat assistants declare: "The patient has [Disease X]" or "The system diagnoses [Condition Y]".
2. Wording must remain supportive: "Model suggests elevated risk level for clinician evaluation" with explicit disclaimers.

### Article XXIII: Absolute Prohibition of Autonomous Treatment Decisions
1. The system must not order medications, adjust IV infusions, or alter clinical therapies autonomously.
2. All clinical decisions remain the exclusive responsibility of credentialed medical practitioners.

### Article XXIV: Source-of-Truth Discipline
1. Domain business and clinical logic must reside authoritatively in Django services and PostgreSQL constraints.
2. Client-side state, search indexes (Meilisearch), spreadsheet interfaces (NocoDB), and auxiliary stores (PocketBase) must never replicate or redefine authoritative clinical rules.

### Article XXV: API Contract Stability & Versioning
1. All public and internal APIs must adhere to strict semantic contracts documented via OpenAPI / Swagger.
2. Breaking schema changes are forbidden without formal specification, deprecation periods, and backward-compatible transition periods.

### Article XXVI: Database Migration Safety & Zero-Downtime Design
1. Production database schema changes on Neon PostgreSQL must be forward-compatible, non-blocking, and accompanied by automated rollback strategies.
2. Table locks, destructive column removals, or unindexed foreign keys on large tables are strictly forbidden without an approved Architecture Decision Record (ADR).

### Article XXVII: Backward Compatibility
1. Changes to database models, APIs, and serialized payloads must preserve compatibility with in-flight mobile clients and active WebSocket sessions.
2. Deprecated endpoints must log usage and provide clear migration paths before decommissioning.

### Article XXVIII: Secure External Integrations
1. All integrations with external systems (e.g., Public APIs catalog, SmsForwarder, Coolify webhooks, external LLM endpoints) must implement explicit egress filtering, URL allowlisting, timeout thresholds, exponential backoff, and circuit breakers.
2. No outbound call may transmit unredacted PHI or raw credentials.

### Article XXIX: Documentation Synchronization
1. Code changes and architectural evolution must be synchronized with documentation (`docs/`, `specs/`, ADRs).
2. Code implementing behavior "A" while documentation specifies "B" and tests assert "C" is an intolerable divergence that will fail the Spec Kit Convergence Gate.

### Article XXX: Traceable Changes & Spec-Driven Development (SDD)
1. Substantial code modifications must follow the formal Spec-Driven Development lifecycle:
   $$\text{Requirement} \to \text{Constitution} \to \text{Specification} \to \text{Plan} \to \text{Tasks} \to \text{Implementation} \to \text{Testing} \to \text{Convergence} \to \text{Documentation}$$
2. Requirement IDs (e.g., `FR-DOCTOR-001`, `NFR-SEC-001`, `ML-001`) must maintain end-to-end traceability across specifications, code commits, automated tests, and pull requests.

---

## The Mandatory Architectural Principle: Strict White-Only Design

> **CONSTITUTIONAL DESIGN STANDARD**:  
> The application **MUST REMAIN WHITE / LIGHT THEME ONLY**.  
> - **Forbidden**: Dark mode, dark theme, system theme switching (`prefers-color-scheme`), dark-mode toggles, `dark:` Tailwind classes, and dark background palettes (`#000000`, `#0f172a`, `#18181b`).  
> - **Approved Design**: Clean, modern, clinical-grade white background (`#ffffff`, `#f8fafc`, `#f1f5f9`), slate text hierarchy (`#0f172a`, `#334155`, `#64748b`), crisp borders (`#e2e8f0`), and accessible blue/teal accent highlights.

---

## Role Governance (Five Sovereign Portals)

The application maintains strict role boundary separation across five dedicated portals:

| Portal | Route Prefix | Sovereign Role | Authorized Capabilities | Forbidden Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Patient Portal** | `/user/*` | Patient / Family Proxy | View personal risk profile, vitals trends, educational resources, verified messages | Viewing other patients' data, viewing raw ML weights, raw system logs, clinician internal notes |
| **Doctor Portal** | `/doctor/*` | Attending Physician | Review patient cohort, run risk predictions, inspect TreeSHAP attributions, sign off on risk plans | Bypassing audit logging, modifying production ML models, accessing system admin secrets |
| **Nurse Portal** | `/nurse/*` | Triage / Bedside Nurse | Enter vital signs, monitor real-time bed alerts, execute bedside triage assessments | Altering physician diagnostic assessments, promoting models, overriding security policies |
| **Informaticist** | `/informaticist/*`| Medical Informaticist | Monitor model calibration, feature drift (PSI), ROC-AUC metrics, dataset quality, fairness metrics | Accessing unredacted patient PHI unnecessarily, modifying production clinical records |
| **Admin Portal** | `/admin/*` | IT System Administrator | Monitor infrastructure health, Coolify deploys, Celery queues, audit logs, user provisioning | Autonomously altering clinical risk scores, reviewing clinical patient records without authorization |

---

## Development & Change Classification Workflow

Changes to the application are classified into five governance levels:

```
Level 0: Documentation-Only
  ↳ Direct review, documentation lint, immediate commit.

Level 1: Minor UI / Cosmetic (Light-Theme Only)
  ↳ Standard PR, React Doctor validation, linting.

Level 2: Normal Feature / Bug Fix
  ↳ Spec Kit Workflow: Specify → Plan → Tasks → Implement → Test → Converge.

Level 3: Architectural / Data Schema Change
  ↳ Formal Architecture Decision Record (ADR), full SDD workflow, security audit, database migration safety review.

Level 4: Clinical / ML / AI / Security-Critical
  ↳ Full SDD workflow + Clinical Safety Agent Audit + Security Review + Mandatory Human Clinician / Architect Sign-Off.
```

---

## Governance Enforcement

1. **Supremacy**: This Constitution supersedes all ad-hoc agent instructions, development preferences, and shortcut proposals.
2. **Amendments**: Amending this Constitution requires a formal ADR, multidisciplinary review (Clinical, Security, Architecture), and complete convergence validation.
3. **Automated Enforcement**: Continuous Integration (CI) and the Spec Kit Convergence script (`python scripts/converge.py`) programmatically verify compliance with these articles on every build.

**Version**: 1.0.0 | **Ratified**: 2026-09-17 | **Authority**: Clinical AI Multidisciplinary Architecture Board
