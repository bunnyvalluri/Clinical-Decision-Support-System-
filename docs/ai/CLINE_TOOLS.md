# Tool Registry & Sandboxing Specification — Cline Integration

> **Policy**: Strict Default-Deny Tool Execution Layer  

---

## 1. Tool Classification & Risk Tiers

| Tool Name | Risk Tier | Allowed Roles | Requires Human Sign-Off | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `read_clinical_guidelines` | `LOW` | `DOCTOR`, `NURSE`, `INFORMATICIST`, `ADMIN` | No | Search approved consensus guidelines |
| `search_clinical_records` | `LOW` | `DOCTOR`, `NURSE` | No | Retrieve patient encounters (scoped by patient ID) |
| `explain_ml_prediction` | `LOW` | `DOCTOR`, `INFORMATICIST` | No | Retrieve model prediction and SHAP importances |
| `read_codebase_file` | `MEDIUM` | `INFORMATICIST`, `ADMIN` | No | Read safe files within development workspace |
| `write_codebase_draft` | `MEDIUM` | `ADMIN` | No | Write draft changes into isolated `/scratch` directory |
| `run_sandboxed_test` | `MEDIUM` | `ADMIN` | No | Execute approved test runners (`pytest`, `npm test`) |
| `request_deployment` | `HIGH` | `ADMIN` | **YES** | Propose deployment change to Coolify control plane |
| `run_production_shell` | `CRITICAL` | None | **FORBIDDEN** | Categorically blocked in all environments |
| `execute_arbitrary_sql` | `CRITICAL` | None | **FORBIDDEN** | Categorically blocked in all environments |

---

## 2. Sandbox Execution Constraints
- **File System Boundary**: Allowed exclusively within the designated application workspace (`c:\4-1\scratch` or safe repository paths).
- **Prohibited Extensions & Directories**: `.env`, `.pem`, `.key`, `id_rsa`, `.git`, `node_modules`, `venv`.
- **Timeout**: Enforced maximum execution duration of 10 seconds per individual tool call.
