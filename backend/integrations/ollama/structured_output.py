"""
Structured JSON Output Generation and Schema Enforcement for Clinical Synthesis.
"""
import json
import logging
import re
from typing import Any, Dict, Optional, Type
from pydantic import BaseModel, Field, ValidationError

from .client import get_ollama_client
from .config import ollama_settings
from .exceptions import StructuredOutputValidationError

logger = logging.getLogger("integrations.ollama.structured_output")


class ClinicalSummarySchema(BaseModel):
    patient_context_summary: str = Field(..., description="Concise synopsis of patient condition")
    primary_concerns: list[str] = Field(default_factory=list, description="List of notable clinical flags")
    deterministic_rule_notes: str = Field("", description="References to validated scoring rules")
    clinician_action_items: list[str] = Field(default_factory=list, description="Suggested diagnostic investigations for clinician sign-off")
    safety_disclaimer: str = Field(
        default="AI assistive synthesis only. Not a medical diagnosis or prescription.",
        description="Mandatory disclaimer",
    )


class RiskExplanationSchema(BaseModel):
    model_config = {"protected_namespaces": ()}

    prediction_id: str = Field(..., description="UUID of the classical ML prediction")
    model_family: str = Field(..., description="e.g. Random Forest, SVM, AdaBoost")
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Predicted risk score")
    top_contributing_features: list[dict[str, Any]] = Field(default_factory=list, description="Top SHAP feature importances")
    clinical_narrative: str = Field(..., description="Clinician-oriented interpretation")
    recommended_monitoring_interval: str = Field(..., description="Monitoring cadence recommendation")
    human_signoff_required: bool = Field(default=True, description="Strict sign-off flag")


class OllamaStructuredOutputService:
    """
    Forces Ollama output into validated JSON adhering to strict clinical schemas.
    """

    @classmethod
    def clean_json_string(cls, raw: str) -> str:
        """Strips markdown code blocks and trailing noise."""
        clean = raw.strip()
        # Remove ```json and ```
        clean = re.sub(r"^```(?:json)?\s*", "", clean, flags=re.IGNORECASE)
        clean = re.sub(r"\s*```$", "", clean)
        return clean.strip()

    @classmethod
    def generate_structured(
        cls,
        prompt: str,
        schema_cls: Type[BaseModel],
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.1,
    ) -> BaseModel:
        """
        Executes prompt with format="json" and validates result against Pydantic schema.
        """
        client = get_ollama_client()
        schema_json = json.dumps(schema_cls.model_json_schema())
        
        system_instruction = (
            f"{system or 'You are an assistive clinical documentation AI.'}\n\n"
            f"CRITICAL: You must return valid JSON strictly conforming to this JSON Schema:\n"
            f"{schema_json}\n"
            f"Do not include explanation text outside the JSON object."
        )

        resp = client.generate(
            prompt=prompt,
            system=system_instruction,
            model=model or ollama_settings.default_chat_model,
            format_json=True,
            options={"temperature": temperature},
        )

        raw_text = resp.get("response", "")
        cleaned = cls.clean_json_string(raw_text)

        try:
            parsed = json.loads(cleaned)
            validated = schema_cls.model_validate(parsed)
            return validated
        except (json.JSONDecodeError, ValidationError) as err:
            logger.warning("Structured output validation failed: %s. Raw: %s", err, raw_text[:200])
            raise StructuredOutputValidationError(
                f"Model output failed structured schema validation: {err}"
            )
