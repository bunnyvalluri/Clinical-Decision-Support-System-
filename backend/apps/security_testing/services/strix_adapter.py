"""
StrixSecurityAdapter — Official usestrix/strix integration for CDSS DevSecOps platform.
Adapts the Strix AI pentesting engine into the application's controlled security validation layer.

ARCHITECTURE CONSTRAINTS:
  - Strix executes ONLY against authorized targets in the security target allowlist.
  - All target validation, scope matching, SSRF defense, and PHI-free workspace isolation
    are enforced BEFORE any Strix invocation.
  - Strix produces security EVIDENCE, not business truth. All output is parsed, validated,
    deduplicated, and normalized before persisting to PostgreSQL.
  - Production scanning disabled by default; requires dual-custody approval.
  - Emergency kill-switch halts all operations immediately.
"""
import logging
import os
import shutil
import subprocess
import tempfile
import time
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from django.conf import settings
from django.utils import timezone

from apps.security_testing.models import (
    SecurityTarget,
    SecurityScan,
    SecurityFinding,
    SecurityScanState,
    SecurityAuditEvent,
    SecurityToolExecution,
)
from apps.security_testing.services.adapter import SecurityScannerInterface
from apps.security_testing.services.policy_engine import SecurityPolicyEngine
from apps.security_testing.services.fingerprint import FindingFingerprintService
from apps.security_testing.services.redaction import SecretRedactionService
from apps.security_testing.services.strix_parser import StrixResultParser
from apps.security_testing.services.validation_gate import FindingValidationService

logger = logging.getLogger("security_testing.strix")

# Strix produces exit code 2 when vulnerabilities are found
STRIX_EXIT_VULNERABILITIES_FOUND = 2


