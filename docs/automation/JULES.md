# Google Jules API Integration for Engineering Automation

## Overview

HealthNova AI integrates the **Google Jules REST API** (`https://jules.googleapis.com/v1alpha`) as a policy-governed engineering automation and automated remediation subsystem.

Jules acts as an automated coding and debugging agent for:
- Automated bug remediation and CI/CD test failure analysis
- Code review assistance and lint/TypeScript error resolution
- Dependency patch planning and security vulnerability remediations
- Performance bottleneck optimization and refactoring

```
                                  HEALTHNOVA AI ARCHITECTURE
                                  
   +------------------+         +----------------------------+
   |   CI/CD Runner   | ------> |  Webhook Receiver (HMAC)   |
   | (GitHub Actions) |         +----------------------------+
   +------------------+                       |
                                              v
   +------------------+         +----------------------------+         +---------------------------+
   |   IT Admin UI    | ------> |  Jules Remediation Service | ------> |     Google Jules API      |
   | (/admin/jules)   |         |   (Branch/Path Policy)     |         | (jules.googleapis.com)    |
   +------------------+         +----------------------------+         +---------------------------+
                                              |                                      |
                                              v                                      v
                                +----------------------------+         +---------------------------+
                                |      Neon PostgreSQL       | <------ | Activity & Artifact Pull  |
                                |  (Authoritative Audit DB)  |         +---------------------------+
                                +----------------------------+
```

---

## Strict Invariants & Clinical Boundary

1. **Strict Non-Clinical Boundary**:
   Google Jules is restricted **exclusively** to software engineering tasks. It has:
   - ZERO access to patient data, EHRs, clinical vitals, or protected health information (PHI).
   - ZERO authorization to modify machine learning weights, clinical decision score thresholds (qSOFA, NEWS2), or diagnostic logic.
   - Any prompt or request attempting to route clinical diagnoses or patient triage through Jules is rejected immediately by the sanitization and policy layer.

2. **Backend-Only Secret Isolation**:
   - `JULES_API_KEY` is loaded exclusively in the Django backend (`backend/integrations/jules/config.py`).
   - ZERO exposure via `NEXT_PUBLIC_*` variables, client JavaScript bundles, or browser localStorage.
   - Frontend components communicate with Jules only through authenticated Django REST endpoints (`/api/v1/automation/jules/*`).

3. **Authoritative Neon PostgreSQL Store**:
   - Every source, session, activity, artifact, remediation job, and human approval is persisted in Neon PostgreSQL.
   - Ephemeral memory is never relied upon for state machine transitions.

4. **Dual-Custody Governance**:
   - By default, `JULES_REQUIRE_PLAN_APPROVAL=true`.
   - When Jules finishes generating an implementation plan, the remediation job enters state `PLAN_PENDING_APPROVAL`.
   - An authorized IT Admin or DevOps engineer must review the plan and provide audit rationale before execution commences.

5. **Branch & Repository Policy Enforcement**:
   - Direct pushes or modifications to protected branches (`main`, `master`, `production`, `release/*`) are strictly blocked.
   - Remediation work is isolated to feature branches (e.g. `jules/fix-ci-761482`).

---

## Core Capabilities

### 1. Automated CI/CD Failure Remediation
When a CI pipeline or test runner fails, the failure log is sanitized of credentials and sensitive tokens, categorized (e.g., `BUILD_FAILURE`, `TYPESCRIPT_ERROR`, `DJANGO_ERROR`), and submitted to Jules with strict constraints.

### 2. Live Session Streaming & Activity Feed
Admins can track Jules's multi-step thoughts, plan generation, bash executions, and code diffs in real time via Django Channels WebSockets (`/ws/automation/jules/`).

### 3. Circuit Breaker & Resilience
`JulesCircuitBreaker` monitors consecutive API failures (default threshold: 5). If Google Jules API experiences an outage, the circuit opens, preventing request pileups and graceful degradation to manual developer alerts.

### 4. Comprehensive Audit Trail
All actions (source sync, session start, message dispatch, plan approval, job cancellation) produce immutable audit records in `jules_audit_events`.
