# Cline Controlled Agent Execution Layer — HealthNova AI CDSS

> **Authoritative Specification**: BPY-CSE-2666 Clinical Decision Support System  
> **Pinned Version**: `v3.42.0`  
> **License**: Apache-2.0  
> **Source Repository**: https://github.com/cline/cline.git  

---

## 1. Executive Summary

The Cline Agent Engine provides advanced autonomous task decomposition, multi-agent teamwork, and Model Context Protocol (MCP) tool execution. Within HealthNova CDSS, Cline is deployed strictly as a **CONTROLLED AGENT EXECUTION LAYER** behind the Django AI Gateway.

Cline does **NOT**:
- Diagnose patients autonomously.
- Prescribe medications or therapeutic protocols.
- Modify clinical databases or EHR records directly.
- Execute unrestricted shell commands in production.
- Deploy infrastructure without explicit human-in-the-loop authorization.

---

## 2. Core Operational Primitives

| Primitive | Entity in System | Governance Policy |
| :--- | :--- | :--- |
| **Agent Session** | `ClineAgentSession` | Scoped to authenticated user, role, correlation ID, and token budget |
| **Agent Task** | `ClineAgentTask` | Tracks prompt hash, lifecycle states, retry count, and timeout limits |
| **Agent Event** | `ClineAgentEvent` | Real-time event log emitted over Django Channels (safe summaries only) |
| **Approval Gate** | `ClineAgentApproval` | Required for all medium/high-risk tool requests prior to execution |
| **Tool Sandbox** | `ClineToolRegistry` | Default-deny allowlist with path traversal and secret redaction filters |
| **MCP Gateway** | `ClineMCPServerRegistry` | Domain allowlisting, private network blocking, and schema validation |

---

## 3. Emergency Controls & Observability
- **Emergency Kill Switch**: Administrators can globally suspend all agent execution or terminate running tasks via `/api/v1/ai/cline/kill-switch/`.
- **Runaway Loop Detection**: If an agent requests identical tool operations $> 3$ consecutive times without progress, the task is immediately transitioned to `FAILED` with code `TOOL_LOOP_DETECTED`.
- **Token & Cost Budgets**: Each session enforces maximum token limits and cost thresholds before halting.
