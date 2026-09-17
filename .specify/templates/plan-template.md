# Implementation Plan: [FEATURE NAME]

**Feature ID**: `[FEAT-XXX]`  
**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [specs/features/[feature-name]/spec.md]  
**Change Level**: `Level 0 | Level 1 | Level 2 | Level 3 | Level 4`  
**Status**: `Draft | In Review | Approved | Ready for Tasks`  

---

## 1. Executive Summary & Architectural Scope
[Synthesize the business & clinical objectives from spec.md with the technical strategy and system boundary definition]

---

## 2. Technical Context & Stack Alignment

- **Frontend**: Next.js (App Router), React, TypeScript, shadcn/ui, Tailwind CSS (**White / Light Theme Only**)
- **Backend API**: Python 3.13, Django 5, Django REST Framework, ASGI
- **Authoritative Database**: Neon PostgreSQL (Sole clinical source of truth)
- **Caching & Broker**: Redis
- **Asynchronous Execution**: Celery
- **Realtime Broadcast**: Django Channels (WebSockets)
- **Machine Learning**: scikit-learn, SVM, Random Forest, AdaBoost, TreeSHAP
- **AI & Reasoning**: Ollama (local) / AI Gateway, Pydantic structured output validation
- **Deployment & Infra**: Docker, Docker Compose, Coolify, Nginx
- **Quality & Security**: React Doctor, Bruno API collections, pytest, Jest

---

## 3. Mandatory Constitution Compliance Gate

Before tasks can be generated, this plan MUST verify compliance with the Healthcare CDSS Constitution:

- [ ] **Clinical Safety**: No autonomous diagnosis or prescription. Human clinician sign-off required.
- [ ] **Privacy (Zero PHI)**: De-identified inputs via `ClinicalRiskContextBuilder`. No PHI in logs or prompts.
- [ ] **Authoritative Store**: All state mutations commit to Neon PostgreSQL. No divergent stores.
- [ ] **Multi-Tier Authorization**: Backend enforces User Auth + RBAC + Object-Level Access (`HasPatientAccess`).
- [ ] **Explainability**: ML outputs include TreeSHAP attributions and confidence baselines.
- [ ] **Failure-First**: Tested degradation behavior if Redis, Celery, Channels, or Ollama fail.
- [ ] **White-Only Design**: Zero dark-mode tokens, zero system theme toggles.
- [ ] **No Fabricated Data**: Realistic synthetic test data strictly prefixed `PATIENT-EXAMPLE-*`.

---

## 4. Architectural Breakdown by Layer

### Layer 1: Database Schema & Invariants (Neon PostgreSQL)
- Tables modified/created:
- Constraints, unique indices, foreign key cascades:
- Migration file naming & backward compatibility:
- Lock impact & zero-downtime execution strategy:

### Layer 2: Domain Services & Backend Business Logic (Django)
- Service layer functions (`backend/apps/.../services/`):
- Serializers & input validation (`backend/apps/.../serializers/`):
- Permission classes & Object-level authorization (`backend/apps/.../permissions/`):
- ViewSets / API Views (`backend/apps/.../views/`):

### Layer 3: Realtime & Background Workers (Channels & Celery)
- Celery task signatures, queues, retries, and idempotency:
- WebSocket consumers, routing, and `transaction.on_commit()` broadcast guards:

### Layer 4: Machine Learning & AI Inference (where applicable)
- Model artifact loading and caching:
- Feature vector preprocessing and scaling:
- TreeSHAP explainer execution:
- AI Gateway tool schema definition and safety boundaries:

### Layer 5: User Interface (Next.js / shadcn/ui)
- Target portal: `/user/*` | `/doctor/*` | `/nurse/*` | `/informaticist/*` | `/admin/*`
- Route, Layout, Server/Client boundary:
- Reused shadcn/ui components:
- Loading states (Skeleton), Error boundaries, Empty states:
- Responsive desktop + mobile 5-tab layout:
- Strictly White / Light theme styling:

---

## 5. Test Strategy & Verification Gates

- **Unit Tests**: Django model/service tests, Next.js component unit tests.
- **API Contract Tests**: pytest REST framework test suite with status assertions.
- **Bruno API Collection**: Add requests under `bruno/` verifying headers and payloads.
- **React Doctor Audit**: Run `npx react-doctor` on changed frontend scopes.
- **Security Validation**: IDOR tests, prompt injection filter checks, RBAC boundaries.
- **Convergence Verification**: Pass `python scripts/converge.py`.

---

## 6. Rollback & Contingency Architecture

- Rollback trigger criteria:
- Database reversal script:
- Frontend / Backend deployment rollback command:
