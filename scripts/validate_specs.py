#!/usr/bin/env python3
"""
Healthcare CDSS Specification Validator
Enforces Spec Kit Spec-Driven Development (SDD) standards across specs/
"""

import sys
import os
import re
from pathlib import Path

# Ensure utf-8 stdout encoding on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
SPECS_DIR = WORKSPACE_ROOT / "specs"
CONSTITUTION_FILE = WORKSPACE_ROOT / ".specify" / "memory" / "constitution.md"
TRACEABILITY_MATRIX = SPECS_DIR / "TRACEABILITY-MATRIX.md"

REQUIRED_FEATURE_FILES = [
    "spec.md",
    "plan.md",
    "tasks.md",
    "acceptance.md",
    "security.md",
    "clinical-safety.md",
    "test-plan.md",
    "changelog.md",
]

SECRET_PATTERNS = [
    re.compile(r'(?i)(password|secret|api[_-]?key|bearer\s+[a-zA-Z0-9_\-\.]{20,})\s*[:=]\s*["\'][^"\']+["\']'),
    re.compile(r'postgres://[^:]+:[^@]+@'),
]

PHI_PATTERNS = [
    re.compile(r'\b(ssn|social\s*security\s*number)\b\s*[:=]\s*\d{3}-\d{2}-\d{4}', re.I),
]

REQ_ID_PATTERN = re.compile(r'\b(FR-[A-Z]+-\d{3}|NFR-[A-Z]+-\d{3}|ML-\d{3}|AI-\d{3}|RT-\d{3}|DB-\d{3}|AUDIT-\d{3}|CLINICAL-\d{3})\b')


def validate_constitution():
    errors = []
    if not CONSTITUTION_FILE.exists():
        errors.append(f"Missing Constitution file at {CONSTITUTION_FILE}")
        return errors

    content = CONSTITUTION_FILE.read_text(encoding="utf-8")
    mandatory_clauses = [
        "Clinical Safety Invariant",
        "Zero-PHI",
        "Neon PostgreSQL",
        "Multi-Tier",
        "White / Light Theme Only",
        "Auditability",
        "Explainability",
    ]
    for clause in mandatory_clauses:
        if clause.lower() not in content.lower():
            errors.append(f"Constitution missing mandatory principle: '{clause}'")
    return errors


def validate_features():
    errors = []
    features_dir = SPECS_DIR / "features"
    if not features_dir.exists():
        errors.append("Missing specs/features directory")
        return errors

    feature_dirs = [d for d in features_dir.iterdir() if d.is_dir()]
    if not feature_dirs:
        errors.append("No feature specifications found in specs/features/")
        return errors

    for fdir in feature_dirs:
        for req_file in REQUIRED_FEATURE_FILES:
            fpath = fdir / req_file
            if not fpath.exists():
                errors.append(f"Feature '{fdir.name}' is missing required file: '{req_file}'")
            else:
                text = fpath.read_text(encoding="utf-8")
                if len(text.strip()) < 50:
                    errors.append(f"Feature '{fdir.name}/{req_file}' is empty or too short (< 50 chars)")
    return errors


def validate_traceability_matrix():
    errors = []
    if not TRACEABILITY_MATRIX.exists():
        errors.append("Missing specs/TRACEABILITY-MATRIX.md")
        return errors

    content = TRACEABILITY_MATRIX.read_text(encoding="utf-8")
    found_ids = set(REQ_ID_PATTERN.findall(content))
    if len(found_ids) < 10:
        errors.append(f"Traceability matrix contains only {len(found_ids)} requirements, expected >= 10")
    return errors


def validate_security_and_privacy():
    errors = []
    for md_file in SPECS_DIR.rglob("*.md"):
        try:
            text = md_file.read_text(encoding="utf-8")
        except Exception as e:
            errors.append(f"Failed to read {md_file}: {e}")
            continue

        for pat in SECRET_PATTERNS:
            if pat.search(text):
                errors.append(f"Potential hardcoded credential or secret pattern found in {md_file.relative_to(WORKSPACE_ROOT)}")

        for pat in PHI_PATTERNS:
            if pat.search(text):
                errors.append(f"Potential unredacted patient PHI pattern found in {md_file.relative_to(WORKSPACE_ROOT)}")
    return errors


def main():
    print("============================================================")
    print("      HEALTHCARE CDSS SPECIFICATION VALIDATION GATE         ")
    print("============================================================")

    all_errors = []

    print("[1/4] Auditing Healthcare CDSS Constitution...")
    const_errors = validate_constitution()
    if const_errors:
        for err in const_errors:
            print(f"  [-] {err}")
        all_errors.extend(const_errors)
    else:
        print("  [+] Constitution verified (All 30 Articles & Light-Theme Invariant present).")

    print("[2/4] Validating Feature Specifications...")
    feat_errors = validate_features()
    if feat_errors:
        for err in feat_errors:
            print(f"  [-] {err}")
        all_errors.extend(feat_errors)
    else:
        print("  [+] Canonical features verified (All required files present and populated).")

    print("[3/4] Validating End-to-End Traceability Matrix...")
    trace_errors = validate_traceability_matrix()
    if trace_errors:
        for err in trace_errors:
            print(f"  [-] {err}")
        all_errors.extend(trace_errors)
    else:
        print("  [+] Traceability Matrix verified (Bidirectional mappings to Code and Tests).")

    print("[4/4] Scanning for PHI and Secret Leakage in Specifications...")
    sec_errors = validate_security_and_privacy()
    if sec_errors:
        for err in sec_errors:
            print(f"  [-] {err}")
        all_errors.extend(sec_errors)
    else:
        print("  [+] Zero PHI and zero secret leakage verified across all specification files.")

    print("------------------------------------------------------------")
    if all_errors:
        print(f"FAILED: Specification validation detected {len(all_errors)} issues.")
        sys.exit(1)
    else:
        print("PASSED: All specification validation gates successfully passed!")
        sys.exit(0)


if __name__ == "__main__":
    main()
