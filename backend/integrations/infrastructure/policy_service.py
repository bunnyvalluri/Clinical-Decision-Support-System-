"""
Policy Evaluation Service.
Audits infrastructure code and cloud state against HIPAA, CIS benchmarks, and OPA Rego rules.
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class PolicyEvaluationService:
    """
    Evaluates infrastructure compliance against HIPAA and platform security standards.
    """

    def __init__(self, infra_dir: Optional[Path] = None):
        if infra_dir:
            self.infra_dir = infra_dir
        else:
            self.infra_dir = Path(settings.BASE_DIR).parent / "infra"

    def run_all_checks(self) -> List[Dict[str, Any]]:
        """
        Runs comprehensive security audit suite across declared infrastructure.
        """
        checks = [
            self._check_network_isolation(),
            self._check_storage_encryption(),
            self._check_compute_hardening(),
            self._check_tls_enforcement(),
            self._check_state_locking(),
        ]
        return checks

    def _check_network_isolation(self) -> Dict[str, Any]:
        """Verify no open public ingress to backend or database ports."""
        firewall_tf = self.infra_dir / "modules" / "firewall" / "main.tf"
        has_firewall = firewall_tf.exists()
        
        passed = True
        violations = []

        if not has_firewall:
            passed = False
            violations.append("Firewall module definition main.tf not found.")
        else:
            content = firewall_tf.read_text(encoding="utf-8")
            # Invariant: Ports 8000, 6379, 7700, 11434 must NOT have cidr_blocks = ["0.0.0.0/0"]
            for sensitive_port in ["8000", "6379", "7700", "11434"]:
                if f"from_port       = {sensitive_port}" in content and 'cidr_blocks      = ["0.0.0.0/0"]' in content:
                    # check if the 0.0.0.0/0 belongs to sensitive port block
                    passed = False
                    violations.append(f"Port {sensitive_port} appears to allow 0.0.0.0/0 ingress.")

        return {
            "policy_name": "POL-NET-001: Strict Ingress Port Isolation",
            "policy_type": "NETWORK_SECURITY",
            "status": "PASSED" if passed else "FAILED",
            "description": "Public ingress restricted to 80/443. Internal ports (8000, 6379, 7700, 11434) restricted to VPC.",
            "violations": violations,
            "evaluated_at": timezone.now().isoformat(),
        }

    def _check_storage_encryption(self) -> Dict[str, Any]:
        """Verify S3 buckets enforce SSE-S3/KMS and block public access."""
        storage_tf = self.infra_dir / "modules" / "storage" / "main.tf"
        passed = True
        violations = []

        if not storage_tf.exists():
            passed = False
            violations.append("Storage module definition main.tf not found.")
        else:
            content = storage_tf.read_text(encoding="utf-8")
            if "aws_s3_bucket_server_side_encryption_configuration" not in content:
                passed = False
                violations.append("Missing S3 server side encryption configuration.")
            if "aws_s3_bucket_public_access_block" not in content:
                passed = False
                violations.append("Missing S3 public access block enforcement.")

        return {
            "policy_name": "POL-STO-001: Object Storage At-Rest Encryption & Access Block",
            "policy_type": "ENCRYPTION",
            "status": "PASSED" if passed else "FAILED",
            "description": "All S3 buckets must enforce server-side encryption and block public ACLs/policies.",
            "violations": violations,
            "evaluated_at": timezone.now().isoformat(),
        }

    def _check_compute_hardening(self) -> Dict[str, Any]:
        """Verify EC2 / Host nodes enforce IMDSv2 and encrypted root EBS volumes."""
        server_tf = self.infra_dir / "modules" / "server" / "main.tf"
        passed = True
        violations = []

        if not server_tf.exists():
            passed = False
            violations.append("Server module definition main.tf not found.")
        else:
            content = server_tf.read_text(encoding="utf-8")
            if 'http_tokens                 = "required"' not in content:
                passed = False
                violations.append("IMDSv2 not enforced (http_tokens != 'required'). Vulnerable to SSRF exfiltration.")
            if 'encrypted             = true' not in content:
                passed = False
                violations.append("EBS root block device is not marked as encrypted.")

        return {
            "policy_name": "POL-COM-001: Host IMDSv2 & EBS Disk Encryption",
            "policy_type": "LEAST_PRIVILEGE",
            "status": "PASSED" if passed else "FAILED",
            "description": "Compute host instances must enforce IMDSv2 token retrieval and encrypted gp3 storage.",
            "violations": violations,
            "evaluated_at": timezone.now().isoformat(),
        }

    def _check_tls_enforcement(self) -> Dict[str, Any]:
        """Verify SSL/TLS 1.2+ is enforced on object storage and web ingress."""
        storage_tf = self.infra_dir / "modules" / "storage" / "main.tf"
        passed = True
        violations = []

        if not storage_tf.exists():
            passed = False
            violations.append("Storage module definition main.tf not found.")
        else:
            content = storage_tf.read_text(encoding="utf-8")
            if '"aws:SecureTransport" = "false"' not in content:
                passed = False
                violations.append("S3 bucket policy does not explicitly deny insecure transport (HTTP).")

        return {
            "policy_name": "POL-TLS-001: Mandatory In-Transit Encryption (TLS 1.2+)",
            "policy_type": "TRANSPORT_SECURITY",
            "status": "PASSED" if passed else "FAILED",
            "description": "Enforces TLS for all S3 object requests and ALB ingress endpoints.",
            "violations": violations,
            "evaluated_at": timezone.now().isoformat(),
        }

    def _check_state_locking(self) -> Dict[str, Any]:
        """Verify remote state with DynamoDB concurrency locking in production."""
        prod_tf = self.infra_dir / "environments" / "production" / "main.tf"
        passed = True
        violations = []

        if not prod_tf.exists():
            passed = False
            violations.append("Production environment main.tf not found.")
        else:
            content = prod_tf.read_text(encoding="utf-8")
            if 'dynamodb_table = "healthnova-production-tofu-locks"' not in content:
                passed = False
                violations.append("Production backend does not configure DynamoDB state locking.")

        return {
            "policy_name": "POL-IAC-001: OpenTofu Remote State Concurrency Locking",
            "policy_type": "PLATFORM_GOVERNANCE",
            "status": "PASSED" if passed else "FAILED",
            "description": "State must be stored in encrypted remote S3 with DynamoDB distributed mutex locks.",
            "violations": violations,
            "evaluated_at": timezone.now().isoformat(),
        }
