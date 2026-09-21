"""
Patient FHIR R4 Mapper — BPY-CSE-2666.
Bi-directional translation between internal Patient model and FHIR R4 Patient resource.
"""
from typing import Any, Dict, List, Optional

from apps.interoperability.domain.exceptions import FHIRMappingError
from apps.patients.models import BloodGroup, Gender, Patient
from .base import BaseFHIRMapper


class PatientFHIRMapper(BaseFHIRMapper):
    """
    Translates between apps.patients.models.Patient and FHIR R4 Patient JSON.
    """

    GENDER_INTERNAL_TO_FHIR = {
        Gender.MALE: "male",
        Gender.FEMALE: "female",
        Gender.OTHER: "other",
        Gender.UNKNOWN: "unknown",
    }

    GENDER_FHIR_TO_INTERNAL = {
        "male": Gender.MALE,
        "female": Gender.FEMALE,
        "other": Gender.OTHER,
        "unknown": Gender.UNKNOWN,
    }

    @classmethod
    def to_fhir(cls, patient: Patient) -> Dict[str, Any]:
        """Convert Patient model to standard FHIR R4 Patient resource."""
        telecom: List[Dict[str, Any]] = []
        if patient.phone_number:
            telecom.append({"system": "phone", "value": patient.phone_number, "use": "mobile"})
        if patient.email:
            telecom.append({"system": "email", "value": patient.email, "use": "home"})

        fhir_patient: Dict[str, Any] = {
            "resourceType": "Patient",
            "id": str(patient.id),
            "identifier": [
                {
                    "use": "usual",
                    "type": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                                "code": "MR",
                                "display": "Medical Record Number",
                            }
                        ]
                    },
                    "system": "urn:oid:healthnova:mrn",
                    "value": patient.mrn,
                }
            ],
            "active": bool(patient.is_active),
            "name": [
                {
                    "use": "official",
                    "family": patient.last_name,
                    "given": [patient.first_name] if patient.first_name else [],
                }
            ],
            "gender": cls.GENDER_INTERNAL_TO_FHIR.get(patient.gender, "unknown"),
            "birthDate": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            "telecom": telecom,
        }

        if patient.address:
            fhir_patient["address"] = [{"use": "home", "text": patient.address}]

        if patient.emergency_contact_name:
            contact_telecom = []
            if patient.emergency_contact_phone:
                contact_telecom.append({"system": "phone", "value": patient.emergency_contact_phone})
            fhir_patient["contact"] = [
                {
                    "relationship": [
                        {
                            "text": patient.emergency_contact_relation or "Emergency Contact",
                        }
                    ],
                    "name": {"text": patient.emergency_contact_name},
                    "telecom": contact_telecom,
                }
            ]

        # Primary physician link if present
        if patient.primary_physician_id:
            fhir_patient["generalPractitioner"] = [
                {
                    "reference": f"Practitioner/{patient.primary_physician_id}",
                    "display": patient.primary_physician.get_full_name() if patient.primary_physician else None,
                }
            ]

        return fhir_patient

    @classmethod
    def to_internal(cls, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and normalize internal Patient fields from FHIR R4 Patient JSON."""
        # 1. Extract MRN
        identifiers = fhir_resource.get("identifier", [])
        mrn = cls.extract_identifier(identifiers, system="urn:oid:healthnova:mrn")
        if not mrn:
            mrn = cls.extract_identifier(identifiers, use="usual")
        if not mrn and identifiers and isinstance(identifiers, list):
            mrn = identifiers[0].get("value")

        # 2. Extract Name
        first_name = ""
        last_name = ""
        names = fhir_resource.get("name", [])
        if names and isinstance(names, list):
            name_obj = names[0]
            last_name = name_obj.get("family", "")
            givens = name_obj.get("given", [])
            first_name = " ".join(givens) if isinstance(givens, list) else str(givens)

        # 3. Extract Gender
        fhir_gender = str(fhir_resource.get("gender", "unknown")).lower()
        internal_gender = cls.GENDER_FHIR_TO_INTERNAL.get(fhir_gender, Gender.UNKNOWN)

        # 4. Extract Birth Date
        birth_date = cls.parse_date(fhir_resource.get("birthDate"))

        # 5. Extract Telecoms
        phone = ""
        email = ""
        for item in fhir_resource.get("telecom", []):
            if not isinstance(item, dict):
                continue
            system = item.get("system")
            val = item.get("value", "")
            if system == "phone" and not phone:
                phone = val
            elif system == "email" and not email:
                email = val

        # 6. Extract Address
        address = ""
        addresses = fhir_resource.get("address", [])
        if addresses and isinstance(addresses, list):
            addr_obj = addresses[0]
            address = addr_obj.get("text") or ", ".join(filter(None, [
                " ".join(addr_obj.get("line", [])),
                addr_obj.get("city"),
                addr_obj.get("state"),
                addr_obj.get("postalCode"),
                addr_obj.get("country"),
            ]))

        # 7. Extract Emergency Contact
        ec_name = ""
        ec_phone = ""
        ec_relation = ""
        contacts = fhir_resource.get("contact", [])
        if contacts and isinstance(contacts, list):
            contact_obj = contacts[0]
            name_val = contact_obj.get("name", {})
            ec_name = name_val.get("text") or name_val.get("family", "")
            for ct in contact_obj.get("telecom", []):
                if ct.get("system") == "phone":
                    ec_phone = ct.get("value", "")
                    break
            rels = contact_obj.get("relationship", [])
            if rels and isinstance(rels, list):
                ec_relation = rels[0].get("text") or rels[0].get("coding", [{}])[0].get("display", "")

        return {
            "mrn": mrn,
            "first_name": first_name.strip(),
            "last_name": last_name.strip(),
            "gender": internal_gender,
            "date_of_birth": birth_date,
            "phone_number": phone.strip(),
            "email": email.strip(),
            "address": address.strip(),
            "emergency_contact_name": ec_name.strip(),
            "emergency_contact_phone": ec_phone.strip(),
            "emergency_contact_relation": ec_relation.strip(),
            "is_active": fhir_resource.get("active", True),
        }
