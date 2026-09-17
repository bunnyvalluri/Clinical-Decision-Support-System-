"""
Local Vision Ingestion and Document Assistance with Non-Diagnostic Disclaimers.
"""
import base64
import logging
from typing import Any, Dict, List, Optional

from .client import get_ollama_client
from .config import ollama_settings
from .exceptions import OllamaError

logger = logging.getLogger("integrations.ollama.vision")


class OllamaVisionService:
    """
    Assists with document OCR, clinical intake form transcription, and chart layout reading.
    Strictly forbidden from autonomous radiological diagnosis.
    """

    MANDATORY_DISCLAIMER = (
        "AI Assistive Document Processing: This OCR/vision analysis is strictly for transcription "
        "and data extraction assistance. It is NOT authorized for medical imaging diagnosis or radiological interpretation."
    )

    @classmethod
    def analyze_document_image(
        cls,
        image_base64: str,
        prompt: str = "Transcribe the text and key value pairs from this clinical intake document.",
        model: str = "llava:latest",
    ) -> Dict[str, Any]:
        # Validate base64 format
        try:
            raw_bytes = base64.b64decode(image_base64)
            if len(raw_bytes) < 10:
                raise ValueError("Invalid image payload size.")
        except Exception as e:
            raise OllamaError(f"Base64 image decoding failed: {e}")

        client = get_ollama_client()
        system_prompt = f"You are a clinical document transcription assistant.\n{cls.MANDATORY_DISCLAIMER}"

        payload = {
            "model": model,
            "prompt": prompt,
            "system": system_prompt,
            "images": [image_base64],
            "stream": False,
        }

        resp = client._request("/api/generate", method="POST", payload=payload)
        text = resp.get("response", "")

        return {
            "model": model,
            "extracted_text": text,
            "disclaimer": cls.MANDATORY_DISCLAIMER,
        }
