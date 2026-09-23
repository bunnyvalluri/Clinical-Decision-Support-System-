"""
Central configuration for Typed-Decision Providers (Laya & Laya-MLX).
"""
import os
from django.conf import settings


class TypedDecisionConfig:
    """
    Central configuration and governance settings for Typed Decisions.
    """
    # Active default provider: "LAYA" or "LAYA_MLX"
    DEFAULT_PROVIDER = getattr(settings, "TYPED_DECISION_DEFAULT_PROVIDER", os.getenv("TYPED_DECISION_DEFAULT_PROVIDER", "LAYA"))
    
    # Master Kill Switches
    LAYA_ENABLED = getattr(settings, "LAYA_ENABLED", os.getenv("LAYA_ENABLED", "true").lower() in ("true", "1", "yes"))
    LAYA_MLX_ENABLED = getattr(settings, "LAYA_MLX_ENABLED", os.getenv("LAYA_MLX_ENABLED", "true").lower() in ("true", "1", "yes"))

    # Pinned Model Repositories and Checkpoints (NandhaKishorM/laya)
    MODEL_ENGLISH = getattr(settings, "LAYA_MODEL_ENGLISH", "convaiinnovations/laya")
    MODEL_MULTILINGUAL = getattr(settings, "LAYA_MODEL_MULTILINGUAL", "convaiinnovations/laya-multilingual")
    MODEL_TYPED = getattr(settings, "LAYA_MODEL_TYPED", "convaiinnovations/laya-typed-decisions")

    # Pinned Model Revisions
    REVISION_ENGLISH = getattr(settings, "LAYA_REVISION_ENGLISH", "573e5b62696ba441230cd6be71d593331b5d23af")
    REVISION_MULTILINGUAL = getattr(settings, "LAYA_REVISION_MULTILINGUAL", "3a8f9c1b72e4d0f5e8a1b2c3d4e5f6a7b8c9d0e1")

    # Timeouts & Circuit Breaker Thresholds
    TIMEOUT_SECONDS = float(getattr(settings, "LAYA_TIMEOUT", os.getenv("LAYA_TIMEOUT", "10.0")))
    MAX_RETRIES = int(getattr(settings, "LAYA_MAX_RETRIES", os.getenv("LAYA_MAX_RETRIES", "2")))
    CIRCUIT_BREAKER_FAILURES = int(getattr(settings, "LAYA_CB_FAILURES", os.getenv("LAYA_CB_FAILURES", "5")))
    CIRCUIT_BREAKER_RESET_TIMEOUT = float(getattr(settings, "LAYA_CB_RESET", os.getenv("LAYA_CB_RESET", "60.0")))

    # Quality & Calibration Thresholds
    MINIMUM_CONFIDENCE_THRESHOLD = float(getattr(settings, "LAYA_MIN_CONFIDENCE", "0.60"))
    UNCERTAINTY_ENTROPY_THRESHOLD = float(getattr(settings, "LAYA_ENTROPY_THRESHOLD", "0.75"))
    ROBUSTNESS_MIN_CONSISTENCY = float(getattr(settings, "LAYA_MIN_ROBUSTNESS", "0.75"))
