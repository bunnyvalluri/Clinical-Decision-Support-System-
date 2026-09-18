"""
GitLab Integration Exceptions.
"""

class GitLabException(Exception):
    """Base exception for GitLab integration."""
    pass


class GitLabAuthError(GitLabException):
    """Raised when token authentication fails."""
    pass


class GitLabSignatureError(GitLabException):
    """Raised when webhook secret token validation fails."""
    pass


class GitLabNotFoundError(GitLabException):
    """Raised when pipeline, project, or deployment is not found."""
    pass
