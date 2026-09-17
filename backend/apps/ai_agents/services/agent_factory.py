import logging
from typing import Optional
from apps.ai_agents.models import AgentDefinition, AgentSecurityLevel

logger = logging.getLogger("ai_agents.services.agent_factory")

ROLE_AGENT_DEFINITIONS = {
    "doctor": {
        "slug": "doctor_assistant",
        "name": "Physician Clinical Assistant",
        "description": "Decision support for physicians: calibrated ML risk explanation, guideline synthesis, patient timelines.",
        "allowed_roles": ["doctor", "physician"],
        "allowed_tools": [
            "get_patient_summary",
            "get_patient_vitals",
            "get_patient_timeline",
            "get_patient_clinical_records",
            "get_clinical_review",
            "get_patient_risk_prediction",
            "get_prediction_explanation",
            "get_prediction_model_metadata",
            "search_authorized_clinical_documents",
            "retrieve_guideline",
            "external_search",
        ],
        "security_level": AgentSecurityLevel.HIGH,
        "max_iterations": 5,
        "max_tool_calls": 10,
        "system_prompt": (
            "You are a Physician Clinical Decision Support Assistant. Ground all answers in authoritative patient data "
            "and validated guidelines (SSC, KDIGO, AHA). Never fabricate risk probabilities or diagnoses. "
            "All recommendations require independent clinician sign-off."
        ),
    },
    "nurse": {
        "slug": "nurse_assistant",
        "name": "Nurse Triage Assistant",
        "description": "Assists nursing staff with triage workflow, vital sign monitoring, and protocol escalation prompts.",
        "allowed_roles": ["nurse", "care_manager"],
        "allowed_tools": [
            "get_patient_summary",
            "get_patient_vitals",
            "get_patient_timeline",
            "get_patient_appointments",
            "retrieve_guideline",
            "search_authorized_clinical_documents",
        ],
        "security_level": AgentSecurityLevel.HIGH,
        "max_iterations": 4,
        "max_tool_calls": 6,
        "system_prompt": (
            "You are a Nurse Clinical Triage Assistant. Provide objective summaries of vital sign trends and triage protocols. "
            "Never issue autonomous patient discharge or disposition orders. Escalate critical vitals promptly."
        ),
    },
    "patient": {
        "slug": "patient_assistant",
        "name": "Patient Health Navigator",
        "description": "Patient portal health literacy, appointment explanations, and general wellness education.",
        "allowed_roles": ["patient"],
        "allowed_tools": [
            "get_patient_appointments",
            "search_authorized_clinical_documents",
            "retrieve_guideline",
        ],
        "security_level": AgentSecurityLevel.LOW,
        "max_iterations": 3,
        "max_tool_calls": 3,
        "system_prompt": (
            "You are a compassionate Patient Health Education Navigator. Explain medical concepts in clear, reassuring, "
            "and accessible language. Never diagnose illnesses or recommend changing medications. Always recommend contacting your primary doctor."
        ),
    },
    "informaticist": {
        "slug": "informaticist_assistant",
        "name": "Medical Informaticist & MLOps Assistant",
        "description": "Model governance, feature drift analysis, data-quality monitoring, and AI evaluation metrics.",
        "allowed_roles": ["informaticist", "compliance_officer"],
        "allowed_tools": [
            "get_model_performance",
            "get_data_quality_status",
            "get_prediction_drift",
            "get_prediction_model_metadata",
            "get_service_health_diagnostics",
            "search_authorized_clinical_documents",
        ],
        "security_level": AgentSecurityLevel.MEDIUM,
        "max_iterations": 5,
        "max_tool_calls": 8,
        "system_prompt": (
            "You are a Medical Informatics & AI Governance Assistant. Analyze statistical performance metrics, "
            "population drift, and sensor completeness from the Model Registry. Report authentic metrics without fabrication."
        ),
    },
    "admin": {
        "slug": "admin_assistant",
        "name": "IT Systems & Infrastructure Assistant",
        "description": "System health diagnostics, database connectivity, and operational cluster health.",
        "allowed_roles": ["admin"],
        "allowed_tools": [
            "get_service_health_diagnostics",
            "get_data_quality_status",
            "get_model_performance",
        ],
        "security_level": AgentSecurityLevel.LOW,
        "max_iterations": 3,
        "max_tool_calls": 4,
        "system_prompt": (
            "You are an IT Infrastructure Assistant. Report service vitality, database connectivity, "
            "and queue health for HealthNova AI. No destructive commands or unauthorized production changes."
        ),
    },
}


class AgentFactory:
    """
    Instantiates and caches database-backed AgentDefinition entities for each role.
    """
    @classmethod
    def get_or_create_for_role(cls, role: str) -> AgentDefinition:
        normalized_role = role.lower()
        config = ROLE_AGENT_DEFINITIONS.get(normalized_role, ROLE_AGENT_DEFINITIONS["doctor"])

        definition, created = AgentDefinition.objects.get_or_create(
            slug=config["slug"],
            defaults={
                "name": config["name"],
                "description": config["description"],
                "allowed_roles": config["allowed_roles"],
                "allowed_tools": config["allowed_tools"],
                "security_level": config["security_level"],
                "max_iterations": config["max_iterations"],
                "max_tool_calls": config["max_tool_calls"],
                "system_prompt": config["system_prompt"],
                "enabled": True,
            },
        )
        return definition
