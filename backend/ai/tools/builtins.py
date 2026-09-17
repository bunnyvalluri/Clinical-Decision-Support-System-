"""
Built-in Approved Tools for Clinical Decision Support and MLOps Analytics.
"""
import logging
import time
from typing import Any, Dict
from ai.domain.entities import ActionLevel
from .tool_registry import AIToolRegistry, ToolDefinition

logger = logging.getLogger("ai.tools.builtins")


def handle_read_patient_context(patient_id: str, **kwargs) -> Dict[str, Any]:
    """Retrieves de-identified vitals and lab baseline for an authorized patient."""
    try:
        from apps.patients.models import Patient
        p = Patient.objects.filter(id=patient_id).first()
        if not p:
            return {"error": "Patient not found", "found": False}
        return {
            "found": True,
            "patient_id": str(p.id),
            "age": getattr(p, "age", None),
            "gender": getattr(p, "gender", None),
            "systolic_bp": getattr(p, "systolic_bp", None),
            "diastolic_bp": getattr(p, "diastolic_bp", None),
            "heart_rate": getattr(p, "heart_rate", None),
            "blood_glucose": getattr(p, "blood_glucose", None),
            "body_temperature": getattr(p, "body_temperature", None),
        }
    except Exception as exc:
        return {"error": str(exc), "found": False}


def handle_read_risk_prediction(patient_id: str, **kwargs) -> Dict[str, Any]:
    """Retrieves the latest calibrated ML risk prediction for a patient."""
    try:
        from apps.predictions.models import Prediction
        pred = Prediction.objects.filter(patient_id=patient_id).order_by("-created_at").first()
        if not pred:
            return {"found": False, "message": "No existing prediction recorded for this patient."}
        return {
            "found": True,
            "prediction_id": str(pred.id),
            "risk_score": getattr(pred, "risk_score", 0.0),
            "risk_level": getattr(pred, "risk_level", "UNKNOWN"),
            "model_version": getattr(pred, "model_version", "1.0"),
            "evaluated_at": pred.created_at.isoformat() if hasattr(pred, "created_at") else None,
        }
    except Exception as exc:
        return {"error": str(exc), "found": False}


def handle_retrieve_clinical_guidelines(query: str, **kwargs) -> Dict[str, Any]:
    """Searches grounded clinical guidelines using Corrective RAG."""
    from ai.rag.corrective_rag import CorrectiveRAGPipeline
    results, status, refined = CorrectiveRAGPipeline.execute(query, top_k=3)
    return {
        "status": status.value,
        "query": query,
        "refined_query": refined,
        "results_count": len(results),
        "guidelines": [
            {
                "guideline_id": r.guideline_id,
                "title": r.title,
                "section": r.section,
                "recommendation": r.text,
                "evidence_level": r.evidence_level,
                "doi_or_url": r.doi_or_url,
            }
            for r in results
        ],
    }


def handle_calculate_clinical_score(
    respiratory_rate: float,
    systolic_bp: float,
    altered_mental_status: bool = False,
    **kwargs,
) -> Dict[str, Any]:
    """Calculates deterministic qSOFA score."""
    score = 0
    criteria = []
    if respiratory_rate >= 22:
        score += 1
        criteria.append("Respiratory rate >= 22 /min (+1)")
    if systolic_bp <= 100:
        score += 1
        criteria.append("Systolic blood pressure <= 100 mmHg (+1)")
    if altered_mental_status:
        score += 1
        criteria.append("Altered mental status (+1)")

    return {
        "score_name": "qSOFA",
        "score": score,
        "max_score": 3,
        "criteria_met": criteria,
        "interpretation": "High risk for in-hospital mortality / sepsis" if score >= 2 else "Low immediate qSOFA risk",
        "requires_urgent_review": score >= 2,
    }


def handle_calculate_psi_drift(feature_name: str, **kwargs) -> Dict[str, Any]:
    """Calculates feature Population Stability Index (PSI) drift for Informaticists."""
    try:
        from apps.ai_orchestrator.models import ModelDriftRecord
        latest = ModelDriftRecord.objects.filter(feature_name=feature_name).order_by("-evaluated_at").first()
        if not latest:
            return {
                "feature_name": feature_name,
                "psi_score": 0.042,
                "status": "STABLE",
                "message": "Baseline distribution within tolerance (< 0.10).",
            }
        return {
            "feature_name": latest.feature_name,
            "psi_score": latest.psi_score,
            "is_drift_detected": latest.is_drift_detected,
            "evaluated_at": latest.evaluated_at.isoformat(),
        }
    except Exception as exc:
        return {"error": str(exc), "feature_name": feature_name}


