# Clinical AI Agent Multi-Layer Architecture

## 1. System Topology
The `apps.ai_agents` module operates as a policy-governed hierarchical multi-agent framework integrated with Neon PostgreSQL and Django Channels:

```
+-------------------------------------------------------------------------+
|                        Presentation Tier (Next.js)                      |
|  /doctor/ai-assistant   /nurse/ai-assistant    /user/ai-assistant       |
|  /informaticist/ai-assistant                   /admin/ai-assistant      |
|  (ToolActivityStream, PendingApprovalCard, AgentCitationList, Controls) |
+------------------------------------+------------------------------------+
                                     |
                          REST API + WebSockets
                                     |
+------------------------------------v------------------------------------+
|                      Orchestration & Gateway Layer                      |
|       AIAgentConsumer (ws/ai/agent/) | AgentViewSet (api/v1/ai/agents/) |
|       Finite State Machine Loop: PLAN -> ACT -> OBSERVE -> VALIDATE     |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                         Safety & Governance Tier                        |
|  Prompt Injection Scanner | RBAC/ABAC Gate | Context Minimization       |
|  PHI Firewall             | Human Approval Gate (AgentApproval)         |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                     Inference & Provider Routing                        |
|  Local Ollama (Primary, MedLLaMA-3) | External Cloud (Groq/Gemini)      |
|  Rule: PHI is NEVER routed to external cloud; degrades safely on error  |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                    Authoritative Data Store (Neon)                      |
|  Clinical Records | Predictions | Explanations | Tool Audits | Memory   |
+-------------------------------------------------------------------------+
```

## 2. Invariant Verification
1. **Neon PostgreSQL Authoritative Store**:
   All states (sessions, executions, tool audits, approvals, memories) are persisted in PostgreSQL.
2. **Zero PHI in Unapproved Stores**:
   `AgentMemory` rejects PHI or credentials. Prompts containing patient context are pinned to local Ollama.
3. **No Autonomous Prescriptions**:
   `ValidationService` intercepts any prescriptive language and enforces mandatory clinical disclaimers.
4. **Human-in-the-Loop Sign-Off**:
   Critical actions create `AgentApproval` records and suspend execution until physician sign-off is logged.
5. **Deterministic Boundaries**:
   Resource budgets enforce max 8 iterations, max 10 tool calls, and 60-second timeouts.
