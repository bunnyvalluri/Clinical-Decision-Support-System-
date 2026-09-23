"""
Configuration for Laya Ultrafast Browser Agent.
"""
import os
from typing import Dict, Any


class LayaConfig:
    """
    Configuration parameters for Laya browser agent execution.
    """
    # Runtime Mode: 'auto', 'mlx', 'remote', 'sandbox'
    RUNTIME_MODE: str = os.getenv("LAYA_RUNTIME_MODE", "auto")

    # Remote Laya or Browser Harness Service URL if running in microservice container
    SERVICE_URL: str = os.getenv("LAYA_SERVICE_URL", "http://localhost:8090")

    # Decision model choice: 'laya' (local MLX) or 'typesafe' / 'mock'
    DECISION_MODEL: str = os.getenv("LAYA_DECISION_MODEL", "typesafe")

    # Global Enable Switch
    GLOBAL_ENABLED: bool = os.getenv("BROWSER_AGENT_GLOBAL_ENABLED", "true").lower() in ("true", "1", "yes")

    # Browser Harness settings
    BROWSER_HEADLESS: bool = os.getenv("BROWSER_HARNESS_HEADLESS", "true").lower() in ("true", "1", "yes")
    BROWSER_TIMEOUT_MS: int = int(os.getenv("BROWSER_HARNESS_TIMEOUT_MS", "30000"))
    MAX_STEPS_PER_TASK: int = int(os.getenv("BROWSER_AGENT_MAX_STEPS", "12"))

    # Screenshot storage: DEFAULT DISABLED for privacy
    SCREENSHOT_STORAGE_ENABLED: bool = os.getenv("BROWSER_SCREENSHOT_STORAGE_ENABLED", "false").lower() in ("true", "1", "yes")
