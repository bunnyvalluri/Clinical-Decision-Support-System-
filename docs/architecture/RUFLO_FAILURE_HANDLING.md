# Ruflo Failure Handling & Disaster Recovery

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. Resilience Philosophy

In critical healthcare environments, AI system failures must **never** impede clinical operations:
- A failure of an agent or external model must degrade gracefully to deterministic logic.
- Under zero circumstances will the system fabricate responses or mask an error with placeholder claims.

---

## 2. Failure Scenarios and Mitigations

| Failure Mode | Direct Impact | System Mitigation & Fallback |
| :--- | :--- | :--- |
| **Ruflo Agent Timeout (>60s)** | Complex agent workflow terminated | Return deterministic clinical scoring (qSOFA, NEWS2) + direct ML prediction; log timeout alert. |
| **Agent Tool Execution Error** | Subtask cannot complete | Workflow marks subtask `FAILED`, attempts at most 1 controlled retry, then sets workflow status to `REVIEW_REQUIRED`. |
| **External LLM Provider Outage** | Text synthesis unavailable | Return structured clinical findings (table of vitals, rule alerts, ML risk probabilities) without unstructured narrative. |
| **Prompt Injection Detected** | Query rejected | Return 400 Bad Request with `"SAFETY_BLOCKED"` code; log security event to `security_audit_logs`. |
| **Redis / Channel Layer Down** | WebSocket streams unavailable | Frontend gracefully falls back to periodic REST polling for active tasks. |
| **Database Read Failure** | Cannot load patient record | Immediate 500 error; return clinical alert: `"Patient data retrieval failed; please consult direct EHR system."` |

---

## 3. Circuit Breaker Specification

If an agent experiences 3 consecutive failures within 5 minutes:
1. The agent transitions to `CIRCUIT_OPEN` state.
2. Subsequent workflows route around the agent or abort the agentic step directly to deterministic fallback.
3. An administrative alert (`SECURITY_ALERT` or `SERVICE_DEGRADED`) is broadcast via WebSockets to IT Administrators.
4. Auto-reset occurs after a 10-minute cooldown probe period.
