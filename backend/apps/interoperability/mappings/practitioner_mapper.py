"""
Practitioner FHIR R4 Mapper — BPY-CSE-2666.
Bi-directional translation between internal User (clinician) model and FHIR R4 Practitioner.
"""
from typing import Any, Dict, List

from apps.accounts.models import User
from .base import BaseFHIRMapper


class PractitionerFHIRMapper(BaseFHIRMapper):
    """
    Translates between accounts.User (clinician staff) and FHIR R4 Practitioner.
    """

    @classmethod
    def to_fhir(cls, user: User) -> Dict[str, Any]:
        """Convert User instance to FHIR R4 Practitioner resource."""
        telecom: List[Dict[str, Any]] = []
        if user.email:
            telecom.append({"system": "email", "value": user.email, "use": "work"})
        if user.phone_number:
            telecom.append({"system": "phone", "value": user.phone_number, "use": "work"})

        fhir_practitioner: Dict[str, Any] = {
            "resourceType": "Practitioner",
            "id": str(user.id),
            "identifier": [
                {
                    "system": "urn:oid:healthnova:staff-id",
                    "value": str(user.id),
                }
            ],
            "active": bool(user.is_active),
            "name": [
                {
                    "use": "official",
                    "family": user.last_name,
                    "given": [user.first_name] if user.first_name else [],
                    "prefix": ["Dr."] if user.is_doctor else [],
                }
            ],
            "telecom": telecom,
        }

        if user.department or user.role:
            fhir_practitioner["qualification"] = [
                {
                    "code": {
                        "text": f"{user.get_role_display()} - {user.department or 'General'}",
                    }
                }
            ]

        return fhir_practitioner

    @classmethod
    def to_internal(cls, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """Extract clinician info from FHIR Practitioner."""
        names = fhir_resource.get("name", [])
        first_name = ""
        last_name = ""
        if names and isinstance(names, list):
            n = names[0]
            last_name = n.get("family", "")
            givens = n.get("given", [])
            first_name = " ".join(givens) if isinstance(givens, list) else str(givens)

        email = ""
        phone = ""
        for item in fhir_resource.get("telecom", []):
            if isinstance(item, dict):
                if item.get("system") == "email" and not email:
                    email = item.get("value", "")
                elif item.get("system") == "phone" and not phone:
                    phone = item.get("value", "")

        return {
            "first_name": first_name.strip(),
            "last_name": last_name.strip(),
            "email": email.strip(),
            "phone_number": phone.strip(),
            "is_active": fhir_resource.get("active", True),
        }
