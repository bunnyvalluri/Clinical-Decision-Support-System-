# Model Context Protocol (MCP) Governance

Over-permissioned MCP connectors introduce security and autonomy risks. Loop Engineering enforces:
1. **Least Privilege**: MCP connectors default to read-only.
2. **Explicit Scope Allowlisting**: Permitted paths and tools are mapped per agent.
3. **Approval for Write Operations**: Any tool mutating repository state requires human authorization.
4. **Network Restrictions**: Unapproved external HTTP egress is blocked.
