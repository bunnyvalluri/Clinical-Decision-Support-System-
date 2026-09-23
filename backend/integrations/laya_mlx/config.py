"""
Configuration settings for Laya-MLX Typed-Decision AI Engine.
"""
import os
from django.conf import settings


class LayaMLXConfig:
    """
    Configuration for Laya-MLX local typed decision inference engine.
    """
    # Master Kill Switch
    ENABLED = getattr(settings, "LAYA_MLX_ENABLED", os.getenv("LAYA_MLX_ENABLED", "true").lower() in ("true", "1", "yes"))
    
    # Model Pinned Identifiers and Revision Checksums
    DEFAULT_MODEL_ID = getattr(settings, "LAYA_MLX_MODEL_ID", os.getenv("LAYA_MLX_MODEL_ID", "convaiinnovations/laya"))
    DEFAULT_REVISION = getattr(settings, "LAYA_MLX_REVISION", os.getenv("LAYA_MLX_REVISION", "573e5b62696ba441230cd6be71d593331b5d23af"))
    EXPECTED_CHECKSUM = getattr(settings, "LAYA_MLX_CHECKSUM", os.getenv("LAYA_MLX_CHECKSUM", "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"))
    
    # Runtime & Device Parameters
    RUNTIME_MODE = getattr(settings, "LAYA_MLX_RUNTIME_MODE", os.getenv("LAYA_MLX_RUNTIME_MODE", "auto"))  # 'auto', 'mlx', 'remote', 'sandbox'
    DEVICE = getattr(settings, "LAYA_MLX_DEVICE", os.getenv("LAYA_MLX_DEVICE", "gpu"))  # 'gpu', 'metal', 'cpu'
    DTYPE = getattr(settings, "LAYA_MLX_DTYPE", os.getenv("LAYA_MLX_DTYPE", "float16"))
    BATCH_SIZE = int(getattr(settings, "LAYA_MLX_BATCH_SIZE", os.getenv("LAYA_MLX_BATCH_SIZE", "16")))
    
    # Remote Dedicated Service URL (if deployed on dedicated Apple Silicon inference worker)
    SERVICE_URL = getattr(settings, "LAYA_MLX_SERVICE_URL", os.getenv("LAYA_MLX_SERVICE_URL", ""))
    
    # Timeouts & Circuit Breakers
    TIMEOUT_SECONDS = float(getattr(settings, "LAYA_MLX_TIMEOUT", os.getenv("LAYA_MLX_TIMEOUT", "10.0")))
    MAX_RETRIES = int(getattr(settings, "LAYA_MLX_MAX_RETRIES", os.getenv("LAYA_MLX_MAX_RETRIES", "2")))
    CIRCUIT_BREAKER_FAILURES = int(getattr(settings, "LAYA_MLX_CB_FAILURES", os.getenv("LAYA_MLX_CB_FAILURES", "5")))
    CIRCUIT_BREAKER_RESET_TIMEOUT = float(getattr(settings, "LAYA_MLX_CB_RESET", os.getenv("LAYA_MLX_CB_RESET", "60.0")))
    
    # Safety Thresholds
    UNCERTAINTY_ENTROPY_THRESHOLD = float(getattr(settings, "LAYA_MLX_ENTROPY_THRESHOLD", "0.75"))
    MINIMUM_CONFIDENCE_THRESHOLD = float(getattr(settings, "LAYA_MLX_MIN_CONFIDENCE", "0.60"))
    ROBUSTNESS_MIN_CONSISTENCY = float(getattr(settings, "LAYA_MLX_MIN_ROBUSTNESS", "0.85"))
