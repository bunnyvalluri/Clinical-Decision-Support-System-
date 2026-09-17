# Implementation Plan: Doctor AI Clinical Assistant & RAG

**Feature ID**: `FEAT-AI-002`  
**Branch**: `feat/doctor-ai-assistant` | **Date**: 2026-09-17  
**Spec Reference**: `specs/features/doctor-ai-assistant/spec.md`  
**Status**: `CONVERGED`  

---

## 1. Technical Context & Stack Alignment
- **AI Orchestration**: `backend/apps/ai_orchestrator/` and `backend/apps/ai_agents/`
- **Model Inference**: Ollama local inference runtime / AI Gateway abstraction
- **Knowledge Retrieval**: Meilisearch index `clinical_guidelines`
- **Context Builder**: `ClinicalRiskContextBuilder`
- **Frontend**: `frontend/src/components/ai/DoctorAssistantDrawer.tsx`

---

## 2. Constitution Compliance Verification
- [x] **Clinical Safety**: Pure decision support. No autonomous diagnosis or prescriptions.
- [x] **Zero PHI**: Context minimization enforces de-identified vitals and pseudonymized IDs.
- [x] **Authoritative Store**: Interactions logged to Neon PostgreSQL `ai_interactions`.
- [x] **Prompt Injection Defense**: Multi-tier boundary separation and Pydantic schema validation.
- [x] **White-Only Design**: Strictly light theme design.

---

## 3. Layer Implementation Strategy
1. **Tool Registry**: Implement strict allowlist in `backend/apps/ai_orchestrator/tools.py`.
2. **Safety Boundary**: Implement prompt boundary formatter in `backend/apps/ai_orchestrator/prompts.py`.
3. **API Endpoint**: `POST /api/v1/doctor/assistant/chat/` with streaming and non-streaming responses.
4. **Audit Trail**: Record interaction tokens, latency, tool calls, and model metadata in PostgreSQL.
5. **Frontend**: Accessible, light-themed slide-over drawer with markdown rendering and citation chips.
