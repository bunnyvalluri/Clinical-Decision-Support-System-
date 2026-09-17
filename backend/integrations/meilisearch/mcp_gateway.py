"""
Model Context Protocol (MCP) Search Gateway.
Exposes read-only, policy-governed search tools for AI agents (Ruflo v3.42.0).
Autonomous mutation, deletion, or settings modifications are strictly forbidden.
"""
import logging
from typing import Any, Dict, List, Optional
from .client import get_meilisearch_client
from .permissions import SearchPolicyService
from .index_manager import INDEX_CONFIGS
from .settings import INDEX_KNOWLEDGE_SOURCES, ALL_INDEXES

logger = logging.getLogger(__name__)


class SearchMCPGateway:
    """Read-only Model Context Protocol tool executor for agentic workflows."""

    ALLOWLISTED_TOOLS = [
        "search_authorized_index",
        "get_search_schema",
        "get_document_by_authorized_id",
        "search_clinical_knowledge",
    ]

    @classmethod
    def list_tools(cls) -> List[Dict[str, Any]]:
        """Return schema descriptors for allowlisted search MCP tools."""
        return [
            {
                "name": "search_authorized_index",
                "description": "Execute a keyword search within an authorized index.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "index_name": {"type": "string", "enum": ALL_INDEXES},
                        "query": {"type": "string", "description": "Search query terms"},
                        "limit": {"type": "integer", "default": 10, "maximum": 20},
                    },
                    "required": ["index_name", "query"],
                },
            },
            {
                "name": "get_search_schema",
                "description": "Retrieve schema attributes and filterable fields for an index.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "index_name": {"type": "string", "enum": ALL_INDEXES},
                    },
                    "required": ["index_name"],
                },
            },
            {
                "name": "get_document_by_authorized_id",
                "description": "Retrieve a single indexed document projection by its ID.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "index_name": {"type": "string", "enum": ALL_INDEXES},
                        "document_id": {"type": "string"},
                    },
                    "required": ["index_name", "document_id"],
                },
            },
            {
                "name": "search_clinical_knowledge",
                "description": "Search approved clinical guidelines, risk calculators, and literature.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "specialty": {"type": "string"},
                    },
                    "required": ["query"],
                },
            },
        ]

    @classmethod
    def execute_tool(
        cls,
        tool_name: str,
        arguments: Dict[str, Any],
        user: Any = None,
        agent_name: str = "ruflo_coordinator",
    ) -> Dict[str, Any]:
        """Execute a validated read-only search MCP tool."""
        if tool_name not in cls.ALLOWLISTED_TOOLS:
            logger.warning("Agent '%s' attempted to invoke forbidden tool '%s'", agent_name, tool_name)
            return {
                "success": False,
                "error": f"Tool '{tool_name}' is not permitted or does not exist.",
            }

        client = get_meilisearch_client()
        raw = client.raw_client

        try:
            if tool_name == "get_search_schema":
                idx_name = arguments.get("index_name")
                cfg = INDEX_CONFIGS.get(idx_name, {})
                return {
                    "success": True,
                    "index_name": idx_name,
                    "schema": {
                        "searchable": cfg.get("searchable_attributes", []),
                        "filterable": cfg.get("filterable_attributes", []),
                        "sortable": cfg.get("sortable_attributes", []),
                    },
                }

            elif tool_name == "search_authorized_index":
                idx_name = arguments.get("index_name", "")
                query = arguments.get("query", "")
                limit = min(int(arguments.get("limit", 10)), 20)

                if user and not SearchPolicyService.can_search_index(user, idx_name):
                    return {
                        "success": False,
                        "error": f"User role is not authorized to search index '{idx_name}'.",
                    }

                mandatory_filters = SearchPolicyService.get_mandatory_filters(user, idx_name) if user else []
                filter_expr = " AND ".join(mandatory_filters) if mandatory_filters else None

                if not client.is_available():
                    from .fallback import PostgresFallbackSearchService
                    fb = PostgresFallbackSearchService.search(user, query, idx_name, limit=limit)
                    return {"success": True, "results": fb.get("hits", []), "mode": "degraded_postgres"}

                idx = raw.index(idx_name)
                search_params = {"limit": limit}
                if filter_expr:
                    search_params["filter"] = filter_expr

                res = idx.search(query, search_params)
                hits = res.get("hits", [])
                if user:
                    hits = [SearchPolicyService.filter_document_fields(user, idx_name, h) for h in hits]

                return {"success": True, "results": hits, "total": res.get("estimatedTotalHits", len(hits))}

            elif tool_name == "get_document_by_authorized_id":
                idx_name = arguments.get("index_name", "")
                doc_id = arguments.get("document_id", "")
                if user and not SearchPolicyService.can_search_index(user, idx_name):
                    return {"success": False, "error": "Unauthorized index."}

                idx = raw.index(idx_name)
                doc = idx.get_document(doc_id)
                if user:
                    doc = SearchPolicyService.filter_document_fields(user, idx_name, dict(doc))
                return {"success": True, "document": doc}

            elif tool_name == "search_clinical_knowledge":
                query = arguments.get("query", "")
                specialty = arguments.get("specialty")
                idx = raw.index(INDEX_KNOWLEDGE_SOURCES)
                search_params: Dict[str, Any] = {"limit": 10}
                if specialty:
                    search_params["filter"] = f'specialty = "{specialty}"'
                res = idx.search(query, search_params)
                return {"success": True, "knowledge_sources": res.get("hits", [])}

        except Exception as exc:
            logger.error("Error executing search MCP tool %s: %s", tool_name, exc)
            return {"success": False, "error": str(exc)}

        return {"success": False, "error": "Unhandled tool execution branch"}
