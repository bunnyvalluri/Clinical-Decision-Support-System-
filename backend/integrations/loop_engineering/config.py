"""
Configuration for Loop Engineering integration.
"""
import os
from django.conf import settings


class LoopEngineeringConfig:
    """Centralized configuration for engineering loops."""

    VERSION = "0.1.0"
    PINNED_COMMIT = "b4f81c9a03de72e519e48b321cf7a40953a87109"
    PACKAGE_NAME = "@cobusgreyling/loop"

    @classmethod
    def is_enabled(cls) -> bool:
        return getattr(settings, "ENGINEERING_LOOPS_ENABLED", True)

    @classmethod
    def get_worktree_base_dir(cls) -> str:
        base_dir = getattr(
            settings,
            "ENGINEERING_WORKTREES_ROOT",
            os.path.join(settings.BASE_DIR, "worktrees"),
        )
        os.makedirs(base_dir, exist_ok=True)
        return base_dir

    DEFAULT_TIMEOUT_SECONDS = 300
    MAX_ITERATIONS = 10
    MAX_ATTEMPTS = 3
    MAX_TOOL_CALLS = 40

    # Path Denylist (Sections 13 & 14)
    PATH_DENYLIST = [
        r"^\.env.*",
        r"^secrets/.*",
        r"^credentials/.*",
        r"^keys/.*",
        r"^certificates/.*",
        r"^private/.*",
        r"^production/.*",
        r"^backups/.*",
        r".*\.dump$",
        r".*\.sql$",
        # Clinical & ML Protected Core
        r"^backend/apps/clinical/.*",
        r"^backend/apps/patients/.*",
        r"^backend/apps/predictions/.*",
        r"^backend/apps/model_registry/.*",
        r"^backend/apps/accounts/.*",
        r"^backend/apps/audit/.*",
    ]
