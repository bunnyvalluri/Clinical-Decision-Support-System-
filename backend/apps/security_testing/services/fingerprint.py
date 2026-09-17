"""
Deterministic Security Finding Deduplication and Fingerprinting Service.
Prevents duplicate vulnerability entries across repeated Strix and automated security scans.
"""
import hashlib
import json
from typing import Optional, Dict, Any


class FindingFingerprintService:
    """
    Computes deterministic SHA-256 fingerprints for security findings.
    """

    @staticmethod
    def generate_fingerprint(
        vulnerability_type: str,
        endpoint: str,
        method: str = "GET",
        cwe_id: Optional[str] = None,
        affected_component: Optional[str] = None,
        code_location: Optional[str] = None,
    ) -> str:
        """
        Creates a consistent hash representing the root cause and location of a vulnerability.
        """
        norm_vuln = (vulnerability_type or "").strip().upper()
        norm_ep = (endpoint or "").strip().lower()
        norm_method = (method or "GET").strip().upper()
        norm_cwe = (cwe_id or "").strip().upper()
        norm_comp = (affected_component or "").strip().lower()
        norm_loc = (code_location or "").strip().lower()

        composite = f"{norm_vuln}|{norm_cwe}|{norm_ep}|{norm_method}|{norm_comp}|{norm_loc}"
        return hashlib.sha256(composite.encode("utf-8")).hexdigest()

    @staticmethod
    def compute_evidence_hash(data: Any) -> str:
        """
        Computes SHA-256 digest of sanitized evidence data.
        """
        if isinstance(data, (dict, list)):
            serialized = json.dumps(data, sort_keys=True)
        else:
            serialized = str(data or "")
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