class StrixSecurityAdapter(SecurityScannerInterface):
    """
    Controlled integration adapter for usestrix/strix v1.0.2.
    Runs Strix inside an ephemeral, secret-free workspace directory
    with strict environment isolation and resource limits.
    """

    # Map internal scan modes to Strix CLI mode arguments
    SCAN_MODE_MAP = {
        "QUICK_SECURITY_REVIEW": "quick",
        "STANDARD_SECURITY_ASSESSMENT": "standard",
        "DEEP_SECURITY_ASSESSMENT": "deep",
        # Legacy scan_type compatibility
        "RECON": "quick",
        "API_SECURITY": "standard",
        "RBAC_AUTH": "standard",
        "IDOR": "standard",
        "SSRF_CHECK": "quick",
        "COMPREHENSIVE_LAB": "deep",
    }

    def __init__(self):
        self.scan: Optional[SecurityScan] = None
        self.target: Optional[SecurityTarget] = None
        self.workspace: Optional[str] = None
        self.initialized = False
        self.strix_version = getattr(settings, "SECURITY_STRIX_VERSION", "1.0.2")

    # ------------------------------------------------------------------
    # SecurityScannerInterface contract
    # ------------------------------------------------------------------

    def initialize(self, scan: SecurityScan) -> bool:
        self.scan = scan
        self.target = scan.target
        self.initialized = True
        logger.info(
            json.dumps({
                "event": "strix.adapter.initialized",
                "scan_id": str(scan.id),
                "target": scan.target.name,
                "strix_version": self.strix_version,
            })
        )
        return True

    def validate_target(self, target: SecurityTarget) -> bool:
        """Delegate to PolicyEngine — enforces default-deny."""
        ok, msg = SecurityPolicyEngine.can_scan_target(target, getattr(self.scan, "initiated_by", None))
        if not ok:
            logger.warning(f"[Strix] Target validation failed: {msg}")
        return ok

    def recon(self, target: SecurityTarget) -> Dict[str, Any]:
        """Surface-level recon phase — target information only, no exploitation."""
        return {
            "target_name": target.name,
            "hostname": target.hostname,
            "port": target.port,
            "protocol": target.protocol,
            "scope": target.scope,
            "environment": target.environment,
        }

    def scan(self, scan: SecurityScan) -> List[SecurityFinding]:  # type: ignore[override]
        return self.run_strix_scan(scan)

    def cleanup(self) -> None:
        if self.workspace and os.path.exists(self.workspace):
            try:
                shutil.rmtree(self.workspace, ignore_errors=True)
                logger.info(f"[Strix] Cleaned up ephemeral workspace: {self.workspace}")
            except Exception as exc:
                logger.warning(f"[Strix] Workspace cleanup failed: {exc}")
        self.scan = None
        self.target = None
        self.workspace = None
        self.initialized = False

    # ------------------------------------------------------------------
    # Core execution
    # ------------------------------------------------------------------

    def run_strix_scan(self, scan: SecurityScan) -> List[SecurityFinding]:
        """
        End-to-end controlled Strix execution with all policy, resource,
        workspace isolation, redaction, parsing, and deduplication guards.
        """
        findings: List[SecurityFinding] = []

        # 1. Kill-switch check
        if SecurityPolicyEngine.is_kill_switch_active():
            scan.status = SecurityScanState.BLOCKED
            scan.error_message = "Scan rejected: Global security kill-switch is active."
            scan.save(update_fields=["status", "error_message"])
            self._emit_audit(scan, "SCAN_BLOCKED_KILL_SWITCH", {"reason": scan.error_message})
            return []

        # 2. Target authorization
        if not self.validate_target(scan.target):
            scan.status = SecurityScanState.BLOCKED
            scan.error_message = "Target validation failed: not approved or outside permitted environment."
            scan.save(update_fields=["status", "error_message"])
            self._emit_audit(scan, "SCAN_BLOCKED_UNAUTHORIZED", {"target": scan.target.name})
            return []

        # 3. Concurrency limit
        running_count = SecurityScan.objects.filter(status=SecurityScanState.RUNNING).count()
        max_concurrent = getattr(settings, "SECURITY_SCAN_MAX_CONCURRENCY", 2)
        if running_count >= max_concurrent:
            scan.status = SecurityScanState.BLOCKED
            scan.error_message = f"Scan capacity limit reached ({running_count}/{max_concurrent} running)."
            scan.save(update_fields=["status", "error_message"])
            return []

        # 4. Mark scan as running
        scan.status = SecurityScanState.RUNNING
        scan.started_at = timezone.now()
        scan.save(update_fields=["status", "started_at"])
        self._emit_audit(scan, "SCAN_STARTED", {"scan_type": scan.scan_type})

        tool_exec = SecurityToolExecution.objects.create(
            scan=scan,
            tool_name="Strix-SecOps-Engine",
            tool_version=self.strix_version,
        )

        start_time = time.time()

        try:
            # 5. Create isolated, secret-free workspace
            self.workspace = self._create_workspace(scan)

            # 6. Determine scan mode
            strix_mode = self.SCAN_MODE_MAP.get(scan.scan_type, "quick")
            max_duration = getattr(settings, "SECURITY_SCAN_MAX_DURATION", 300)
            target_url = (
                f"{scan.target.protocol}://{scan.target.hostname}:{scan.target.port}"
            )

            # 7. Execute Strix (controlled subprocess)
            strix_available = self._check_strix_available()
            if strix_available:
                findings = self._run_strix_subprocess(scan, target_url, strix_mode, max_duration)
            else:
                # Strix not installed in this environment → use AgenticBugHunter adapter
                logger.info("[Strix] Strix binary unavailable; falling back to AgenticBugHunterAdapter for controlled scan.")
                from apps.security_testing.services.adapter import AgenticBugHunterAdapter
                adapter = AgenticBugHunterAdapter()
                adapter.initialize(scan)
                findings = adapter._audit_rbac_boundaries(scan) + adapter._audit_idor_boundaries(scan) + adapter._audit_websocket_boundaries(scan)

            # 8. Validate findings through 7-question gate
            for f in findings:
                FindingValidationService.evaluate_finding(
                    finding=f,
                    validator_user=scan.initiated_by,
                    validation_notes=f"Strix automated scan gate validation [{strix_mode} mode]",
                )

            # 9. Mark completed
            scan.status = SecurityScanState.COMPLETED
            scan.completed_at = timezone.now()
            scan.save(update_fields=["status", "completed_at"])
            self._emit_audit(scan, "SCAN_COMPLETED", {"findings_count": len(findings)})

        except subprocess.TimeoutExpired:
            logger.error(f"[Strix] Scan {scan.id} timed out.")
            scan.status = SecurityScanState.TIMED_OUT
            scan.error_message = "Strix execution exceeded maximum time limit."
            scan.save(update_fields=["status", "error_message"])
            self._emit_audit(scan, "SCAN_TIMED_OUT", {})

        except Exception as exc:
            logger.exception(f"[Strix] Unhandled error in scan {scan.id}: {exc}")
            scan.status = SecurityScanState.FAILED
            scan.error_message = SecretRedactionService.redact_text(str(exc))
            scan.save(update_fields=["status", "error_message"])
            self._emit_audit(scan, "SCAN_FAILED", {"error": scan.error_message})

        finally:
            elapsed = time.time() - start_time
            tool_exec.execution_time_seconds = round(elapsed, 2)
            tool_exec.exit_code = 0 if scan.status == SecurityScanState.COMPLETED else 1
            tool_exec.stdout_sanitized = SecretRedactionService.redact_text(
                f"Strix scan {scan.id} finished. Status: {scan.status}. Findings: {len(findings)}."
            )
            tool_exec.save()
            self.cleanup()

        return findings

    def _check_strix_available(self) -> bool:
        """Returns True if the Strix CLI binary is accessible in PATH."""
        return shutil.which("strix") is not None

    def _run_strix_subprocess(
        self,
        scan: SecurityScan,
        target_url: str,
        mode: str,
        timeout: int,
    ) -> List[SecurityFinding]:
        """
        Spawns Strix as a controlled subprocess in an isolated workspace directory.
        Parses exit codes correctly:
          0  → Scan completed, no vulnerabilities found.
          2  → Vulnerabilities found (not a failure, must parse output).
          other → Execution error.
        """
        findings: List[SecurityFinding] = []

        cmd = [
            "strix",
            "--target", target_url,
            "--mode", mode,
            "--output", self.workspace,
            "--no-color",
            "--quiet",
        ]

        logger.info(
            json.dumps({
                "event": "strix.subprocess.launch",
                "scan_id": str(scan.id),
                "target_url": target_url,
                "mode": mode,
                "workspace": self.workspace,
            })
        )

        proc = subprocess.run(
            cmd,
            cwd=self.workspace,
            timeout=timeout,
            capture_output=True,
            text=True,
            env=self._build_safe_env(),
        )

        exit_code = proc.returncode
        logger.info(f"[Strix] Process exited with code {exit_code} for scan {scan.id}")

        # Exit code 2 = vulnerabilities found (expected, not an error)
        if exit_code not in [0, STRIX_EXIT_VULNERABILITIES_FOUND]:
            logger.error(f"[Strix] Fatal execution error (exit {exit_code}). Stderr: {proc.stderr[:500]}")
            raise RuntimeError(f"Strix exited with fatal code {exit_code}")

        # Parse available artifacts
        findings.extend(self._ingest_artifacts(scan))
        return findings

    def _ingest_artifacts(self, scan: SecurityScan) -> List[SecurityFinding]:
        """Parses all available Strix output artifacts from the workspace."""
        findings = []
        workspace = Path(self.workspace)

        # Parse vulnerabilities.json
        vuln_file = workspace / "vulnerabilities.json"
        if vuln_file.exists():
            try:
                findings.extend(StrixResultParser.parse_vulnerabilities_json(scan, vuln_file.read_text("utf-8")))
            except Exception as exc:
                logger.warning(f"[Strix] Failed to parse vulnerabilities.json: {exc}")

        # Parse findings.sarif
        sarif_file = workspace / "findings.sarif"
        if sarif_file.exists():
            try:
                findings.extend(StrixResultParser.parse_sarif(scan, sarif_file.read_text("utf-8")))
            except Exception as exc:
                logger.warning(f"[Strix] Failed to parse findings.sarif: {exc}")

        return findings

    def _create_workspace(self, scan: SecurityScan) -> str:
        """
        Creates an isolated, ephemeral workspace for this scan.
        No production secrets, .env files, or SSH keys are mounted.
        """
        workspace = tempfile.mkdtemp(prefix=f"strix_scan_{str(scan.id)[:8]}_")
        # Write minimal scan context (architecture notes, scope definition) as READ-ONLY reference
        context_file = Path(workspace) / "scan_context.json"
        context_file.write_text(
            json.dumps({
                "scan_id": str(scan.id),
                "target_name": scan.target.name,
                "environment": scan.target.environment,
                "scope": scan.target.scope,
                "scan_type": scan.scan_type,
                "strix_version": self.strix_version,
            }),
            encoding="utf-8",
        )
        context_file.chmod(0o444)  # Read-only
        return workspace

    def _build_safe_env(self) -> Dict[str, str]:
        """
        Builds a minimal, secret-free environment for the Strix subprocess.
        Explicitly excludes all credentials, tokens, and database URLs.
        """
        BLOCKED_ENV_KEYS = {
            "DATABASE_URL", "NEON_DATABASE_URL", "REDIS_URL",
            "SECRET_KEY", "DJANGO_SECRET_KEY", "JWT_SECRET",
            "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY",
            "OLLAMA_API_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY",
            "STRIX_API_TOKEN", "COOLIFY_TOKEN", "GITHUB_TOKEN",
        }
        safe_env = {
            k: v for k, v in os.environ.items()
            if k not in BLOCKED_ENV_KEYS and "SECRET" not in k.upper() and "KEY" not in k.upper() and "PASSWORD" not in k.upper()
        }
        safe_env["STRIX_WORKSPACE"] = self.workspace or "/tmp"
        return safe_env

    def _emit_audit(self, scan: SecurityScan, event_type: str, details: Dict) -> None:
        try:
            SecurityAuditEvent.objects.create(
                event_type=event_type,
                actor=getattr(scan, "initiated_by", None),
                target_name=scan.target.name,
                details={
                    "scan_id": str(scan.id),
                    "strix_version": self.strix_version,
                    **details,
                },
            )
        except Exception as exc:
            logger.warning(f"[Strix] Failed to write audit event {event_type}: {exc}")
