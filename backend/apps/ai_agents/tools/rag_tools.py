from typing import Any, Dict, List
import time
from apps.ai_agents.models import AgentSecurityLevel
from apps.ai_agents.tools.base import BaseTool
from apps.ai_orchestrator.knowledge_retrieval import APPROVED_CLINICAL_GUIDELINES


class SearchAuthorizedClinicalDocumentsTool(BaseTool):
    name = "search_authorized_clinical_documents"
    description = "Search approved medical literature, hospital clinical protocols, and peer-reviewed guidelines with verifiable citations."
    category = "RAG"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.LOW
    allowed_roles = ["doctor", "nurse", "physician", "informaticist", "patient", "care_manager"]
    patient_data_access = False

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Clinical search query or guideline topic"}
            },
            "required": ["query"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "results": {"type": "array"},
                "retrieval_count": {"type": "integer"},
            },
        }

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        query = arguments.get("query", "").lower()
        results: List[Dict[str, Any]] = []

        # 1. Search Curated Approved Guidelines
        for guideline in APPROVED_CLINICAL_GUIDELINES:
            text_corpus = f"{guideline.title} {guideline.section} {guideline.recommendation} {guideline.organization}".lower()
            tokens = [t for t in query.split() if len(t) > 2]
            score = sum(1 for t in tokens if t in text_corpus)
            if score > 0 or not tokens:
                results.append({
                    "document_id": guideline.guideline_id,
                    "title": guideline.title,
                    "organization": guideline.organization,
                    "section": guideline.section,
                    "passage": guideline.recommendation,
                    "evidence_level": guideline.evidence_level,
                    "source_url": guideline.doi_or_url,
                    "retrieval_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "authorization_status": "APPROVED_CLINICAL_KNOWLEDGE",
                })

        return {
            "query": arguments.get("query"),
            "results": results[:5],
            "retrieval_count": len(results[:5]),
        }


class RetrieveGuidelineTool(BaseTool):
    name = "retrieve_guideline"
    description = "Retrieve exact text of specific approved clinical protocol by guideline ID (e.g. SSC-2021-SEPSIS, KDIGO-2022-AKI, AHA-ACC-2017-HTN)."
    category = "RAG"
    version = "1.0.0"
    risk_level = AgentSecurityLevel.LOW
    allowed_roles = ["doctor", "nurse", "physician", "informaticist", "patient"]
    patient_data_access = False

    def get_input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {"guideline_id": {"type": "string"}},
            "required": ["guideline_id"],
        }

    def get_output_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {"guideline": {"type": "object"}}}

    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        gid = arguments.get("guideline_id", "").upper().strip()
        for g in APPROVED_CLINICAL_GUIDELINES:
            if g.guideline_id.upper() == gid:
                return {
                    "status": "FOUND",
                    "guideline": {
                        "id": g.guideline_id,
                        "title": g.title,
                        "organization": g.organization,
                        "section": g.section,
                        "recommendation": g.recommendation,
                        "evidence_level": g.evidence_level,
                        "doi": g.doi_or_url,
                    },
                }
        return {"status": "NOT_FOUND", "message": f"Guideline '{gid}' not found in approved registry."}
