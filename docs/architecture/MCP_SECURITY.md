# Model Context Protocol (MCP) Security Specification

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. MCP Security Model

Model Context Protocol (MCP) servers allow agents to execute tools against external services. In this healthcare application:
1. **No External Unauthenticated MCP Servers**: Only locally declared and vetted MCP tools within our secure boundary are registered.
2. **Deny-by-Default Policy**: Any tool not explicitly present in `.ruflo/tools.json` with an assigned role is blocked.
3. **Transport Isolation**: Local stdio transport is preferred over open HTTP ports to eliminate network eavesdropping and SSRF vectors.

---

## 2. MCP Tool Allowlist & Restrictions

| Tool Name | Capability | Permitted Callers | Data Classification |
| :--- | :--- | :--- | :--- |
| `get_patient_context` | Read-only demographic context | Doctor, Nurse | CLINICAL |
| `get_clinical_records`| Read-only bounded vitals | Doctor, Nurse | CLINICAL |
| `evaluate_clinical_rules` | Deterministic compute | Doctor, Nurse, Informaticist | INTERNAL |
| `run_risk_prediction` | ML model execution | Doctor, Nurse | CLINICAL |
| `get_prediction_explanation` | TreeSHAP feature extraction | Doctor, Informaticist | CLINICAL |
| `retrieve_approved_knowledge` | Guideline retrieval | All authenticated | PUBLIC |
| `query_drift_metrics` | Drift & PSI calculation | Informaticist, Admin | INTERNAL |
| `request_human_approval`| Approval gate creation | Doctor, Informaticist, Admin | CONFIDENTIAL |
| `promote_model_version` | Model promotion | Informaticist, Admin (Gated) | CONFIDENTIAL |

---

## 3. Permanently Forbidden MCP Capabilities
- Arbitrary operating system command execution (`bash`, `sh`, `cmd.exe`, `powershell`).
- Raw database querying without ORM parameterization (`SELECT *`, `DROP`, `UPDATE`).
- Unrestricted network socket creation or external HTTP scraping.
