# Security & Threat Model — Cline Agent Integration

> **Standards Compliance**: HIPAA Security Rule § 164.312, ISO 27001, OWASP Top 10 for LLMs  
> **Classification**: Restricted Healthcare Systems  

---

## 1. Threat Mitigation Matrix

| Threat Vector | Mitigation Strategy | Enforcing Layer |
| :--- | :--- | :--- |
| **Indirect Prompt Injection** | Untrusted content wrapped in strict markdown blockades; regex and semantic scan before ingestion. | `AISafetyEngine` + `PromptSanitizer` |
| **Privilege Escalation** | Agent acts strictly on behalf of authenticated user ID; cannot elevate permissions or access unassigned patients. | `ClinePolicyAdapter` + Django RBAC |
| **Data Exfiltration (PHI)** | Automatic regex redaction of SSNs, MRNs, phone numbers, and names prior to LLM submission. | `PHIRedactor` |
| **Arbitrary Shell Execution** | Shell tool disabled for clinical roles; engineering tasks restricted to dev sandbox; production shell forbidden. | `SandboxedExecutionEngine` |
| **Arbitrary SQL Injection** | No raw SQL access; only parameterized, read-only query templates (`ClinicalQueryTool`). | `ClinicalQueryTool` |
| **Runaway Agent Cost/Loops** | Hard token caps, max tool calls per task (default: 10), and identical tool repetition detection. | `ClineSessionService` |
| **SSRF via MCP Servers** | Private network IP blocking, URL scheme restrictions (HTTPS only), domain allowlists. | `ClineMCPServerRegistry` |

---

## 2. Default-Deny Security Invariants

1. **Unknown Tools**: Rejected with `TOOL_NOT_ALLOWLISTED`.
2. **Unknown Roles**: Access blocked with `UNAUTHORIZED_ROLE`.
3. **Secret Files**: Access to `.env`, `.env.production`, `.git`, SSH keys, or cloud credential directories is hard-blocked.
4. **Traversal Attacks**: Path traversal sequences (`../`, `..\`) are stripped and trigger a security alert.
