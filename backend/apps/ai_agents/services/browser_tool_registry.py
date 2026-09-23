"""
Controlled Browser Agent Tool Registry.

Defines the strict allowlist of browser automation tools.
Arbitrary browser execution, custom JS injection, or OS shell access are strictly FORBIDDEN.
Every tool possesses an explicit risk rating, permission requirement, and schema.
"""
from typing import Any, Dict, List, Optional
from apps.ai_agents.models import DataClassification, ToolRiskLevel


BROWSER_CONTROLLED_TOOLS: Dict[str, Dict[str, Any]] = {
    "BROWSER_OPEN_APPROVED_SITE": {
        "tool_id": "BROWSER_OPEN_APPROVED_SITE",
        "name": "Open Approved Site",
        "description": "Navigate the browser harness to an allowlisted destination URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "format": "uri"},
                "timeout_ms": {"type": "integer", "default": 15000},
            },
            "required": ["url"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "current_url": {"type": "string"},
                "title": {"type": "string"},
                "status_code": {"type": "integer"},
            },
        },
        "permission_requirement": "can_execute_browser_tasks",
        "allowed_roles": ["ADMIN", "INFORMATICIST", "CLINICIAN"],
        "phi_classification": DataClassification.PUBLIC,
        "risk_level": ToolRiskLevel.LOW,
        "audit_requirement": True,
        "timeout": 30,
        "rate_limit": "20/min",
        "is_enabled": True,
    },
    "BROWSER_READ_PUBLIC_PAGE": {
        "tool_id": "BROWSER_READ_PUBLIC_PAGE",
        "name": "Read Public Page Content",
        "description": "Extract readable text and semantic sections from an approved webpage.",
        "input_schema": {
            "type": "object",
            "properties": {
                "max_characters": {"type": "integer", "default": 5000},
                "css_filter": {"type": "string", "default": "main, article, body"},
            },
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "text_content": {"type": "string"},
                "headings": {"type": "array", "items": {"type": "string"}},
                "links_count": {"type": "integer"},
            },
        },
        "permission_requirement": "can_execute_browser_tasks",
        "allowed_roles": ["ADMIN", "INFORMATICIST", "CLINICIAN"],
        "phi_classification": DataClassification.PUBLIC,
        "risk_level": ToolRiskLevel.LOW,
        "audit_requirement": True,
        "timeout": 15,
        "rate_limit": "30/min",
        "is_enabled": True,
    },
    "BROWSER_FILL_NON_SENSITIVE_FORM": {
        "tool_id": "BROWSER_FILL_NON_SENSITIVE_FORM",
        "name": "Fill Non-Sensitive Form Field",
        "description": "Enter search terms or non-PHI filter values into an observed input field.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target_element_index": {"type": "integer"},
                "field_name": {"type": "string"},
                "value": {"type": "string"},
            },
            "required": ["value"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean"},
                "typed_length": {"type": "integer"},
            },
        },
        "permission_requirement": "can_execute_browser_tasks",
        "allowed_roles": ["ADMIN", "INFORMATICIST"],
        "phi_classification": DataClassification.LOW_SENSITIVITY,
        "risk_level": ToolRiskLevel.MEDIUM,
        "audit_requirement": True,
        "timeout": 10,
        "rate_limit": "20/min",
        "is_enabled": True,
    },
    "BROWSER_CLICK_APPROVED_ELEMENT": {
        "tool_id": "BROWSER_CLICK_APPROVED_ELEMENT",
        "name": "Click Approved Element",
        "description": "Simulate user click on an indexed interactive element in the observed action space.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target_element_index": {"type": "integer"},
                "element_label": {"type": "string"},
                "is_mutation": {"type": "boolean", "default": False},
            },
            "required": ["target_element_index"],
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean"},
                "new_url": {"type": "string"},
            },
        },
        "permission_requirement": "can_execute_browser_tasks",
        "allowed_roles": ["ADMIN", "INFORMATICIST"],
        "phi_classification": DataClassification.PUBLIC,
        "risk_level": ToolRiskLevel.MEDIUM,
        "audit_requirement": True,
        "timeout": 15,
        "rate_limit": "25/min",
        "is_enabled": True,
    },
    "BROWSER_SCREENSHOT_NON_PHI": {
        "tool_id": "BROWSER_SCREENSHOT_NON_PHI",
        "name": "Capture Non-PHI Verification Screenshot",
        "description": "Capture full-page or element screenshot for QA auditing. PHI is strictly blocked.",
        "input_schema": {
            "type": "object",
            "properties": {
                "full_page": {"type": "boolean", "default": True},
            },
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "screenshot_base64": {"type": "string"},
                "width": {"type": "integer"},
                "height": {"type": "integer"},
            },
        },
        "permission_requirement": "can_execute_browser_tasks",
        "allowed_roles": ["ADMIN", "INFORMATICIST"],
        "phi_classification": DataClassification.PUBLIC,
        "risk_level": ToolRiskLevel.LOW,
        "audit_requirement": True,
        "timeout": 20,
        "rate_limit": "10/min",
        "is_enabled": True,
    },
    "BROWSER_VERIFY_FINAL_PAGE": {
        "tool_id": "BROWSER_VERIFY_FINAL_PAGE",
        "name": "Verify Final Page Post-Conditions",
        "description": "Independent programmatic verification of final page DOM state and text.",
        "input_schema": {
            "type": "object",
            "properties": {
                "expected_text": {"type": "array", "items": {"type": "string"}},
                "forbidden_text": {"type": "array", "items": {"type": "string"}},
                "expected_url_pattern": {"type": "string"},
            },
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "verified": {"type": "boolean"},
                "status": {"type": "string"},
                "summary": {"type": "string"},
            },
        },
        "permission_requirement": "can_execute_browser_tasks",
        "allowed_roles": ["ADMIN", "INFORMATICIST", "CLINICIAN"],
        "phi_classification": DataClassification.PUBLIC,
        "risk_level": ToolRiskLevel.LOW,
        "audit_requirement": True,
        "timeout": 15,
        "rate_limit": "30/min",
        "is_enabled": True,
    },
}


class BrowserToolRegistry:
    """
    Registry and permission validator for controlled browser automation tools.
    """

    @classmethod
    def get_all_tools(cls) -> List[Dict[str, Any]]:
        return list(BROWSER_CONTROLLED_TOOLS.values())

    @classmethod
    def get_tool(cls, tool_id: str) -> Optional[Dict[str, Any]]:
        return BROWSER_CONTROLLED_TOOLS.get(tool_id)

    @classmethod
    def is_tool_authorized(cls, tool_id: str, role: str) -> bool:
        tool = BROWSER_CONTROLLED_TOOLS.get(tool_id)
        if not tool or not tool.get("is_enabled", False):
            return False
        return role in tool.get("allowed_roles", [])
