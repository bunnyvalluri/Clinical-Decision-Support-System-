"""
Synthetic Security Test Data Generator.
Ensures zero real patient PHI or production credentials are ever accessed by security testing agents.
All test fixtures use synthetic markers clearly tagged [SYNTHETIC_SECURITY_TEST].
"""
import uuid
from typing import Dict, Any


class SyntheticSecurityDataGenerator:
    """
    Generates synthetic patient, clinical vitals, and role tokens
    for safe internal DevSecOps security testing.
    """

    @classmethod
    def generate_synthetic_patient_payload(cls, index: int = 1) -> Dict[str, Any]:
        """Returns synthetic patient demographic and clinical payload."""
        return {
            "synthetic_id": str(uuid.uuid4()),
            "first_name": f"SyntheticPatient_{index}",
            "last_name": "TestSubject",
            "date_of_birth": "1980-01-01",
            "gender": "OTHER",
            "medical_record_number": f"SYN-MRN-99{index:04d}",
            "is_synthetic": True,
            "security_test_tag": "ENVIRONMENT_SECURITY_TEST",
        }

    @classmethod
    def generate_synthetic_vitals_payload(cls, risk_level: str = "HIGH") -> Dict[str, Any]:
        """Returns synthetic physiological vital signs for ML prediction endpoint tests."""
        if risk_level == "HIGH":
            return {
                "systolic_bp": 175,
                "diastolic_bp": 105,
                "heart_rate": 128,
                "respiratory_rate": 28,
                "oxygen_saturation": 88.0,
                "temperature": 39.2,
                "qsofa_score": 2,
                "is_synthetic": True,
            }
        return {
            "systolic_bp": 120,
            "diastolic_bp": 80,
            "heart_rate": 72,
            "respiratory_rate": 16,
            "oxygen_saturation": 98.5,
            "temperature": 36.8,
            "qsofa_score": 0,
            "is_synthetic": True,
        }

    @classmethod
    def generate_synthetic_role_credentials(cls) -> Dict[str, Dict[str, str]]:
        """Returns safe synthetic credential headers for 5-role RBAC testing."""
        return {
            "PATIENT": {
                "role": "PATIENT",
                "test_header": "X-Test-Role-Patient",
                "simulated_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiUEFUSUVOVCIsInN5bnRoZXRpYyI6dHJ1ZX0.mock_signature",
            },
            "DOCTOR": {
                "role": "DOCTOR",
                "test_header": "X-Test-Role-Doctor",
                "simulated_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiRE9DVE9SIiwic3ludGhldGljIjp0cnVlfQ.mock_signature",
            },
            "NURSE": {
                "role": "NURSE",
                "test_header": "X-Test-Role-Nurse",
                "simulated_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiTlVSU0UiLCJzeW50aGV0aWMiOnRydWV9.mock_signature",
            },
            "MEDICAL_INFORMATICIST": {
                "role": "MEDICAL_INFORMATICIST",
                "test_header": "X-Test-Role-Informaticist",
                "simulated_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiTUVESUNBTF9JTkZPUk1BVElDSVNUIiwic3ludGhldGljIjp0cnVlfQ.mock_signature",
            },
            "IT_ADMIN": {
                "role": "IT_ADMIN",
                "test_header": "X-Test-Role-Admin",
                "simulated_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiSVRfQURNSU4iLCJzeW50aGV0aWMiOnRydWV9.mock_signature",
            },
        }
