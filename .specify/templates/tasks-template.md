# Tasks: [FEATURE NAME]

**Feature ID**: `[FEAT-XXX]`  
**Branch**: `[###-feature-name]` | **Date**: [DATE]  
**Prerequisites**: `spec.md` (required), `plan.md` (required)  
**Governing Standard**: Healthcare CDSS Constitution (`.specify/memory/constitution.md`)  

---

## Task Format & Conventions
- **Task ID Format**: `T-[DOMAIN]-[SEQ]` (e.g., `T-DB-001`, `T-API-001`, `T-FE-001`, `T-TEST-001`, `T-GATE-001`)
- **[P] Tag**: Task can be safely executed in parallel (independent files, no conflicting migrations)
- **Requirement Traceability**: Each task MUST reference its source Requirement ID (e.g., `[FR-DOCTOR-001]`)
- **File Reference**: Explicit file paths MUST be specified for every task

---

## Phase 1: Data Model & Persistence (Neon PostgreSQL)
*Authoritative store invariants, migrations, constraints, and relational integrity.*

- [ ] **T-DB-001** [FR-XXX]: Define Django model schema in `backend/apps/[app]/models.py` with foreign keys, relational constraints, and audit fields.
- [ ] **T-DB-002** [FR-XXX]: Generate and verify non-blocking backward-compatible migration in `backend/apps/[app]/migrations/`.
- [ ] **T-DB-003** [P] [FR-XXX]: Register audit signal handlers in `backend/apps/audit/signals.py` for immutable event logging.

---

## Phase 2: Domain Services & Backend API (Django REST Framework)
*Business logic, object-level authorization, validation, and RESTful endpoints.*

- [ ] **T-API-001** [FR-XXX]: Implement domain service in `backend/apps/[app]/services/` enforcing clinical business rules.
- [ ] **T-API-002** [FR-XXX]: Implement DRF serializers in `backend/apps/[app]/serializers/` with strict Pydantic/DRF input validation.
- [ ] **T-API-003** [NFR-SEC-001]: Implement object-level authorization permission class (`HasPatientAccess`) in `backend/apps/[app]/permissions.py`.
- [ ] **T-API-004** [FR-XXX]: Implement API ViewSet in `backend/apps/[app]/views.py` and register URL routes in `backend/apps/[app]/urls.py`.

---

## Phase 3: ML Pipeline, Realtime Broadcast, & Celery Tasks
*Asynchronous workloads, model inference, TreeSHAP explainer, and WebSocket synchronization.*

- [ ] **T-ML-001** [ML-XXX]: Implement or wrap model inference pipeline in `backend/apps/ml/` with TreeSHAP attributions and abstention thresholds.
- [ ] **T-RT-001** [RT-XXX]: Implement WebSocket consumer in `backend/apps/realtime/consumers.py` with session auth and topic isolation.
- [ ] **T-RT-002** [RT-XXX]: Attach `transaction.on_commit()` signal in service layer to broadcast event only after Neon PostgreSQL commit.
- [ ] **T-BG-001** [P] [FR-XXX]: Implement idempotent Celery background task in `backend/apps/[app]/tasks.py` with retry limits.

---

## Phase 4: Frontend Implementation (Next.js & shadcn/ui)
*Accessible, responsive, White-Only UI across the five sovereign portals.*

- [ ] **T-FE-001** [FR-XXX]: Create or update portal route and layout in `frontend/src/app/(portal)/[route]/page.tsx`.
- [ ] **T-FE-002** [NFR-DESIGN-001]: Implement UI components using approved shadcn/ui primitives enforcing **White / Light Theme Only** (`#ffffff`, `#f8fafc`, `#0f172a`).
- [ ] **T-FE-003** [FR-XXX]: Implement client state management, error boundaries, loading skeletons, and empty state handlers.
- [ ] **T-FE-004** [RT-XXX]: Integrate WebSocket client hook with reconnect jitter and graceful REST polling fallback.

---

## Phase 5: Automated Testing & Verification
*Comprehensive test pyramid, security audits, and frontend quality analysis.*

- [ ] **T-TEST-001** [FR-XXX]: Write unit and service tests in `backend/apps/[app]/tests/test_services.py`.
- [ ] **T-TEST-002** [NFR-SEC-001]: Write object-level authorization / IDOR penetration tests in `backend/apps/[app]/tests/test_permissions.py`.
- [ ] **T-TEST-003** [FR-XXX]: Create Bruno API collection test file in `bruno/[feature].bru` asserting 200/400/403 responses.
- [ ] **T-TEST-004** [NFR-A11Y-001]: Run React Doctor analysis on modified frontend code (`npx react-doctor`) and resolve all warnings.

---

## Phase 6: Clinical Safety Review & Convergence Gate
*Final governance gate before merge or release.*

- [ ] **T-GATE-001** [CLINICAL-XXX]: Clinical Safety Agent audit: verify no autonomous diagnosis, verify qSOFA/NEWS2 compliance, verify clinician sign-off requirement.
- [ ] **T-GATE-002** [DOC-XXX]: Synchronize architecture docs, API documentation, and changelog in `specs/features/[feature]/changelog.md`.
- [ ] **T-GATE-003** [GATE-XXX]: Execute Spec Kit Convergence script (`python scripts/converge.py`) and verify 100% convergence across Functional, Security, Clinical, Data, and Doc gates.
