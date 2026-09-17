# NocoDB Model Context Protocol (MCP) Gateway

> **HealthNova AI — Clinical Decision Support System (BPY-CSE-2666)**  
> **Protocol:** Model Context Protocol (MCP) v1.0 | **Governor:** Ruflo v3.42.0

---

## 1. Overview & Policy Guardrails

The NocoDB MCP Gateway enables AI Agents (e.g. Ruflo Clinical Safety Agent, ML Engineer Agent, MLOps Agent) to query controlled analytical datasets through a deterministic, strictly audited interface.

### Guardrails:
1. **Read-Only by Default:** All tools default to read-only queries. Mutation tools require explicit elevated role tokens.
2. **Strict Tool Allowlist:** Agents can only invoke allowlisted tools:
   - `nocodb_list_datasets`: List available analytical datasets.
   - `nocodb_query_dataset`: Query records with structured filters (limit max 50).
   - `nocodb_get_schema`: Retrieve column definitions and types.
   - `nocodb_get_drift_metrics`: Fetch current feature drift summaries.
   - `nocodb_get_quality_issues`: Query open data quality anomalies.
3. **Prompt Injection Defense:** Search queries and filter parameters pass through regex and semantic prompt injection sanitizers. SQL keywords (`UNION`, `SELECT`, `DROP`, `--`, `/*`) in filter values are rejected.
4. **Immutable MCP Audit Trail:** All tool calls, input arguments, and truncated response summaries are logged to `NocoDBAuditEvent` with `action='MCP_TOOL_INVOCATION'`.

---

## 2. Tool Manifest

```json
[
  {
    "name": "nocodb_list_datasets",
    "description": "Lists all accessible analytical datasets in the NocoDB workspace.",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "nocodb_query_dataset",
    "description": "Queries records from a specified analytical dataset with filtering and pagination.",
    "parameters": {
      "type": "object",
      "properties": {
        "dataset_id": {"type": "string", "description": "The dataset identifier"},
        "limit": {"type": "integer", "description": "Number of rows (max 50)", "default": 20},
        "sort": {"type": "string", "description": "Column name to sort by"},
        "filters": {"type": "object", "description": "Column-value filter pairs"}
      },
      "required": ["dataset_id"]
    }
  },
  {
    "name": "nocodb_get_drift_metrics",
    "description": "Retrieves feature drift metrics (PSI, KS statistic) from the Feature Drift Ledger.",
    "parameters": {
      "type": "object",
      "properties": {
        "feature_name": {"type": "string", "description": "Optional specific feature filter"}
      },
      "required": []
    }
  }
]
```
