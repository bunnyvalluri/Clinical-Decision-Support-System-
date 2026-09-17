"""
Exceptions for Loop Engineering.
"""


class LoopEngineeringBaseException(Exception):
    """Base exception for all loop engineering errors."""
    pass


class LoopKillSwitchActiveError(LoopEngineeringBaseException):
    """Raised when loops are attempted while ENGINEERING_LOOPS_ENABLED=False."""
    pass


class AutonomyViolationError(LoopEngineeringBaseException):
    """Raised when an operation exceeds the permitted autonomy level."""
    pass


class ProtectedPathViolationError(LoopEngineeringBaseException):
    """Raised when an agent attempts to mutate a protected clinical/secret path."""
    pass


class BudgetExceededError(LoopEngineeringBaseException):
    """Raised when estimated or actual loop cost exceeds defined budget limits."""
    pass


class WorktreeIsolationError(LoopEngineeringBaseException):
    """Raised when creating, isolating, or cleaning a Git worktree fails."""
    pass


class VerificationFailureError(LoopEngineeringBaseException):
    """Raised when the maker/checker verification step fails."""
    pass
