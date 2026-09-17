# Model Context Protocol (MCP) Governance — Cline Integration

> **Protocol Version**: JSON-RPC 2.0 (Model Context Protocol 2024-11-05 Specification)  

---

## 1. Governance Principles

1. **Default-Deny Registry**: No MCP server can be invoked unless explicitly registered with active status in `ClineMCPServerRegistry`.
2. **SSRF Defenses**: Arbitrary user-supplied URLs are prohibited. MCP endpoints must resolve to approved hostnames or internal microservices; link-local, private subnets (unless container-internal), and AWS metadata IPs (`169.254.169.254`) are blocked.
3. **PHI Classification**: MCP tools handling clinical data require `PHI_CAPABLE` classification and enforce patient ID correlation.
4. **Credential Isolation**: MCP server API keys and tokens are stored encrypted in the backend and never passed to the frontend or LLM context.
