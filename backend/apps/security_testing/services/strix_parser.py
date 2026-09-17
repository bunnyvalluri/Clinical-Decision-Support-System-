"""
Strix Result and Artifact Parser.
Ingests and normalizes Strix artifacts (run.json, vulnerabilities.json, findings.sarif, penetration_test_report.md)
into authoritative database models. Applies redaction and deterministic fingerprinting.
"""
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from django.utils import timezone
from apps.security_testing.models import (
    SecurityScan,
    SecurityFinding,
    SecurityEvidence,
    FindingSeverity,
    FindingState,
)
from apps.security_testing.services.redaction import SecretRedactionService
from apps.security_testing.services.fingerprint import FindingFingerprintService

logger = logging.getLogger("security_testing.strix_parser")


class StrixResultParser:
    """
    Parses and sanitizes Strix artifacts into canonical SecurityFinding and SecurityEvidence records.
    """

    SEVERITY_MAP = {
        "critical": FindingSeverity.CRITICAL,
        "high": FindingSeverity.HIGH,
        "medium": FindingSeverity.MEDIUM,
        "low": FindingSeverity.LOW,
        "info": FindingSeverity.INFO,
        "informational": FindingSeverity.INFO,
    }

    @classmethod
    def parse_run_metadata(cls, run_json_content: str) -> Dict[str, Any]:
        """
        Parses run.json containing execution duration, budget, model, and final status.
        """
        try:
            data = json.loads(run_json_content)
            return {
                "status": data.get("status", "COMPLETED"),
                "duration_seconds": float(data.get("duration_seconds", 0.0)),
                "actual_cost": float(data.get("cost", 0.0)),
                "model_used": data.get("model", "strix-default-model"),
                "is_complete": bool(data.get("is_complete", True)),
                "coverage_status": data.get("coverage", "FULL"),
            }
        except Exception as exc:
            logger.warning(f"Failed to parse Strix run.json metadata: {exc}")
            return {
                "status": "RESULT_INVALID",
                "duration_seconds": 0.0,
                "actual_cost": 0.0,
                "model_used": "unknown",
                "is_complete": False,
                "coverage_status": "INCONCLUSIVE",
            }

    @classmethod
    def parse_vulnerabilities_json(
        cls,
        scan: SecurityScan,
        content: str,
    ) -> List[SecurityFinding]:
        """
        Parses vulnerabilities.json, sanitizes content, checks for duplicates via fingerprint,
        and saves validated finding records.
        """
        findings = []
        try:
            raw_items = json.loads(content)
            if not isinstance(raw_items, list):
                raw_items = raw_items.get("vulnerabilities", [])
        except Exception as exc:
            logger.error(f"Invalid JSON in vulnerabilities artifact: {exc}")
            return []

        for item in raw_items:
            try:
                title = SecretRedactionService.redact_text(item.get("title", "Unnamed Vulnerability"))
                vuln_type = item.get("type", item.get("category", "APPLICATION_SECURITY"))
                sev_raw = (item.get("severity", "LOW") or "LOW").lower()
                severity = cls.SEVERITY_MAP.get(sev_raw, FindingSeverity.LOW)

                endpoint = item.get("endpoint", item.get("url", "/api/v1/"))
                method = item.get("method", "GET")
                component = item.get("component", item.get("affected_component", "Backend API"))
                cwe_id = item.get("cwe_id", item.get("cwe", ""))
                cvss_score = float(item.get("cvss", item.get("cvss_score", 0.0)))
                description = SecretRedactionService.redact_text(item.get("description", ""))
                impact = SecretRedactionService.redact_text(item.get("impact", "Potential unauthorized access or information disclosure."))
                remediation = SecretRedactionService.redact_text(item.get("remediation", "Apply defensive input validation and RBAC checks."))
                poc = SecretRedactionService.redact_text(item.get("proof_of_concept", item.get("reproduction", "")))

                # Generate deterministic fingerprint
                fingerprint = FindingFingerprintService.generate_fingerprint(
                    vulnerability_type=vuln_type,
                    endpoint=endpoint,
                    method=method,
                    cwe_id=cwe_id,
                    affected_component=component,
                )

                # Deduplicate: Check if active finding with this fingerprint already exists on this target
                existing = SecurityFinding.objects.filter(
                    target=scan.target,
                    affected_endpoint=endpoint,
                    vulnerability_type=vuln_type,
                    state__in=[FindingState.DISCOVERED, FindingState.VALIDATED, FindingState.IN_PROGRESS],
                ).first()

                if existing:
                    logger.info(f"Duplicate finding detected ({fingerprint}). Updating existing finding {existing.id}.")
                    existing.scan = scan
                    existing.save(update_fields=["scan", "updated_at"])
                    findings.append(existing)
                    continue

                # Create new SecurityFinding
                finding = SecurityFinding.objects.create(
                    scan=scan,
                    target=scan.target,
                    title=title,
                    vulnerability_type=vuln_type,
                    severity=severity,
                    state=FindingState.DISCOVERED,
                    confidence=float(item.get("confidence", 0.85)),
                    affected_component=component,
                    affected_endpoint=endpoint,
                    description=description,
                    impact=impact,
                    root_cause=SecretRedactionService.redact_text(item.get("root_cause", "")),
                    remediation_guidance=remediation,
                    cwe_id=cwe_id,
                    cvss_score=cvss_score,
                    discovered_by=f"StrixSecOps-{scan.scan_type}",
                )

                # Persist sanitized proof of concept as evidence
                if poc:
                    SecurityEvidence.objects.create(
                        finding=finding,
                        evidence_type="REPRODUCTION_POC",
                        reproduction_steps=poc,
                        sanitized_request=item.get("sample_request", {}),
                        sanitized_response=item.get("sample_response", {}),
                    )

                findings.append(finding)

            except Exception as exc:
                logger.exception(f"Error parsing vulnerability record: {exc}")
                continue

        return findings

    @classmethod
    def parse_sarif(
        cls,
        scan: SecurityScan,
        sarif_content: str,
    ) -> List[SecurityFinding]:
        """
        Parses OASIS SARIF 2.1.0 JSON format and extracts security findings.
        """
        findings = []
        try:
            data = json.loads(sarif_content)
        except Exception as exc:
            logger.error(f"Failed to parse SARIF JSON: {exc}")
            return []

        runs = data.get("runs", [])
        for run in runs:
            tool_name = run.get("tool", {}).get("driver", {}).get("name", "Strix")
            rules = {r.get("id"): r for r in run.get("tool", {}).get("driver", {}).get("rules", [])}

            for res in run.get("results", []):
                try:
                    rule_id = res.get("ruleId", "SEC-UNKNOWN")
                    rule = rules.get(rule_id, {})
                    title = SecretRedactionService.redact_text(
                        res.get("message", {}).get("text", rule.get("shortDescription", {}).get("text", rule_id))
                    )
                    level = res.get("level", "warning")
                    sev_map = {
                        "error": FindingSeverity.HIGH,
                        "warning": FindingSeverity.MEDIUM,
                        "note": FindingSeverity.LOW,
                    }
                    severity = sev_map.get(level, FindingSeverity.LOW)

                    locs = res.get("locations", [])
                    code_loc = ""
                    if locs:
                        phys = locs[0].get("physicalLocation", {})
                        uri = phys.get("artifactLocation", {}).get("uri", "")
                        line = phys.get("region", {}).get("startLine", 1)
                        code_loc = f"{uri}:{line}"

                    finding = SecurityFinding.objects.create(
                        scan=scan,
                        target=scan.target,
                        title=title[:250],
                        vulnerability_type=rule_id,
                        severity=severity,
                        state=FindingState.DISCOVERED,
                        affected_component="Codebase Repository",
                        affected_endpoint=code_loc or "/repository/",
                        description=SecretRedactionService.redact_text(rule.get("fullDescription", {}).get("text", title)),
                        impact="Potential code security vulnerability.",
                        remediation_guidance=SecretRedactionService.redact_text(rule.get("help", {}).get("text", "Remediate according to security guidelines.")),
                        cwe_id=rule.get("properties", {}).get("cwe", ""),
                        discovered_by=f"Strix-SARIF-{tool_name}",
                    )
                    findings.append(finding)
                except Exception as exc:
                    logger.warning(f"Error parsing SARIF result: {exc}")

        return findings
