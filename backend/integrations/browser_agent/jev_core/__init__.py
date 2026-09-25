"""
Jev Ultrafast Core Browser Automation Runtime.
An indexed, observable, single-mutation browser execution runtime.
Controlled and safety-governed under HealthNova AI.
"""
from .agent import Agent
from .browser import Browser, SandboxBrowser, StalePage, fingerprint
from .model import action_space, choose, field_context, field_text, validate_choice
from .questions import MAX_STEPS, NEXT_ACTION, TARGET, TEXT_VALUE

__all__ = [
    "Agent",
    "Browser",
    "SandboxBrowser",
    "StalePage",
    "fingerprint",
    "action_space",
    "choose",
    "field_context",
    "field_text",
    "validate_choice",
    "MAX_STEPS",
    "NEXT_ACTION",
    "TARGET",
    "TEXT_VALUE",
]
