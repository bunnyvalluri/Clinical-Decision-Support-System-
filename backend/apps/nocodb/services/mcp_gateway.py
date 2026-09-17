"""
NocoDB Model Context Protocol (MCP) Gateway.
Provides deterministic, audited, read-only analytics tool interfaces for AI agents (Ruflo v3.42.0).
"""
from apps.nocodb.models import NocoDBDataset, NocoDBRowRecord
from apps.nocodb.validators import validate_query_safety
from apps.nocodb.services.dataset_service import DatasetService
from apps.nocodb.services.audit_service import log_nocodb_audit_event


ALLOWLISTED_MCP_TOOLS = {
    "nocodb_list_datasets",
    "nocodb_query_dataset",
    "nocodb_get_schema",
    "nocodb_get_drift_metrics",
    "nocodb_get_quality_issues",
}


class NocoDBMCPGateway:
    @staticmethod
    def get_tool_manifest():
        """Returns the MCP tool descriptions for agent discovery."""
        return [
            {
                "name": "nocodb_list_datasets",
                "description": "Lists all accessible analytical datasets in the NocoDB workspace.",
                "parameters": {"type": "object", "properties": {}},
            },
            {
                "name": "nocodb_query_dataset",
                "description": "Queries records from a specified analytical dataset with filtering and pagination.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "dataset_id": {"type": "string", "description": "The dataset slug"},
                        "limit": {"type": "integer", "description": "Row limit (max 50)", "default": 20},
                        "search": {"type": "string", "description": "Search term"},
                    },
                    "required": ["dataset_id"],
                },
            },
            {
                "name": "nocodb_get_drift_metrics",
                "description": "Retrieves feature drift metrics (PSI, KS statistic) from the Feature Drift Ledger.",
                "parameters": {"type": "object", "properties": {}},
            },
            {
                "name": "nocodb_get_quality_issues",
                "description": "Queries open data quality issues and anomalies.",
                "parameters": {"type": "object", "properties": {}},
            },
        ]

    @staticmethod
    def execute_tool(tool_name: str, arguments: dict, user=None, agent_name: str = "ruflo_coordinator"):
        """
        Executes an allowlisted MCP tool call with strict security filters and audit logging.
        """
        if tool_name not in ALLOWLISTED_MCP_TOOLS:
            return {
                "success": False,
                "error": f"Tool '{tool_name}' is not in the allowlisted NocoDB MCP tools.",
            }

        # Query safety validation
        for val in arguments.values():
            if isinstance(val, str):
                validate_query_safety(val)

        res = {}
        dataset_slug = arguments.get("dataset_id", "mcp_gateway")

        if tool_name == "nocodb_list_datasets":
            datasets = NocoDBDataset.objects.filter(is_active=True)
            res = {
                "datasets": [
                    {"slug": d.slug, "title": d.title, "category": d.category, "rows": d.row_count}
                    for d in datasets
                ]
            }

        elif tool_name == "nocodb_query_dataset":
            slug = arguments.get("dataset_id")
            limit = min(int(arguments.get("limit", 20)), 50)
            search = arguments.get("search", "")
            try:
                dataset = NocoDBDataset.objects.get(slug=slug, is_active=True)
                res = DatasetService.query_rows(
                    dataset=dataset,
                    user=user,
                    page=1,
                    page_size=limit,
                    search=search,
                )
            except NocoDBDataset.DoesNotExist:
                return {"success": False, "error": f"Dataset '{slug}' not found."}

        elif tool_name == "nocodb_get_drift_metrics":
            dataset_slug = "feature_drift_ledger"
            rows = NocoDBRowRecord.objects.filter(dataset__slug=dataset_slug, is_archived=False)[:20]
            res = {"drift_records": [r.data for r in rows]}

        elif tool_name == "nocodb_get_quality_issues":
            dataset_slug = "data_quality_queue"
            rows = NocoDBRowRecord.objects.filter(dataset__slug=dataset_slug, is_archived=False)[:20]
            res = {"issues": [r.data for r in rows]}

        # Record immutable audit event
        log_nocodb_audit_event(
            action="MCP_TOOL_INVOCATION",
            dataset_slug=dataset_slug,
            user=user,
            details={
                "tool": tool_name,
                "agent": agent_name,
                "args_keys": list(arguments.keys()),
            },
        )

        return {
            "success": True,
            "tool": tool_name,
            "agent": agent_name,
            "result": res,
        }
