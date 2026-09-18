"""
Kaggle Authentication Service.
Resolves and validates server-side Kaggle credentials.
Credentials are NEVER passed to client-side code or exposed via API responses.
"""
import json
import logging
import os
from pathlib import Path
from typing import Dict, Optional, Tuple

from integrations.kaggle.exceptions import KaggleAuthenticationError

logger = logging.getLogger("integrations.kaggle.auth")


class KaggleAuthService:
    """
    Manages server-side authentication for Kaggle API interactions.
    Inspects environment variables first, then ~/.kaggle/kaggle.json.
    """

    @classmethod
    def get_credentials(cls) -> Dict[str, str]:
        """
        Extract active Kaggle credentials without leaking them in logs or exceptions.
        Returns a dictionary with username and key/token if present.
        """
        username = os.environ.get("KAGGLE_USERNAME")
        key = os.environ.get("KAGGLE_KEY")
        token = os.environ.get("KAGGLE_API_TOKEN")

        if username and (key or token):
            return {
                "username": username.strip(),
                "key": (key or token).strip(),
                "auth_source": "ENVIRONMENT_VARIABLE",
            }

        # Check ~/.kaggle/kaggle.json or %USERPROFILE%\.kaggle\kaggle.json
        kaggle_json_path = Path.home() / ".kaggle" / "kaggle.json"
        if kaggle_json_path.is_file():
            try:
                with open(kaggle_json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    u = data.get("username")
                    k = data.get("key")
                    if u and k:
                        return {
                            "username": str(u).strip(),
                            "key": str(k).strip(),
                            "auth_source": "CONFIG_FILE",
                        }
            except Exception as exc:
                logger.warning("Failed to parse ~/.kaggle/kaggle.json: %s", exc)

        return {}

    @classmethod
    def is_authenticated(cls) -> bool:
        """Check if valid credentials exist on the server."""
        creds = cls.get_credentials()
        return bool(creds.get("username") and creds.get("key"))

    @classmethod
    def get_auth_status(cls) -> Dict[str, bool | str]:
        """Return safe, unredacted status suitable for admin diagnostics."""
        creds = cls.get_credentials()
        has_auth = bool(creds.get("username") and creds.get("key"))
        masked_user = ""
        if has_auth and creds.get("username"):
            u = creds["username"]
            masked_user = u[:2] + "***" + u[-1:] if len(u) > 3 else "***"

        return {
            "authenticated": has_auth,
            "configured_user": masked_user if has_auth else None,
            "auth_source": creds.get("auth_source", "NONE"),
            "backend_mode": "LIVE_API" if has_auth else "OFFLINE_SANDBOX",
        }

    @classmethod
    def require_auth(cls) -> Tuple[str, str]:
        """Assert valid credentials exist or raise KaggleAuthenticationError."""
        creds = cls.get_credentials()
        username = creds.get("username")
        key = creds.get("key")
        if not username or not key:
            raise KaggleAuthenticationError(
                "Kaggle credentials not configured. Please set KAGGLE_USERNAME and KAGGLE_KEY."
            )
        return username, key