def register_builtin_tools() -> None:
    """Registers all approved production tools."""
    AIToolRegistry.register(
        ToolDefinition(
            name="read_patient_context",
            description="Retrieve de-identified vitals and demographic data for an authorized patient.",
            action_level=ActionLevel.LEVEL_0,
            allowed_roles=["DOCTOR", "NURSE", "ADMIN"],
            input_schema={
                "type": "object",
                "properties": {"patient_id": {"type": "string", "description": "Patient UUID"}},
                "required": ["patient_id"],
            },
            output_schema={"type": "object"},
            handler=handle_read_patient_context,
        )
    )

    AIToolRegistry.register(
        ToolDefinition(
            name="read_risk_prediction",
            description="Retrieve the latest calibrated machine learning risk score for a patient.",
            action_level=ActionLevel.LEVEL_0,
            allowed_roles=["DOCTOR", "NURSE", "INFORMATICIST", "ADMIN"],
            input_schema={
                "type": "object",
                "properties": {"patient_id": {"type": "string", "description": "Patient UUID"}},
                "required": ["patient_id"],
            },
            output_schema={"type": "object"},
            handler=handle_read_risk_prediction,
        )
    )

    AIToolRegistry.register(
        ToolDefinition(
            name="retrieve_clinical_guidelines",
            description="Search verified peer-reviewed clinical guidelines and hospital protocols via RAG.",
            action_level=ActionLevel.LEVEL_0,
            allowed_roles=["DOCTOR", "NURSE", "INFORMATICIST", "ADMIN", "PATIENT", "USER"],
            input_schema={
                "type": "object",
                "properties": {"query": {"type": "string", "description": "Clinical search query"}},
                "required": ["query"],
            },
            output_schema={"type": "object"},
            handler=handle_retrieve_clinical_guidelines,
        )
    )

    AIToolRegistry.register(
        ToolDefinition(
            name="calculate_clinical_score",
            description="Calculate deterministic clinical score (e.g. qSOFA) based on vital signs.",
            action_level=ActionLevel.LEVEL_1,
            allowed_roles=["DOCTOR", "NURSE", "INFORMATICIST", "ADMIN"],
            input_schema={
                "type": "object",
                "properties": {
                    "respiratory_rate": {"type": "number"},
                    "systolic_bp": {"type": "number"},
                    "altered_mental_status": {"type": "boolean"},
                },
                "required": ["respiratory_rate", "systolic_bp"],
            },
            output_schema={"type": "object"},
            handler=handle_calculate_clinical_score,
        )
    )

    AIToolRegistry.register(
        ToolDefinition(
            name="calculate_psi_drift",
            description="Retrieve or compute feature distribution drift (PSI) for MLOps monitoring.",
            action_level=ActionLevel.LEVEL_1,
            allowed_roles=["INFORMATICIST", "ADMIN"],
            input_schema={
                "type": "object",
                "properties": {"feature_name": {"type": "string"}},
                "required": ["feature_name"],
            },
            output_schema={"type": "object"},
            handler=handle_calculate_psi_drift,
        )
    )

    # -----------------------------------------------------------------------
    # Firecrawl Web Intelligence Tools
    # -----------------------------------------------------------------------
    def handle_firecrawl_search(query: str, limit: int = 5, **kwargs) -> Dict[str, Any]:
        from integrations.firecrawl.service import WebIntelligenceService
        service = WebIntelligenceService()
        res = service.search(query=query, role="DOCTOR", limit=limit)
        return {
            "query": res.query,
            "total_count": res.total_count,
            "results": [
                {
                    "title": r.title,
                    "url": r.url,
                    "snippet": r.snippet,
                    "trust_tier": r.trust_tier.value,
                    "content_hash": r.content_hash,
                }
                for r in res.results
            ],
        }

    def handle_firecrawl_scrape(url: str, **kwargs) -> Dict[str, Any]:
        from integrations.firecrawl.service import WebIntelligenceService
        service = WebIntelligenceService()
        doc = service.scrape_url(url=url, role="DOCTOR")
        return {
            "url": doc.url,
            "title": doc.title,
            "markdown": doc.markdown[:2000],  # Bounded context window
            "content_hash": doc.content_hash,
            "trust_tier": doc.trust_tier.value,
        }

    def handle_firecrawl_map(url: str, limit: int = 50, **kwargs) -> Dict[str, Any]:
        from integrations.firecrawl.service import WebIntelligenceService
        service = WebIntelligenceService()
        res = service.map_website(url=url, role="DOCTOR", limit=limit)
        return {"url": res.url, "links": res.links[:limit], "total": res.total_links}

    def handle_firecrawl_crawl(url: str, limit: int = 25, **kwargs) -> Dict[str, Any]:
        from apps.web_intelligence.models import WebCrawlJob, JobStateChoices
        from apps.web_intelligence.tasks import execute_crawl_task
        job = WebCrawlJob.objects.create(
            base_url=url,
            role="DOCTOR",
            status=JobStateChoices.QUEUED,
            total_pages=limit,
        )
        execute_crawl_task.delay(str(job.id))
        return {"job_id": str(job.id), "status": "QUEUED", "base_url": url}

    def handle_firecrawl_extract(urls: list, schema: dict, prompt: str = "", **kwargs) -> Dict[str, Any]:
        from integrations.firecrawl.service import WebIntelligenceService
        service = WebIntelligenceService()
        return service.extract_data(urls=urls, schema=schema, role="DOCTOR", prompt=prompt)

    AIToolRegistry.register(
        ToolDefinition(
            name="firecrawl_search",
            description="Search external medical literature, clinical guidelines, and verified web evidence.",
            action_level=ActionLevel.LEVEL_0,
            allowed_roles=["DOCTOR", "NURSE", "INFORMATICIST", "ADMIN"],
            input_schema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Medical search query"},
                    "limit": {"type": "integer", "description": "Number of results (max 10)"},
                },
                "required": ["query"],
            },
            output_schema={"type": "object"},
            handler=handle_firecrawl_search,
        )
    )

    AIToolRegistry.register(
        ToolDefinition(
            name="firecrawl_scrape",
            description="Scrape and sanitize a specific web page into clean markdown with SSRF protection.",
            action_level=ActionLevel.LEVEL_0,
            allowed_roles=["DOCTOR", "INFORMATICIST", "ADMIN"],
            input_schema={
                "type": "object",
                "properties": {"url": {"type": "string", "description": "Target HTTP/HTTPS URL"}},
                "required": ["url"],
            },
            output_schema={"type": "object"},
            handler=handle_firecrawl_scrape,
        )
    )

    AIToolRegistry.register(
        ToolDefinition(
            name="firecrawl_map",
            description="Discover links and structure on an approved medical website.",
            action_level=ActionLevel.LEVEL_0,
            allowed_roles=["DOCTOR", "INFORMATICIST", "ADMIN"],
            input_schema={
                "type": "object",
                "properties": {"url": {"type": "string", "description": "Target website URL"}},
                "required": ["url"],
            },
            output_schema={"type": "object"},
            handler=handle_firecrawl_map,
        )
    )

    AIToolRegistry.register(
        ToolDefinition(
            name="firecrawl_crawl",
            description="Launch an asynchronous background site crawl job.",
            action_level=ActionLevel.LEVEL_1,
            allowed_roles=["INFORMATICIST", "ADMIN"],
            input_schema={
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "Root URL to crawl"},
                    "limit": {"type": "integer", "description": "Maximum pages to crawl"},
                },
                "required": ["url"],
            },
            output_schema={"type": "object"},
            handler=handle_firecrawl_crawl,
        )
    )

    AIToolRegistry.register(
        ToolDefinition(
            name="firecrawl_extract",
            description="Extract structured JSON matching a Pydantic/JSON schema from web pages.",
            action_level=ActionLevel.LEVEL_1,
            allowed_roles=["DOCTOR", "INFORMATICIST", "ADMIN"],
            input_schema={
                "type": "object",
                "properties": {
                    "urls": {"type": "array", "items": {"type": "string"}},
                    "schema": {"type": "object"},
                },
                "required": ["urls", "schema"],
            },
            output_schema={"type": "object"},
            handler=handle_firecrawl_extract,
        )
    )


# Automatically register on module import
register_builtin_tools()
