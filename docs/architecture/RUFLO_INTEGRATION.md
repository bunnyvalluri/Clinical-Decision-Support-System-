# Ruflo Integration Architecture Specification

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Orchestration Harness:** Ruflo v3.42.0 (by `ruvnet`, formerly Claude Flow)  
**Document Version:** 1.0.0 (Production Hardened)

---

## 1. What Ruflo Provides

Ruflo provides a structured **agent meta-harness** that orchestrates specialized AI agents into coordinated swarms with:
- **Hierarchical Swarm Topology**: Governed by a root `coordinator` agent for consensus aggregation and task routing.
- **Strict Policy Decision Point**: Deterministic execution envelopes preventing unbounded loops, recursion, or tool escalation.
- **Isolated Memory Namespaces**: Five segregated partitions (`engineering`, `agent_coordination`, `project_knowledge`, `ai_evaluations`, `clinical_guidelines`).
- **Standardized Event Streaming**: Real-time lifecycle notifications integrated with Django Channels WebSockets.
- **Audit & Provenance Ledger**: Full cryptographic and correlation-tracked execution traces.

---

## 2. Why Ruflo is Integrated

In critical healthcare clinical decision support systems, single-agent or monolithic LLM approaches fail because they:
1. Lack multi-perspective cross-examination (e.g., verifying ML explainability against deterministic clinical protocols).
2. Risk autonomous hallucinated medical diagnoses.
3. Lack formal loops for human-in-the-loop sign-off before actions take effect.
4. Risk context window pollution and PHI data spillage.

Ruflo enables our system to deploy specialized personas—such as `clinical-safety-agent`, `ml-engineer-agent`, `clinical-explainability-agent`, and `healthcare-security-agent`—working in controlled unison under strict policy invariants.

---

## 3. Where Ruflo Operates

Ruflo operates **behind the Django REST API and authorization layer**, as an internal intelligence and engineering orchestration harness:

```
[Next.js 16 UI] ──(JWT Authenticated)──> [Django REST Framework]
                                                   │
                                      (RBAC + Safety Guardrails)
                                                   │
                                                   ▼
                                         [Ruflo Swarm Engine]
                                                   │
                      ┌────────────────────────────┼───────────────────────────┐
                      ▼                            ▼                           ▼
            [Engineering Agents]          [Healthcare Agents]          [Security Agents]
            (Architect, Coder,            (Clinical Safety, ML,       (Sec Architect,
             Tester, Reviewer)             Explainability, MLOps)      Privacy, Auditor)
```

---

## 4. What Ruflo Owns vs. What Ruflo Does NOT Own

| Domain | Owner | Ruflo Responsibility |
| :--- | :--- | :--- |
| **Clinical Records & Patients** | **Neon PostgreSQL** | READ-ONLY via minimized context builders; NEVER stored in agent memory. |
| **ML Risk Prediction** | **Scikit-Learn Pipeline** | Ruflo orchestrates execution and TreeSHAP interpretation; does NOT replace model weights. |
| **Authentication & RBAC** | **Django SimpleJWT** | Ruflo honors caller roles; does NOT issue tokens or bypass permissions. |
| **Realtime Clinical Events** | **Django Channels / Redis** | Ruflo emits structured event payloads into Django Channels. |
| **Background Processing** | **Celery / Redis** | Celery manages asynchronous scheduling; Ruflo manages multi-agent reasoning steps. |
| **Agent Coordination State** | **Ruflo + PostgreSQL** | Tracks tasks, traces, latencies, and consensus outcomes in `agent_tasks` and `ai_agent_traces`. |
| **Agent Memory** | **Ruflo Namespace Store** | Bounded to 5 non-PHI namespaces with TTL retention. |

---

## 5. Security & Data Boundaries

1. **Deny-by-Default Tool Matrix**:
   - `READ_ONLY`: Minimized patient context, vitals trends, guidelines, drift metrics.
   - `CONTROLLED_WRITE`: Agent task creation, human approval submission.
   - `RESTRICTED`: Model promotion, retraining trigger (mandates explicit human approval).
   - `FORBIDDEN`: Raw SQL execution, operating system shell commands, unredacted bulk PHI exports.
2. **Context Minimization**:
   The `ClinicalRiskContextBuilder` extracts only the minimal clinical variables (e.g. latest 5 vitals, age, specific laboratory observations) required for inference, stripping patient names and contact details.
3. **Prompt Injection Defense**:
   All user queries pass through regex and syntactic pattern scanners before entering any agent prompt context.

---

## 6. Failure Behavior & Graceful Degradation

If the Ruflo orchestration service, an agent, or an external LLM becomes unavailable:
- **Core Clinical Operations Continue**: Physicians can view existing patient records, nurses can record vitals, and standard deterministic clinical alerts continue operating.
- **ML Prediction Remains Functional**: Direct Scikit-Learn risk inference executes independently of agent swarms.
- **Honest UI Degradation**: The UI displays `"AI decision support service temporarily unavailable"` with zero fabricated or cached placeholder responses.
