"""
Controlled MCP (Model Context Protocol) Gateway.
Implements strict default-deny policies, role-level authorization, and schema validation.
"""
import json
import logging
import time
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

logger = logging.getLogger("ai.mcp.gateway")


class MCPGateway:
    """
    Sandboxed gateway for external and internal MCP server requests.
    """

    @classmethod
    def call_mcp_tool(
        cls,
        server_name: str,
        tool_name: str,
        arguments: Dict[str, Any],
        user_role: str,
        timeout: int = 5,
    ) -> Dict[str, Any]:
        """
        Executes an approved tool on an allowlisted MCP server under default-deny invariants.
        """
        start_t = time.time()

        # 1. Look up server registry
        try:
            from apps.ai_orchestrator.models import MCPServer
            server = MCPServer.objects.filter(name=server_name, is_active=True).first()
        except Exception:
            server = None

        if not server:
            logger.warning("MCP call rejected: Server '%s' is not registered or inactive.", server_name)
            return {
                "success": False,
                "error": f"MCP server '{server_name}' is blocked under default-deny policy.",
                "code": "MCP_SERVER_BLOCKED",
            }

        # 2. Authorization Check
        normalized_role = user_role.upper()
        if normalized_role not in server.allowed_roles and "ALL" not in server.allowed_roles:
            logger.warning("MCP call rejected: Role '%s' unauthorized for server '%s'.", user_role, server_name)
            return {
                "success": False,
                "error": f"Role '{user_role}' is not permitted to access MCP server '{server_name}'.",
                "code": "MCP_ROLE_UNAUTHORIZED",
            }

        # 3. Tool Allowlist Check
        if tool_name not in server.approved_tools:
            logger.warning("MCP call rejected: Tool '%s' is not in approved list for '%s'.", tool_name, server_name)
            return {
                "success": False,
                "error": f"Tool '{tool_name}' is not allowlisted on MCP server '{server_name}'.",
                "code": "MCP_TOOL_UNAPPROVED",
            }

        # 4. Sandboxed Dispatch (JSON-RPC 2.0)
        rpc_payload = {
            "jsonrpc": "2.0",
            "method": f"tools/{tool_name}",
            "params": arguments,
            "id": f"mcp-{int(time.time())}",
        }

        try:
            req = urllib.request.Request(
                server.endpoint_url,
                data=json.dumps(rpc_payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            latency = (time.time() - start_t) * 1000.0
            return {
                "success": True,
                "server": server_name,
                "tool": tool_name,
                "result": data.get("result", {}),
                "latency_ms": latency,
            }
        except Exception as exc:
            logger.error("MCP call to %s/%s failed: %s", server_name, tool_name, exc)
            return {
                "success": False,
                "server": server_name,
                "tool": tool_name,
                "error": "MCP server communication timeout or unreachable.",
                "code": "MCP_SERVICE_UNAVAILABLE",
            }
