# Model Context Protocol (MCP) Security & Default-Deny Registry

## 1. Overview
The upstream repository includes MCP servers (such as `mcp-bounty-server` and `mcp-writeup-server`). To prevent unauthorized privilege escalation or command execution, all MCP tools must be registered within `MCPToolRegistry`.

## 2. Policy Enforcement
- **Default DENY**: Unregistered tools or disabled tools reject calls immediately.
- **Allowed Roles**: Each tool explicitly enumerates permitted agent roles (e.g. `REPORT_WRITER` only).
- **Zero Secrets**: Tools never receive raw API keys or external authentication tokens.
- **Data Classification**: Strictly restricted to non-sensitive synthetic test fixtures.
