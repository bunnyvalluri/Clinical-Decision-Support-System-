# Actionable Tasks: Doctor AI Clinical Assistant & RAG

**Feature ID**: `FEAT-AI-002`  
**Prerequisites**: `spec.md`, `plan.md`  
**Status**: `CONVERGED`  

---

## Phase 1: Persistence & Schema (Neon PostgreSQL)
- [x] **T-DB-001** [FR-AI-001]: Create `AIInteraction` and `AIAgentTrace` models in `backend/apps/ai_agents/models.py` with foreign keys to `auth.User`, session UUIDs, latency metrics, and JSONB tool call logs.
- [x] **T-DB-002** [FR-AI-001]: Apply migration in Neon PostgreSQL.

## Phase 2: Domain Services & Tool Registry (Django REST Framework)
- [x] **T-API-001** [FR-AI-002]: Implement tool execution allowlist in `backend/apps/ai_orchestrator/tools.py` with strict Pydantic input/output validation.
- [x] **T-API-002** [FR-AI-003]: Implement multi-tier prompt injection defense middleware in `backend/apps/ai_orchestrator/security.py`.
- [x] **T-API-003** [FR-AI-004]: Implement Meilisearch RAG retriever in `backend/apps/search/services.py` with citation formatting.
- [x] **T-API-004** [FR-AI-001]: Implement `DoctorAssistantView` in `backend/apps/ai_agents/views.py` handling chat completions.

## Phase 3: Frontend Implementation (Next.js & shadcn/ui)
- [x] **T-FE-001** [FR-AI-001]: Create `DoctorAssistantDrawer` slide-over component in `frontend/src/components/ai/DoctorAssistantDrawer.tsx`.
- [x] **T-FE-002** [NFR-DESIGN-001]: Enforce White/Light theme styling (`bg-white`, `text-slate-900`, `border-slate-200`).
- [x] **T-FE-003** [FR-AI-004]: Render clinical citation badges linking to protocol references.

## Phase 4: Automated Testing & Verification
- [x] **T-TEST-001** [FR-AI-003]: Create prompt injection penetration tests in `backend/apps/ai_orchestrator/tests/test_injection.py`.
- [x] **T-TEST-002** [FR-AI-002]: Create tool allowlist test suite asserting arbitrary tools return default-deny.
- [x] **T-TEST-003** [FR-AI-001]: Create Bruno API collection test in `bruno/ai/doctor_assistant.bru`.
- [x] **T-TEST-004** [NFR-A11Y-001]: Run React Doctor analysis verifying zero accessibility/performance issues.

## Phase 5: Clinical Safety & Convergence Gate
- [x] **T-GATE-001** [CLINICAL-001]: Verify AI Assistant displays persistent non-diagnostic disclaimer.
- [x] **T-GATE-002** [GATE-001]: Execute `python scripts/converge.py` confirming complete convergence.
