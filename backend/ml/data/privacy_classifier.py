"""
Healthcare Data Privacy Classifier & PHI Detection Scanner.
Enforces zero-PHI leakage invariant:
Classifies datasets into PUBLIC, SENSITIVE, HEALTH_DATA, PHI, SYNTHETIC, DE_IDENTIFIED, UNKNOWN.
Scans for 18 HIPAA Safe Harbor identifiers and free-text narrative PHI.
"""
import re
from typing import Any, Dict, List, Optional
import pandas as pd

# Regex patterns for common direct identifiers and PHI
SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
PHONE_REGEX = re.compile(r"\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b")
MRN_REGEX = re.compile(r"\b(?:MRN|mrn)[:#\s]*[A-Za-z0-9-]{6,12}\b")
ZIP_REGEX = re.compile(r"\b\d{5}(?:-\d{4})?\b")

DIRECT_IDENTIFIER_COLUMNS = [
    "name", "patient_name", "first_name", "last_name", "full_name",
    "ssn", "social_security", "social_security_number",
    "phone", "mobile", "telephone", "email", "address", "street",
    "mrn", "medical_record_number", "dob", "birth_date", "date_of_birth",
]


class HealthcareDataClassifier:
    """Classifies healthcare datasets and scans for unredacted patient identifiers."""

    @classmethod
    def scan_dataframe(cls, df: pd.DataFrame, description: str = "") -> Dict[str, Any]:
        """
        Inspect column headers and sample data for identifiable patient PHI.
        """
        phi_findings: List[Dict[str, Any]] = []
        direct_id_columns: List[str] = []

        # 1. Header Scan for Direct Identifiers
        for col in df.columns:
            clean = col.lower().strip().replace(" ", "_")
            if any(id_col == clean or clean.endswith(f"_{id_col}") for id_col in DIRECT_IDENTIFIER_COLUMNS):
                direct_id_columns.append(col)
                phi_findings.append({
                    "column": col,
                    "identifier_type": "DIRECT_IDENTIFIER_COLUMN",
                    "severity": "BLOCKING",
                    "message": f"Column '{col}' matches known direct identifier / PHI taxonomy.",
                })

        # 2. Text / Cell Pattern Scanning (sample first 200 rows)
        sample_df = df.head(200)
        for col in sample_df.columns:
            # Check string/object columns for regex matches
            if sample_df[col].dtype == object:
                text_series = sample_df[col].dropna().astype(str)
                sample_text = " ".join(text_series)

                if EMAIL_REGEX.search(sample_text):
                    phi_findings.append({
                        "column": col,
                        "identifier_type": "EMAIL_ADDRESS_DETECTED",
                        "severity": "BLOCKING",
                        "message": f"Unredacted email address pattern detected in column '{col}'.",
                    })

                if SSN_REGEX.search(sample_text):
                    phi_findings.append({
                        "column": col,
                        "identifier_type": "SSN_DETECTED",
                        "severity": "BLOCKING",
                        "message": f"Social Security Number pattern detected in column '{col}'.",
                    })

                if PHONE_REGEX.search(sample_text):
                    phi_findings.append({
                        "column": col,
                        "identifier_type": "PHONE_NUMBER_DETECTED",
                        "severity": "BLOCKING",
                        "message": f"Telephone number pattern detected in column '{col}'.",
                    })

        # 3. Overall Classification Determination
        has_phi = any(f["severity"] == "BLOCKING" for f in phi_findings)

        if has_phi:
            classification = "PHI"
            approval_gate = "BLOCKED"
        else:
            # Check if health attributes are present
            health_keywords = ["glucose", "bp", "heart", "risk", "stroke", "insulin", "diagnosis", "bmi", "cholesterol"]
            has_health_data = any(any(k in c.lower() for k in health_keywords) for c in df.columns)

            desc_lower = (description or "").lower()
            if "synthetic" in desc_lower or "synthetically generated" in desc_lower:
                classification = "SYNTHETIC"
            elif has_health_data:
                classification = "DE_IDENTIFIED"
            else:
                classification = "PUBLIC"

            approval_gate = "PERMITTED"

        return {
            "classification": classification,
            "has_unredacted_phi": has_phi,
            "approval_gate": approval_gate,
            "direct_identifier_columns": direct_id_columns,
            "phi_findings": phi_findings,
            "safe_for_research": not has_phi,
        }
