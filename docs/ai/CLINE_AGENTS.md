# Agent Profiles & Specialist Roles — Cline Integration

> **Standard**: Least-Privilege Domain Roles  

---

## 1. Specialist Agent Profiles

| Profile Name | Target Audience | Allowed Tools | Maximum Risk Level |
| :--- | :--- | :--- | :--- |
| `CLINICAL_KNOWLEDGE_ASSISTANT` | `DOCTOR`, `NURSE` | `read_clinical_guidelines`, `search_clinical_records` | `LOW` |
| `ML_EXPLAINABILITY_ASSISTANT` | `DOCTOR`, `INFORMATICIST` | `explain_ml_prediction`, `read_clinical_guidelines` | `LOW` |
| `DATA_QUALITY_ANALYST` | `INFORMATICIST` | `read_data_quality_report`, `audit_model_drift` | `MEDIUM` |
| `DOCUMENTATION_AGENT` | `ADMIN`, `INFORMATICIST` | `read_codebase_file`, `write_codebase_draft` | `MEDIUM` |
| `CODE_REVIEWER` | `ADMIN` | `read_codebase_file`, `run_sandboxed_test` | `MEDIUM` |
| `INFRASTRUCTURE_ASSISTANT` | `ADMIN` | `inspect_coolify_status`, `request_deployment` | `HIGH` (Approval Required) |

---

## 2. Invariants Across All Agents
- Agents cannot dynamically modify their own profiles or escalate action levels.
- Subagents spawned by coordinator tasks inherit the parent task's security context and budget.
- Patient users are restricted exclusively to informational, non-diagnostic guidance.
