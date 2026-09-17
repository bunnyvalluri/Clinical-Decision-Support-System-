# ADR: Controlled Cline Agent Execution Platform Integration

> **Status**: APPROVED  
> **Date**: 2026-09-17  
> **Deciders**: Chief AI Architect, Clinical Safety Officer, DevSecOps Lead, Lead MLOps Engineer  
> **Context**: BPY-CSE-2666 Clinical Decision Support System (Prompt 37)  

---

## 1. Context and Problem Statement

The HealthNova CDSS requires automated software engineering, test generation, MLOps model evaluation, and clinical literature synthesis capabilities. The open-source Cline agent engine (`https://github.com/cline/cline.git`) offers advanced tool calling, multi-agent teamwork, and Model Context Protocol (MCP) integrations.

However, in a regulated healthcare environment, raw, unconstrained autonomous agents pose extreme hazards:
- Hallucinated medical diagnoses or prescriptions.
- Direct unauthorized modifications to patient electronic health records (EHR).
- Arbitrary production shell execution or infrastructure deletion.
- Supply-chain or prompt injection vulnerabilities leaking Protected Health Information (PHI).

How do we integrate Cline's agent execution engine safely and effectively without violating core healthcare invariants?

---

## 2. Decision

We will integrate Cline as a **CONTROLLED AI ENGINEERING & AGENT EXECUTION PLATFORM** strictly behind Django and the AI Gateway:

1. **SDK-First Architecture**: Use `@cline/sdk` and isolated Cline runtime components rather than deploying the full desktop or unrestricted IDE application.
2. **Neon PostgreSQL as Sole Authoritative Store**: Cline possesses no independent clinical state. All sessions, tasks, events, and approvals are persisted in Neon PostgreSQL.
3. **Django as Sole Authorization Authority**: Every agent task acts on behalf of an authenticated Django user. Role-Based Access Control (RBAC) and object-level permissions are validated on every tool execution.
4. **Default-Deny Tool & MCP Governance**: Every tool and MCP server is unregistered by default. Shell access is forbidden for clinical agents and sandboxed for engineering agents. Production shell and arbitrary SQL are categorically denied.
5. **Human-in-the-Loop Sign-off**: Actions with high risk (e.g., Coolify deployment requests, configuration modifications) pause execution in `WAITING_FOR_APPROVAL` until an authorized human signs off.
6. **No Private Chain-of-Thought Streaming**: WebSockets emit only safe, redacted event summaries (`agent_started`, `tool_requested`, `tool_completed`, `agent_completed`).

---

## 3. Consequences

### Positive
- Enables engineering automation (code review, test suite generation, MLOps drift reporting) in isolated sandboxes.
- Prevents clinical hallucination and medical malpractice risks via deterministic safety engines.
- Maintains comprehensive, immutable audit trails of every tool execution and prompt hash.
- Protects production infrastructure through explicit approval gates for Coolify deployment workflows.

### Negative / Trade-offs
- Agent operations have slightly higher latency due to mandatory safety scans, token budgeting, and authorization checks.
- Autonomous remediation of production incidents is prevented; human review is always required.
