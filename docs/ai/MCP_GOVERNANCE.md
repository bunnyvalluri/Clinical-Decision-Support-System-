# Model Context Protocol (MCP) Governance & Tool Sandboxing

## Overview of MCP in Healthcare

The Model Context Protocol (MCP) enables AI agents to securely connect to external data repositories and execution tools. In the HealthNova platform, MCP provides standardized bridging to hospital clinical data feeds, terminology databases, and medical calculation engines.

Because uncontrolled MCP connections introduce severe attack vectors (Remote Code Execution, Server-Side Request Forgery, data exfiltration), the platform enforces **Strict Default-Deny Sandboxing**.

---

## MCP Gateway Architecture

```
┌─────────────────┐
│   Ruflo Agent   │
└────────┬────────┘
         │ MCP Tool Request (JSON-RPC)
         ▼
┌─────────────────────────────────────────┐
│               MCP Gateway               │
│  ├─ 1. Registry Lookup & Trust Verification
│  ├─ 2. Role & Agent Permission Gate     │
│  ├─ 3. Pydantic Schema Validation       │
│  ├─ 4. Rate Limiting & Egress Firewall  │
│  └─ 5. Immutable Audit Dispatcher       │
└────────┬────────────────────────────────┘
         │ Authenticated & Parameterized Call
         ▼
┌─────────────────────────────────────────┐
│          Approved MCP Server            │
│  ├─ Terminology Server (SNOMED/LOINC)  │
│  ├─ PubMed Clinical Trial Bridge        │
│  └─ Medical Calculator Server (qSOFA)   │
└─────────────────────────────────────────┘
```

---

## MCP Server Registry Specification (`MCPServer`)

All MCP servers must be pre-registered in Neon PostgreSQL:

| Field | Type | Description |
| :--- | :--- | :--- |
| `server_id` | UUID | Unique server identifier |
| `name` | String | Human-readable identifier (e.g. `snomed-terminology-mcp`) |
| `endpoint_url` | String | Internal mTLS or HTTPS endpoint |
| `trust_level` | Enum | `SANDBOXED` (Internal Docker network) or `VERIFIED_EXTERNAL` |
| `allowed_roles` | JSON List | Roles authorized to invoke (`["DOCTOR", "INFORMATICIST"]`) |
| `allowed_agents` | JSON List | Agents permitted to call (`["ClinicalAssistantAgent"]`) |
| `approved_tools` | JSON List | Explicit allowlist of function names |
| `is_active` | Boolean | Kill switch toggle |
| `timeout_seconds` | Integer | Hard execution ceiling (default: 5 seconds) |

---

## Security Policies & Default-Deny Invariants

1. **Unknown Server Block**: Any tool call referencing an unregistered server ID is immediately dropped and flagged as a security event.
2. **Unknown Tool Block**: Even on an approved server, any tool function not present in `approved_tools` is rejected.
3. **No Dynamic Code Generation**: Tools that take raw code strings (`eval`, `exec`, shell scripts) are strictly forbidden.
4. **Credential Isolation**: MCP servers communicate using server-to-server mutual TLS or token authentication stored in environment secrets. Credentials are never revealed to the LLM agent.
5. **Data Minimization & Redaction**: Responses returned by MCP servers pass through the `AISafetyEngine` to redact potential PII/PHI before being fed into agent context.
