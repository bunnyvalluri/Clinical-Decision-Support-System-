"""
DiagnosticReport FHIR R4 Mapper — BPY-CSE-2666 (Partially Supported).
Translates between generated clinical reports / lab summaries and FHIR R4 DiagnosticReport.
"""
from typing import Any, Dict

from apps.reports.models import Report
from .base import BaseFHIRMapper


class DiagnosticReportFHIRMapper(BaseFHIRMapper):
    """
    Translates between reports.Report and FHIR R4 DiagnosticReport.
    """

    @classmethod
    def to_fhir(cls, report: Report) -> Dict[str, Any]:
        """Convert Report instance to FHIR R4 DiagnosticReport resource."""
        result_refs = []
        if report.prediction_id:
            result_refs.append({"reference": f"RiskAssessment/{report.prediction_id}"})

        return {
            "resourceType": "DiagnosticReport",
            "id": f"dr-{report.id}",
            "status": "final",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
                            "code": "LAB",
                            "display": "Laboratory",
                        }
                    ]
                }
            ],
            "code": {
                "coding": [
                    {
                        "system": "urn:oid:healthnova:report-types",
                        "code": report.report_type,
                        "display": report.get_report_type_display(),
                    }
                ],
                "text": report.get_report_type_display(),
            },
            "subject": {"reference": f"Patient/{report.patient_id}"},
            "effectiveDateTime": report.created_at.isoformat() if report.created_at else None,
            "issued": report.created_at.isoformat() if report.created_at else None,
            "result": result_refs,
        }

    @classmethod
    def to_internal(cls, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """Extract diagnostic report metadata."""
        patient_ref_id = cls.extract_reference_id(fhir_resource.get("subject"))
        code_obj = fhir_resource.get("code", {})
        code_text = code_obj.get("text", "Diagnostic Report")

        return {
            "patient_id": patient_ref_id,
            "title": code_text,
            "issued": cls.parse_datetime(fhir_resource.get("issued")),
        }
