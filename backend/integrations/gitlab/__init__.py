"""
GitLab Integration Package for HealthNova AI.
Provides clean architecture wrappers for GitLab API, Webhooks, Pipeline & Deployment Services.
"""
from .client import GitLabClient
from .service import (
    GitLabPipelineService,
    GitLabDeploymentService,
    GitLabWebhookService,
)
from .exceptions import (
    GitLabException,
    GitLabAuthError,
    GitLabSignatureError,
    GitLabNotFoundError,
)

__all__ = [
    "GitLabClient",
    "GitLabPipelineService",
    "GitLabDeploymentService",
    "GitLabWebhookService",
    "GitLabException",
    "GitLabAuthError",
    "GitLabSignatureError",
    "GitLabNotFoundError",
]
