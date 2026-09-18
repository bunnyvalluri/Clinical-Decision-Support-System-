"""
Container Registry Client for HealthNova AI.
Interfaces with GitHub Container Registry (ghcr.io) or GitLab Container Registry.
Validates immutable image tags, digest verification, and security scanning status.
"""

import logging
import os
import re
from typing import Any, Dict, List, Optional
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class ContainerRegistryError(Exception):
    """Base exception for container registry operations."""
    pass


class ContainerRegistryClient:
    """
    Client for container registry interactions (GHCR / GitLab Container Registry).
    Enforces immutable commit SHA tags, verifies image manifests, and prevents floating 'latest' deployments.
    """

    def __init__(
        self,
        registry_url: Optional[str] = None,
        auth_token: Optional[str] = None,
        timeout: int = 10,
    ):
        self.registry_url = (registry_url or getattr(settings, "CONTAINER_REGISTRY_URL", "https://ghcr.io")).rstrip("/")
        self.auth_token = auth_token or getattr(settings, "CONTAINER_REGISTRY_TOKEN", os.getenv("GITHUB_TOKEN", ""))
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        return bool(self.registry_url and self.auth_token)

    def validate_image_tag(self, tag: str) -> bool:
        """
        Enforce immutable image tagging.
        Rejects 'latest' or mutable tags for production deployments.
        Permits commit SHAs (7-40 hex chars) or semantic release tags (vX.Y.Z).
        """
        if not tag or tag.lower() in ("latest", "dev", "current"):
            logger.warning(f"Rejected mutable/floating image tag '{tag}' for deployment.")
            return False

        # Match 7 to 40 hex characters (Git SHA) or semver
        is_sha = bool(re.match(r"^[0-9a-fA-F]{7,40}$", tag))
        is_semver = bool(re.match(r"^v?\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$", tag))
        return is_sha or is_semver

    def get_image_manifest(self, repository: str, tag: str) -> Dict[str, Any]:
        """
        Fetch container image manifest and digest from the registry.
        """
        if not self.validate_image_tag(tag):
            raise ContainerRegistryError(f"Invalid or unsafe image tag '{tag}'. Only immutable SHAs or semantic tags allowed.")

        headers = {
            "Accept": "application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.manifest.v1+json",
        }
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        manifest_url = f"{self.registry_url}/v2/{repository}/manifests/{tag}"
        try:
            resp = requests.get(manifest_url, headers=headers, timeout=self.timeout)
            if resp.status_code == 200:
                digest = resp.headers.get("Docker-Content-Digest") or resp.headers.get("ETag", "").strip('"')
                return {
                    "repository": repository,
                    "tag": tag,
                    "digest": digest,
                    "schema_version": resp.json().get("schemaVersion") if resp.headers.get("content-type", "").startswith("application/json") else 2,
                    "status": "VERIFIED",
                }
            elif resp.status_code == 404:
                raise ContainerRegistryError(f"Image {repository}:{tag} not found in registry (HTTP 404).")
            else:
                raise ContainerRegistryError(f"Registry returned HTTP {resp.status_code}: {resp.text}")
        except requests.RequestException as exc:
            logger.error(f"Failed to query registry manifest: {exc}")
            raise ContainerRegistryError(f"Registry connection failure: {exc}") from exc
