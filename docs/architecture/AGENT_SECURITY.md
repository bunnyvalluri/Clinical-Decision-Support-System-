# Agent Security & Guardrails Specification

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. Zero-Trust Agent Boundary

All internal and external agent components are treated as unverified boundaries:
1. **Agent Calls Are Authenticated**: Every agent invocation carries a JWT-derived user identity and a distinct agent signature.
2. **Tools Are Sandboxed**: Tools execute within strict parameter validation boundaries with explicit timeouts and rate limits.
3. **Outputs Are Validated**: Agent responses must pass structural JSON schema verification and post-execution guardrail checks before presentation to clinicians.

---

## 2. Prompt Injection Defense Architecture

Both direct and indirect prompt injections are mitigated through a multi-tiered pipeline:

```
User / Document Query
         │
         ▼
[1. Syntactic Token Filter] ─── Pattern Match? ──> [Reject with 400 SAFETY_BLOCKED]
         │ (Clean)
         ▼
[2. Context Minimization]   ─── Strip Untrusted Formatting / Delimiters
         │
         ▼
[3. System Prompt Boundary] ─── Immutable System Instructions (Enclosed in XML tags)
         │
         ▼
[4. Post-Execution Filter]  ─── Detect Hallucinated Authority / Dangerous Prescriptions
```

### Monitored Injection Vectors:
- System prompt escape sequences (`"ignore previous instructions"`).
- Persona subversion (`"you are now DAN"` or `"developer mode"`).
- SQL injection tokens (`"DROP TABLE"`, `"OR 1=1"`).
- Script/HTML injection (`<script>`, `javascript:`).
- Malicious indirect injection in unstructured clinician notes.

---

## 3. Tool Authorization Matrix

| Category | Permitted Tools | Access Policy | Human Sign-Off |
| :--- | :--- | :--- | :--- |
| **READ_ONLY** | `get_patient_context`, `get_clinical_records`, `retrieve_approved_knowledge` | Scoped by role + patient assignment | No |
| **CONTROLLED_WRITE**| `create_agent_task`, `request_human_approval` | Doctors, Informaticists, Admins | No |
| **RESTRICTED** | `promote_model_version`, `execute_model_retraining` | Informaticist + Admin Only | **Yes (Mandatory Gate)** |
| **FORBIDDEN** | `execute_raw_sql`, `execute_arbitrary_shell`, `export_unredacted_phi` | Completely disabled | N/A (Hard Denied) |

---

## 4. Loop & Denial-of-Service Protection

To prevent recursive agent invocations or runaway token burn:
- `maxSteps`: 10 steps maximum per workflow.
- `maxAgents`: At most 6 active agents per workflow.
- `maxRuntimeSeconds`: 60 seconds hard execution ceiling.
- `maxTotalToolCalls`: 15 tool executions per workflow.
- `circuitBreaker`: If an agent fails twice consecutively, the workflow enters `FAILED` and falls back to deterministic logic.
