"""
ServiceRequest FHIR R4 Mapper — BPY-CSE-2666 (Partially Supported).
Translates between ClinicalTask bedside orders and FHIR R4 ServiceRequest.
"""
from typing import Any, Dict

from apps.clinical.models import ClinicalTask, TaskPriority, TaskStatus, TaskType
from .base import BaseFHIRMapper


class ServiceRequestFHIRMapper(BaseFHIRMapper):
    """
    Translates between clinical.ClinicalTask and FHIR R4 ServiceRequest.
    """

    PRIORITY_MAP_INTERNAL_TO_FHIR = {
        TaskPriority.ROUTINE: "routine",
        TaskPriority.URGENT: "urgent",
        TaskPriority.STAT: "stat",
    }

    PRIORITY_MAP_FHIR_TO_INTERNAL = {
        "routine": TaskPriority.ROUTINE,
        "urgent": TaskPriority.URGENT,
        "asap": TaskPriority.URGENT,
        "stat": TaskPriority.STAT,
    }

    STATUS_MAP_INTERNAL_TO_FHIR = {
        TaskStatus.PENDING: "active",
        TaskStatus.IN_PROGRESS: "active",
        TaskStatus.COMPLETED: "completed",
    }

    @classmethod
    def to_fhir(cls, task: ClinicalTask) -> Dict[str, Any]:
        """Convert ClinicalTask to FHIR R4 ServiceRequest."""
        return {
            "resourceType": "ServiceRequest",
            "id": f"task-{task.id}",
            "status": cls.STATUS_MAP_INTERNAL_TO_FHIR.get(task.status, "active"),
            "intent": "order",
            "priority": cls.PRIORITY_MAP_INTERNAL_TO_FHIR.get(task.priority, "routine"),
            "code": {
                "coding": [
                    {
                        "system": "urn:oid:healthnova:task-types",
                        "code": task.task_type,
                        "display": task.get_task_type_display(),
                    }
                ],
                "text": task.title,
            },
            "subject": {"reference": f"Patient/{task.patient_id}"},
            "authoredOn": task.created_at.isoformat() if task.created_at else None,
            "occurrenceDateTime": task.due_at.isoformat() if task.due_at else None,
            "note": [{"text": task.notes}] if task.notes else [],
        }

    @classmethod
    def to_internal(cls, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """Parse FHIR ServiceRequest into dictionary for ClinicalTask."""
        patient_ref_id = cls.extract_reference_id(fhir_resource.get("subject"))
        priority_str = fhir_resource.get("priority", "routine").lower()
        internal_priority = cls.PRIORITY_MAP_FHIR_TO_INTERNAL.get(priority_str, TaskPriority.ROUTINE)

        code_obj = fhir_resource.get("code", {})
        title = code_obj.get("text", "Clinical Service Request")
        notes = ""
        for n in fhir_resource.get("note", []):
            if isinstance(n, dict) and "text" in n:
                notes += n["text"] + "\n"

        return {
            "patient_id": patient_ref_id,
            "title": title.strip(),
            "priority": internal_priority,
            "notes": notes.strip(),
            "due_at": cls.parse_datetime(fhir_resource.get("occurrenceDateTime")),
        }
