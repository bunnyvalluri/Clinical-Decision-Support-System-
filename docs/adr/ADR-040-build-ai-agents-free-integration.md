# ADR-040: Production Integration of Agent-Engineering Patterns into HealthNova AI

## Status
**ACCEPTED** (2026-09-17)

## Context
The goal was to incorporate the agent-engineering architecture demonstrated in `Moh4696/build-ai-agents-free` (tool calling, persistent memory, multi-provider routing/fallback, and unified agent orchestration) into the HealthNova Clinical Decision Support System (`BPY-CSE-2666`).

Medical and clinical AI platforms are bound by strict non-negotiable healthcare safety invariants:
1. **Authoritative Truth**: Neon PostgreSQL is the sole system of record for all clinical facts, patient history, risk predictions, tool audit logs, and approval states.
2. **Zero PHI Egress**: Protected Health Information (PHI) cannot be routed to unapproved external cloud LLM providers or indexed in shared vector stores.
3. **No Autonomous Clinical Prescription**: AI never prescribes medications, alters dosages, or mutates clinical diagnoses autonomously.
4. **Human-in-the-Loop (HITL) Gate**: Critical or high-risk recommendations (e.g. ICU transfers, code escalations) must pause execution until an authenticated clinician signs off with rationale.
5. **No Mock/Synthetic AI Responses**: Telemetry, execution latency, citations, and model metrics must be authentic, not simulated by front-end timers or fake progress bars.

## Decision
We designed and implemented a dedicated Django application `backend/apps/ai_agents/` and corresponding Next.js frontend services and components (`frontend/src/services/ai/`, `frontend/src/components/ai/agent/`):

1. **Neon PostgreSQL Data Layer**:
   - `AgentDefinition`: Configures archetypes, authorized tools, role bindings, and iteration bounds.
   - `AgentSession`: Stateful conversation session scoped to an authenticated user and optional patient MRN.
   - `AgentExecution`: Execution trace recording correlation IDs, iterations, tool call counts, duration, and error codes.
   - `AgentToolDefinition`: Strict schemas, required roles, risk tiers, and approval requirements.
   - `AgentToolExecution`: Immutable audit log recording calling user, patient scope, auth verification, input SHA-256 hash, and latency.
   - `AgentApproval`: Server-side review gate for high-risk recommendations requiring physician or nursing supervisor sign-off.
   - `AgentMemory`: Session and user persistent memory strictly classified (`PUBLIC`, `LOW_SENSITIVITY`, `SENSITIVE`, `PHI`).

2. **Tool Registry & Execution Engine**:
   - Implements 16 real clinical, prediction, RAG, analytics, and diagnostic tools connecting directly to `ClinicalRecord`, `Prediction`, `PredictionExplanation`, and approved literature guidelines.
   - Enforces default-deny RBAC, ABAC patient isolation, and domain allowlists with SSRF firewall on external search.

3. **Multi-Provider Architecture with PHI Firewall**:
   - Primary: Local / on-premise Ollama instance (`medllama3:latest`).
   - Secondary: External cloud provider (Groq / Gemini) permitted ONLY when data classification is verified as `PUBLIC` or `LOW_SENSITIVITY`.
   - Any prompt containing PHI triggers an immediate firewall block preventing external dispatch, switching to safe degraded clinical mode if local inference fails.

4. **Real-Time Operational Streaming**:
   - Django Channels WebSocket consumer (`ws/ai/agent/<session_id>/`) streams live tool traces (`✓ Authorized`, `✓ Completed`, latency ms) directly to the client with zero fake delays.
   - Integrated with Next.js frontend role assistants for Doctor, Nurse, Patient, Informaticist, and Administrator.

## Consequences & Safety Assurances
- Complete transparency: every tool invocation is audited with input hash and latency in Neon PostgreSQL.
- Clinicians retain ultimate decision-making authority via interactive sign-off cards.
- Full compliance with HIPAA, HITECH, and hospital clinical decision support standards.
