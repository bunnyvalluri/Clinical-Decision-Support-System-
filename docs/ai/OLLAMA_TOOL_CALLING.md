# Ollama Tool Calling & Agentic Guardrails

## 1. Overview
Ollama native models (such as `llama3.3:8b`, `qwen2.5:7b`, `mistral:7b`) support tool/function calling. In this clinical system, tool calling is restricted strictly to read-only clinical context fetching and deterministic calculator execution.

## 2. Permitted Allowlisted Tools

| Tool Name | Scope | Authorization Required | Description |
| :--- | :--- | :--- | :--- |
| `get_patient_vitals` | Read-only | `DOCTOR`, `NURSE` | Retrieves recent de-identified vital signs. |
| `calculate_qsofa_score` | Deterministic computation | All clinical roles | Computes qSOFA score based on RR, SBP, and Glasgow Coma Scale. |
| `retrieve_clinical_protocol` | Read-only search | All clinical roles | Retrieves hospital-approved clinical guideline text chunks. |
| `query_lab_history` | Read-only | `DOCTOR` | Fetches de-identified historical lab results. |

## 3. Forbidden Tool Capabilities
- **Direct Database Mutation**: No LLM tool may update, insert, or delete patient medical records directly.
- **Autonomous Prescription / Order Entry**: Tools cannot dispatch medication orders, labs, or radiology orders without clinician sign-off.
- **Raw Shell / SQL Execution**: Completely prohibited.

## 4. Execution Interception & Validation
1. Ollama returns a structured tool call payload (`tool_calls: [...]`).
2. `OllamaToolCallingInterceptor` intercepts the call, validates arguments against Pydantic schemas, verifies RBAC permissions, and checks for abnormal payload sizes.
3. Only upon validation does the backend execute the tool logic and feed the deterministic result back to the model context.
