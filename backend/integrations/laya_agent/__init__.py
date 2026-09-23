"""
Laya Ultrafast Controlled Browser Agent Integration.

Provides isolated runtime management, hardware-neutral execution adapter,
mutation safety, independent verification, and audit logging.
"""
from .adapter import LayaAgentAdapter
from .config import LayaConfig

__all__ = ["LayaAgentAdapter", "LayaConfig"]
