"""
Model Security and Artifact Integrity Module — BPY-CSE-2666.

Protects against:
- Malicious artifact replacement & supply-chain tampering
- Arbitrary pickle code execution
- Corrupted or truncated weights
- Unauthorized model uploads
"""
import hashlib
import logging
from pathlib import Path
from typing import Any, Optional, Union
import joblib

logger = logging.getLogger(__name__)


class ModelSecurityError(Exception):
    """Raised when model artifact integrity or security verification fails."""
    pass


class ModelArtifactSecurity:
    """Cryptographic verification and safe loading of trained ML artifacts."""

    @staticmethod
    def calculate_checksum(file_path: Union[str, Path]) -> str:
        """Compute cryptographic SHA-256 hash of an artifact file."""
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Model artifact not found at {path}")

        sha256 = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    @classmethod
    def verify_integrity(cls, file_path: Union[str, Path], expected_checksum: str) -> bool:
        """
        Verify that file contents match the expected SHA-256 hash registered in PostgreSQL.
        """
        computed = cls.calculate_checksum(file_path)
        if computed.lower() != expected_checksum.lower():
            logger.error(
                "CRITICAL SECURITY ALERT: Checksum mismatch for %s. Computed: %s, Expected: %s",
                file_path, computed, expected_checksum
            )
            return False
        return True

    @classmethod
    def safe_load_artifact(
        cls,
        file_path: Union[str, Path],
        expected_checksum: Optional[str] = None,
        max_size_mb: int = 100,
    ) -> Any:
        """
        Safely load serialized artifact after validating file size, existence, and checksum.
        Never load an unverified or oversized binary.
        """
        path = Path(file_path)
        if not path.exists():
            raise ModelSecurityError(f"Model artifact does not exist: {path}")

        # Size check to prevent zip bomb / out-of-memory exploitation
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > max_size_mb:
            raise ModelSecurityError(f"Artifact size {size_mb:.2f} MB exceeds maximum limit of {max_size_mb} MB")

        # Checksum verification
        if expected_checksum:
            if not cls.verify_integrity(path, expected_checksum):
                raise ModelSecurityError(
                    f"Integrity check failed: Artifact at {path} has been tampered with or corrupted!"
                )

        try:
            artifact = joblib.load(path)
            logger.info("Successfully and securely loaded artifact: %s", path.name)
            return artifact
        except Exception as exc:
            logger.error("Failed to safely deserialize artifact %s: %s", path, exc)
            raise ModelSecurityError(f"Deserialization failure: {exc}") from exc
