import logging
from typing import Any, Dict, List, Optional
from apps.ai_agents.tools.base import BaseTool
from apps.ai_agents.tools.clinical_tools import (
    GetPatientSummaryTool,
    GetPatientVitalsTool,
    GetPatientTimelineTool,
    GetPatientClinicalRecordsTool,
    GetPatientAppointmentsTool,
    GetClinicalReviewTool,
)
from apps.ai_agents.tools.prediction_tools import (
    GetPatientRiskPredictionTool,
    GetPredictionExplanationTool,
    GetPredictionModelMetadataTool,
)
from apps.ai_agents.tools.rag_tools import (
    SearchAuthorizedClinicalDocumentsTool,
    RetrieveGuidelineTool,
)
from apps.ai_agents.tools.analytics_tools import (
    GetModelPerformanceTool,
    GetDataQualityStatusTool,
    GetPredictionDriftTool,
)
from apps.ai_agents.tools.search_tools import ExternalSearchTool
from apps.ai_agents.tools.system_tools import GetServiceHealthDiagnosticsTool

logger = logging.getLogger("ai_agents.services.tool_registry")


class ToolRegistry:
    """
    Central production registry of approved AI agent tools.
    Enforces default-deny access controls and machine-readable schema validation.
    """
    _registry: Dict[str, BaseTool] = {}

    @classmethod
    def initialize(cls):
        """Register all verified, healthcare-safe tools."""
        tools: List[BaseTool] = [
            GetPatientSummaryTool(),
            GetPatientVitalsTool(),
            GetPatientTimelineTool(),
            GetPatientClinicalRecordsTool(),
            GetPatientAppointmentsTool(),
            GetClinicalReviewTool(),
            GetPatientRiskPredictionTool(),
            GetPredictionExplanationTool(),
            GetPredictionModelMetadataTool(),
            SearchAuthorizedClinicalDocumentsTool(),
            RetrieveGuidelineTool(),
            GetModelPerformanceTool(),
            GetDataQualityStatusTool(),
            GetPredictionDriftTool(),
            ExternalSearchTool(),
            GetServiceHealthDiagnosticsTool(),
        ]
        for t in tools:
            cls._registry[t.name] = t
        logger.info(f"ToolRegistry initialized with {len(cls._registry)} tools.")

    @classmethod
    def get_all_tools(cls) -> Dict[str, BaseTool]:
        if not cls._registry:
            cls.initialize()
        return dict(cls._registry)

    @classmethod
    def get_tool(cls, name: str) -> Optional[BaseTool]:
        if not cls._registry:
            cls.initialize()
        return cls._registry.get(name)

    @classmethod
    def list_authorized_tools(cls, user_role: str, allowed_tool_names: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Returns machine-readable tool declarations that the user is authorized to call.
        Does NOT expose doctor tools to patients or system tools to clinicians.
        """
        if not cls._registry:
            cls.initialize()

        authorized: List[Dict[str, Any]] = []
        for name, tool in cls._registry.items():
            if allowed_tool_names and name not in allowed_tool_names:
                continue
            if tool.is_authorized(user_role=user_role, user_id=0):
                authorized.append({
                    "name": tool.name,
                    "description": tool.description,
                    "category": tool.category,
                    "version": tool.version,
                    "risk_level": tool.risk_level,
                    "input_schema": tool.get_input_schema(),
                    "output_schema": tool.get_output_schema(),
                    "approval_required": tool.approval_required,
                })
        return authorized


# Ensure tools are registered
ToolRegistry.initialize()
