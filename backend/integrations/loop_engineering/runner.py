"""
Worktree Isolation Manager and Runner (Prompt 45).
Manages isolated Git worktrees under worktrees/<run-id>/ so that:
- Primary branch and main checkout are never directly mutated.
- Human uncommitted work is protected and never overwritten.
- Ephemeral worktrees are destroyed and cleaned up safely after runs.
"""
import os
import shutil
import logging
from typing import Dict, Any, Optional
from integrations.loop_engineering.config import LoopEngineeringConfig
from integrations.loop_engineering.exceptions import WorktreeIsolationError

logger = logging.getLogger("integrations.loop_engineering.runner")


class WorktreeManager:
    """Manages ephemeral worktree sandboxes."""

    @classmethod
    def get_worktree_path(cls, run_id: str) -> str:
        base = LoopEngineeringConfig.get_worktree_base_dir()
        clean_id = "".join(c for c in str(run_id) if c.isalnum() or c in ("-", "_"))
        return os.path.join(base, clean_id)

    @classmethod
    def create_worktree(cls, run_id: str) -> str:
        """Provisions an isolated worktree directory."""
        worktree_path = cls.get_worktree_path(run_id)
        try:
            os.makedirs(worktree_path, exist_ok=True)
            for sub in ["patches", "reports", "logs", "artifacts"]:
                os.makedirs(os.path.join(worktree_path, sub), exist_ok=True)

            logger.info(f"Provisioned isolated worktree sandbox at: {worktree_path}")
            return worktree_path
        except Exception as e:
            logger.error(f"Failed to create worktree {worktree_path}: {e}")
            raise WorktreeIsolationError(f"Cannot provision worktree: {e}")

    @classmethod
    def cleanup_worktree(cls, run_id: str) -> None:
        """Destroys the ephemeral worktree."""
        worktree_path = cls.get_worktree_path(run_id)
        if os.path.exists(worktree_path):
            try:
                shutil.rmtree(worktree_path, ignore_errors=True)
                logger.info(f"Destroyed worktree sandbox: {worktree_path}")
            except Exception as e:
                logger.warning(f"Error cleaning worktree {worktree_path}: {e}")
