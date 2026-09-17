# Architectural Decision Record: ADR-026 — Ruflo Multi-Agent AI Engineering Orchestration Integration

- **Status**: Accepted
- **Deciders**: Architecture Team, Clinical Safety Board, DevSecOps Council
- **Date**: 2026-09-15
- **Project**: Clinical Decision Support System (BPY-CSE-2666)
- **Component**: Multi-Agent AI Engineering & Clinical Workflow Orchestration Layer

---

## 1. Context and Problem Statement

The clinical decision support system requires advanced AI engineering workflows to support continuous clinical safety verification, explainability analysis (TreeSHAP), MLOps drift monitoring (PSI, KS-test), deterministic clinical protocol scoring (qSOFA, NEWS2), and human-in-the-loop review.

However, standard monolithic LLM integrations risk:
1. **Unbounded Hallucinations**: Autonomous diagnostic claims without grounding in verified medical literature.
2. **Context Bloat & Privacy Violations**: Exposure of full patient records (PHI) across multi-turn prompts.
3. **Autonomous Diagnostic Hazards**: AI attempting to directly diagnose or prescribe without clinician oversight.
4. **Architectural Splintering**: Creation of parallel databases or fragmented state outside of PostgreSQL.

We require a multi-agent AI engineering harness that coordinates specialized personas (safety, explainability, MLOps, architecture) while strictly adhering to enterprise healthcare governance.

---

## 2. Decision: Integrate Ruflo v3.42.0 as an Orchestration Harness

We integrate **Ruflo v3.42.0** (by `ruvnet`, formerly Claude Flow) exclusively as an **orchestration and policy enforcement harness**.

### Architectural Invariants:
1. **Neon PostgreSQL Remains Sole Source of Truth**:
   All patient records, physiological vitals, ML predictions, model artifacts, and audit trails reside exclusively in PostgreSQL. Ruflo **never** maintains an independent database or shadow store for clinical data.
2. **Hierarchical Swarm Topology**:
   Agent coordination follows a hierarchical pattern with a `coordinator` root. Agents communicate via structured, traceable message envelopes.
3. **No Autonomous Clinical Diagnosis**:
   Agents operate strictly in advisory, analytical, and workflow-support roles. Clinical recommendations mandate explicit human sign-off (`AIApprovalGate`).
4. **Isolated Agent Memory**:
   Memory is partitioned into five non-clinical namespaces (`engineering`, `agent_coordination`, `project_knowledge`, `ai_evaluations`, `clinical_guidelines`). **Zero patient PHI is stored in agent memory.**
5. **Tool Least Privilege & Strict Deny-by-Default**:
   Tools are categorized into `READ_ONLY`, `CONTROLLED_WRITE`, `RESTRICTED`, and `FORBIDDEN`. Arbitrary shell access, raw SQL mutations, and unredacted PHI exports are permanently forbidden.
6. **Dual-Role Authorization Gate**:
   Every invocation verifies both the **human user's role** (Patient, Doctor, Nurse, Informaticist, Admin) and the **agent's declared capability**.

---

## 3. Considered Alternatives

| Alternative | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- |
| **Monolithic LLM Endpoint** | Simple to deploy | High hallucination risk, lack of modular safety validation, context window saturation | **Rejected** |
| **Autonomous ReAct Agent Framework** | Highly flexible tool calling | High loop risk, unpredictable token consumption, potential for prompt injection tool abuse | **Rejected** |
| **LangGraph / CrewAI Alone** | Python-native | Lacks integrated CLI harness, self-learning pattern repository, and multi-agent consensus ledger | **Superseded** |
| **Ruflo v3.42.0 Multi-Agent Harness** | Strict policy gates, hierarchical topology, memory namespace segregation, deterministic tool allowlists, comprehensive CLI | Requires strict adapter bridging to Django and PostgreSQL | **Selected** |

---

## 4. Consequences and Mitigations

### Positive Consequences
- **Deterministic Clinical Safety Guardrails**: Independent `clinical-safety-agent` checks all outputs and returns `SAFE`, `REVIEW_REQUIRED`, `UNSAFE`, or `INSUFFICIENT_INFORMATION`.
- **Zero Shadow Data**: Complete auditability stored in Django tables (`agent_tasks`, `ai_agent_traces`, `ai_approval_gates`).
- **Loop Protection**: Built-in safeguards (`maxSteps: 10`, `maxAgents: 6`, `maxRuntimeSeconds: 60`, `maxRetries: 2`).
- **Real-Time Visibility**: Direct integration with Django Channels WebSockets broadcasts lifecycle events to authorized frontends.

### Negative Consequences & Mitigations
- **Network & Computation Latency**:
  *Mitigation*: Parallel agent evaluation where safe; aggressive caching of static clinical guidelines; timeout ceilings (30–60s).
- **Potential Prompt Injection Attack Surface**:
  *Mitigation*: Pre-execution regex and semantic scanning in `SafetyGuardrailService`; context minimization strips untrusted instruction tokens before prompt assembly.
- **Service Dependency / Outage**:
  *Mitigation*: Graceful degradation. If Ruflo is unavailable, clinical record entry, vitals tracking, and deterministic ML predictions continue seamlessly.

---

## 5. Implementation Roadmap
1. `.ruflo/` configuration, agent manifests, and tool permissions.
2. Django `apps.ai_orchestrator` models (`AgentTask`, `AIAgentTrace`, `AIApprovalGate`).
3. Python `RufloSwarmEngine` with hierarchical consensus and context minimization.
4. Django Channels `AIOrchestratorConsumer` with WebSocket streaming at `ws/ai/`.
5. Next.js Admin & Informaticist observability dashboards and Doctor AI assistant live integration.
6. Comprehensive unit, integration, and 5-role security test suites.
