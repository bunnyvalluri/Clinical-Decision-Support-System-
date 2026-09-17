# AI Audit Trail & Traceability Specification

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. Compliance Mandate

Under HIPAA, FDA CDS Guidance, and EU AI Act Title IV, every AI action that influences patient care or operational configuration must produce an immutable, tamper-evident audit record.

---

## 2. Audit Entities in PostgreSQL

### 1. `AIInteraction`
Records user-facing interactions:
- `id`: Unique UUID.
- `correlation_id`: End-to-end request tracing identifier.
- `patient_id`: Scoped patient encounter.
- `clinician_id`: Requesting user.
- `tools_invoked`: Array of tool execution records with execution latencies.
- `safety_status`: `PASSED`, `FLAGGED`, `SUPPRESSED`.
- `human_reviewed_by` & `human_decision`: Approved, Overridden, or Rejected.

### 2. `AIAgentTrace`
Records granular internal agent actions:
- `agent_run_id`: UUID for the specific agent step.
- `workflow_id`: Parent workflow correlation ID.
- `agent_name` & `agent_version`: Exact agent identity.
- `input_summary`: Redacted summary of input payload.
- `output_summary`: Redacted summary of output generated.
- `latency_ms`: Execution duration.
- `status`: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`.

### 3. `AIApprovalGate`
Tracks human governance decisions:
- `action_type`: `CLINICAL_RECOMMENDATION`, `MODEL_PROMOTION`, `RETRAINING_TRIGGER`.
- `requested_by`: Agent or user ID.
- `decided_by`: Clinician or Administrator ID.
- `decision`: `APPROVED`, `REJECTED`.
- `rationale`: Clinician explanation for audit trail.
- `timestamp`: UTC ISO-8601 string.
