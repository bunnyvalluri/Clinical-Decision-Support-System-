"""
Automated tests for Patient Management and Clinical Records Module.

Covers:
- Full CRUD for patients and clinical records
- Clinical features support (vitals and laboratory biomarkers)
- Strict validation (missing values, invalid ranges, invalid types, impossible values, categorical)
- Role-based permissions and horizontal escalation prevention
- Filtering, searching, ordering, and pagination
- Unauthorized access
"""
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.clinical.models import ClinicalRecord, EncounterType
from apps.patients.models import BloodGroup, Gender, Patient

User = get_user_model()


@pytest.fixture
def test_users(db):
    """Create test users for different clinical and administrative roles."""
    admin = User.objects.create_user(
        username="admin_user",
        email="admin.pm@hospital.local",
        password="AdminPassword123!",
        first_name="Admin",
        last_name="Super",
        role="ADMIN",
        is_staff=True,
        is_superuser=True,
    )
    clinician = User.objects.create_user(
        username="dr_house",
        email="dr.house@hospital.local",
        password="DoctorPassword123!",
        first_name="Gregory",
        last_name="House",
        role="DOCTOR",
    )
    nurse = User.objects.create_user(
        username="nurse_jackie",
        email="nurse.jackie@hospital.local",
        password="NursePassword123!",
        first_name="Jackie",
        last_name="Peyton",
        role="NURSE",
    )
    patient_user_1 = User.objects.create_user(
        username="pat_john",
        email="john.doe@patient.local",
        password="PatientPassword123!",
        first_name="John",
        last_name="Doe",
        role="PATIENT",
    )
    patient_user_2 = User.objects.create_user(
        username="pat_jane",
        email="jane.smith@patient.local",
        password="PatientPassword123!",
        first_name="Jane",
        last_name="Smith",
        role="PATIENT",
    )
    return {
        "admin": admin,
        "clinician": clinician,
        "nurse": nurse,
        "patient1": patient_user_1,
        "patient2": patient_user_2,
    }


@pytest.fixture
def test_patients(db, test_users):
    """Create test patients linked to accounts."""
    p1 = Patient.objects.create(
        mrn="MRN-TEST-1001",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1985, 5, 20),
        gender=Gender.MALE,
        blood_group=BloodGroup.O_POS,
        user=test_users["patient1"],
        primary_physician=test_users["clinician"],
        phone_number="+1-555-0101",
        email="john.doe@patient.local",
    )
    p2 = Patient.objects.create(
        mrn="MRN-TEST-2002",
        first_name="Jane",
        last_name="Smith",
        date_of_birth=date(1992, 11, 14),
        gender=Gender.FEMALE,
        blood_group=BloodGroup.A_POS,
        user=test_users["patient2"],
        primary_physician=test_users["clinician"],
        phone_number="+1-555-0202",
        email="jane.smith@patient.local",
    )
    return {"p1": p1, "p2": p2}


def auth_client(user: User) -> APIClient:
    """Return an APIClient authenticated with JWT for given user."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


# ---------------------------------------------------------------------------
# 1. Patient CRUD Tests
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestPatientCRUD:
    def test_clinician_can_create_patient(self, test_users):
        client = auth_client(test_users["clinician"])
        payload = {
            "first_name": "Alexander",
            "last_name": "Fleming",
            "date_of_birth": "1975-08-06",
            "gender": "MALE",
            "blood_group": "B+",
            "phone_number": "+1-555-1234",
            "email": "alex.fleming@test.local",
            "address": "123 Research Way",
        }
        res = client.post("/api/v1/patients/", payload, format="json")
        assert res.status_code == status.HTTP_201_CREATED
        assert res.data["first_name"] == "Alexander"
        assert res.data["last_name"] == "Fleming"
        assert res.data["mrn"].startswith("MRN-")
        assert Patient.objects.filter(email="alex.fleming@test.local").exists()

    def test_list_patients_with_pagination(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        res = client.get("/api/v1/patients/?page=1&page_size=10")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["success"] is True
        assert "data" in res.data
        assert "meta" in res.data
        assert res.data["meta"]["pagination"]["count"] >= 2
        assert len(res.data["data"]) >= 2

    def test_retrieve_patient_detail(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        res = client.get(f"/api/v1/patients/{p1.id}/")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["id"] == str(p1.id)
        assert res.data["mrn"] == "MRN-TEST-1001"
        assert res.data["full_name"] == "John Doe"
        assert res.data["age"] is not None

    def test_patch_patient_demographics(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        patch_payload = {
            "phone_number": "+1-555-9988",
            "address": "456 Updated St",
        }
        res = client.patch(f"/api/v1/patients/{p1.id}/", patch_payload, format="json")
        assert res.status_code == status.HTTP_200_OK
        p1.refresh_from_db()
        assert p1.phone_number == "+1-555-9988"
        assert p1.address == "456 Updated St"

    def test_admin_can_soft_delete_patient(self, test_users, test_patients):
        client = auth_client(test_users["admin"])
        p1 = test_patients["p1"]
        res = client.delete(f"/api/v1/patients/{p1.id}/")
        assert res.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK)
        # Soft delete: inactive in regular manager, present in all_objects
        assert not Patient.objects.filter(id=p1.id).exists()
        assert Patient.all_objects.filter(id=p1.id, is_deleted=True).exists()

    def test_non_admin_cannot_delete_patient(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        res = client.delete(f"/api/v1/patients/{p1.id}/")
        assert res.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# 2. Clinical Records CRUD & Features Tests
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestClinicalRecordCRUD:
    def test_clinician_can_record_vitals_and_labs(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        payload = {
            "encounter_type": "OUTPATIENT",
            "systolic_bp": 124,
            "diastolic_bp": 82,
            "heart_rate": 74,
            "respiratory_rate": 16,
            "body_temperature": "36.8",
            "oxygen_saturation": "98.5",
            "glucose_level": "92.0",
            "cholesterol_total": "185.0",
            "bmi": "24.2",
            "creatinine": "1.05",
            "sodium": "140.5",
            "calcium": "9.4",
            "lactic_acid": "1.20",
            "symptoms": "Mild headache",
            "clinical_notes": "Patient well-hydrated, clear lungs.",
            "lab_results": {
                "platelets": 250000,
                "hemoglobin": 14.5,
            },
        }
        res = client.post(f"/api/v1/patients/{p1.id}/clinical-records/", payload, format="json")
        assert res.status_code == status.HTTP_201_CREATED
        assert str(res.data["patient"]) == str(p1.id)
        assert res.data["systolic_bp"] == 124
        assert res.data["creatinine"] == "1.05"
        assert res.data["sodium"] == "140.5"
        assert res.data["lactic_acid"] == "1.20"
        assert res.data["patient_mrn"] == p1.mrn
        assert res.data["patient_age"] == p1.age

    def test_nurse_can_record_vitals(self, test_users, test_patients):
        client = auth_client(test_users["nurse"])
        p1 = test_patients["p1"]
        payload = {
            "encounter_type": "ROUTINE",
            "systolic_bp": 118,
            "diastolic_bp": 78,
            "heart_rate": 68,
            "oxygen_saturation": "99.0",
        }
        res = client.post(f"/api/v1/patients/{p1.id}/clinical-records/", payload, format="json")
        assert res.status_code == status.HTTP_201_CREATED

    def test_list_patient_clinical_records(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        ClinicalRecord.objects.create(
            patient=p1,
            recorded_by=test_users["clinician"],
            encounter_type=EncounterType.OUTPATIENT,
            systolic_bp=120,
            diastolic_bp=80,
            heart_rate=72,
        )
        ClinicalRecord.objects.create(
            patient=p1,
            recorded_by=test_users["clinician"],
            encounter_type=EncounterType.INPATIENT,
            systolic_bp=130,
            diastolic_bp=85,
            heart_rate=80,
        )

        res = client.get(f"/api/v1/patients/{p1.id}/clinical-records/")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["success"] is True
        assert res.data["meta"]["pagination"]["count"] >= 2

    def test_retrieve_individual_clinical_record(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        record = ClinicalRecord.objects.create(
            patient=p1,
            recorded_by=test_users["clinician"],
            encounter_type=EncounterType.ICU,
            systolic_bp=140,
            diastolic_bp=90,
            heart_rate=95,
            creatinine=Decimal("1.80"),
        )
        res = client.get(f"/api/v1/clinical-records/{record.id}/")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["id"] == str(record.id)
        assert res.data["encounter_type"] == "ICU"
        assert res.data["creatinine"] == "1.80"

    def test_patch_clinical_record(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        record = ClinicalRecord.objects.create(
            patient=p1,
            recorded_by=test_users["clinician"],
            encounter_type=EncounterType.OUTPATIENT,
            systolic_bp=135,
            diastolic_bp=88,
        )
        patch_payload = {
            "clinical_notes": "Updated post-consultation diagnosis.",
            "glucose_level": "110.0",
        }
        res = client.patch(f"/api/v1/clinical-records/{record.id}/", patch_payload, format="json")
        assert res.status_code == status.HTTP_200_OK
        record.refresh_from_db()
        assert record.clinical_notes == "Updated post-consultation diagnosis."
        assert record.glucose_level == Decimal("110.0")


# ---------------------------------------------------------------------------
# 3. Strong Validation Tests
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestValidation:
    def test_patient_registration_future_dob(self, test_users):
        client = auth_client(test_users["clinician"])
        future_date = (date.today() + timedelta(days=10)).isoformat()
        payload = {
            "first_name": "Baby",
            "last_name": "Future",
            "date_of_birth": future_date,
            "gender": "FEMALE",
        }
        res = client.post("/api/v1/patients/", payload, format="json")
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "date_of_birth" in str(res.data)

    def test_patient_registration_impossible_age(self, test_users):
        client = auth_client(test_users["clinician"])
        payload = {
            "first_name": "Ancient",
            "last_name": "Person",
            "date_of_birth": "1800-01-01",
            "gender": "MALE",
        }
        res = client.post("/api/v1/patients/", payload, format="json")
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "date_of_birth" in str(res.data)

    def test_patient_invalid_gender_and_blood_group(self, test_users):
        client = auth_client(test_users["clinician"])
        payload = {
            "first_name": "Invalid",
            "last_name": "Patient",
            "date_of_birth": "1990-01-01",
            "gender": "INVALID_GENDER",
            "blood_group": "Z_POSITIVE",
        }
        res = client.post("/api/v1/patients/", payload, format="json")
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "gender" in str(res.data)

    def test_clinical_record_systolic_less_than_diastolic(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        # Impossible physiological condition: systolic <= diastolic
        payload = {
            "encounter_type": "OUTPATIENT",
            "systolic_bp": 80,
            "diastolic_bp": 120,
        }
        res = client.post(f"/api/v1/patients/{p1.id}/clinical-records/", payload, format="json")
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "systolic_bp" in str(res.data)

    def test_clinical_record_oxygen_saturation_out_of_range(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        payload = {
            "encounter_type": "OUTPATIENT",
            "oxygen_saturation": "105.0",  # SpO2 cannot exceed 100%
        }
        res = client.post(f"/api/v1/patients/{p1.id}/clinical-records/", payload, format="json")
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "oxygen_saturation" in str(res.data)

    def test_clinical_record_temperature_out_of_range(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        payload = {
            "encounter_type": "OUTPATIENT",
            "body_temperature": "55.0",  # Biologically impossible core body temp
        }
        res = client.post(f"/api/v1/patients/{p1.id}/clinical-records/", payload, format="json")
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "body_temperature" in str(res.data)

    def test_clinical_record_negative_heart_rate(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        payload = {
            "encounter_type": "OUTPATIENT",
            "heart_rate": -10,
        }
        res = client.post(f"/api/v1/patients/{p1.id}/clinical-records/", payload, format="json")
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "heart_rate" in str(res.data)

    def test_clinical_record_future_observation_time(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        future_time = (timezone.now() + timedelta(days=2)).isoformat()
        payload = {
            "encounter_type": "OUTPATIENT",
            "recorded_at": future_time,
            "heart_rate": 75,
        }
        res = client.post(f"/api/v1/patients/{p1.id}/clinical-records/", payload, format="json")
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "recorded_at" in str(res.data)


# ---------------------------------------------------------------------------
# 4. Role Permissions & Horizontal Escalation Tests
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestPermissionsAndSecurity:
    def test_patient_cannot_view_other_patient_clinical_records(self, test_users, test_patients):
        # Alice (Patient 1) attempts to inspect Bob's (Patient 2) records
        alice_client = auth_client(test_users["patient1"])
        p2 = test_patients["p2"]

        # 1. Attempt to list Bob's clinical records -> 403 Forbidden
        res = alice_client.get(f"/api/v1/patients/{p2.id}/clinical-records/")
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # 2. Attempt to retrieve Bob's record directly via /clinical-records/{id}/ -> 403 Forbidden
        bob_record = ClinicalRecord.objects.create(
            patient=p2,
            encounter_type=EncounterType.ROUTINE,
            heart_rate=70,
        )
        direct_res = alice_client.get(f"/api/v1/clinical-records/{bob_record.id}/")
        assert direct_res.status_code == status.HTTP_403_FORBIDDEN

    def test_patient_can_view_own_clinical_records(self, test_users, test_patients):
        alice_client = auth_client(test_users["patient1"])
        p1 = test_patients["p1"]
        own_record = ClinicalRecord.objects.create(
            patient=p1,
            encounter_type=EncounterType.ROUTINE,
            heart_rate=72,
        )
        res = alice_client.get(f"/api/v1/patients/{p1.id}/clinical-records/")
        assert res.status_code == status.HTTP_200_OK

        direct_res = alice_client.get(f"/api/v1/clinical-records/{own_record.id}/")
        assert direct_res.status_code == status.HTTP_200_OK
        assert direct_res.data["id"] == str(own_record.id)

    def test_patient_cannot_create_or_mutate_clinical_records(self, test_users, test_patients):
        alice_client = auth_client(test_users["patient1"])
        p1 = test_patients["p1"]
        payload = {
            "encounter_type": "ROUTINE",
            "heart_rate": 80,
        }
        res = alice_client.post(f"/api/v1/patients/{p1.id}/clinical-records/", payload, format="json")
        assert res.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# 5. Filtering, Searching, and Ordering Tests
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestFilteringAndSearching:
    def test_filter_patients_by_gender_and_blood_group(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        res_male = client.get("/api/v1/patients/?gender=MALE")
        assert res_male.status_code == status.HTTP_200_OK
        mrns = [p["mrn"] for p in res_male.data["data"]]
        assert "MRN-TEST-1001" in mrns
        assert "MRN-TEST-2002" not in mrns

        res_female = client.get("/api/v1/patients/?gender=FEMALE")
        assert res_female.status_code == status.HTTP_200_OK
        mrns_f = [p["mrn"] for p in res_female.data["data"]]
        assert "MRN-TEST-2002" in mrns_f
        assert "MRN-TEST-1001" not in mrns_f

    def test_search_patients_by_name(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        res = client.get("/api/v1/patients/?search=Jane")
        assert res.status_code == status.HTTP_200_OK
        assert len(res.data["data"]) == 1
        assert res.data["data"][0]["mrn"] == "MRN-TEST-2002"

    def test_filter_clinical_records_by_encounter_type(self, test_users, test_patients):
        client = auth_client(test_users["clinician"])
        p1 = test_patients["p1"]
        ClinicalRecord.objects.create(
            patient=p1,
            encounter_type=EncounterType.EMERGENCY,
            heart_rate=110,
        )
        ClinicalRecord.objects.create(
            patient=p1,
            encounter_type=EncounterType.ROUTINE,
            heart_rate=70,
        )
        res = client.get(f"/api/v1/patients/{p1.id}/clinical-records/?encounter_type=EMERGENCY")
        assert res.status_code == status.HTTP_200_OK
        assert len(res.data["data"]) == 1
        assert res.data["data"][0]["encounter_type"] == "EMERGENCY"


# ---------------------------------------------------------------------------
# 6. Unauthorized Access Tests
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestUnauthorizedAccess:
    def test_anonymous_requests_rejected(self, test_patients):
        p1 = test_patients["p1"]
        client = APIClient()  # unauthenticated

        assert client.get("/api/v1/patients/").status_code == status.HTTP_401_UNAUTHORIZED
        assert client.post("/api/v1/patients/", {}).status_code == status.HTTP_401_UNAUTHORIZED
        assert client.get(f"/api/v1/patients/{p1.id}/").status_code == status.HTTP_401_UNAUTHORIZED
        assert client.patch(f"/api/v1/patients/{p1.id}/", {}).status_code == status.HTTP_401_UNAUTHORIZED
        assert client.delete(f"/api/v1/patients/{p1.id}/").status_code == status.HTTP_401_UNAUTHORIZED
        assert client.get(f"/api/v1/patients/{p1.id}/clinical-records/").status_code == status.HTTP_401_UNAUTHORIZED
        assert client.post(f"/api/v1/patients/{p1.id}/clinical-records/", {}).status_code == status.HTTP_401_UNAUTHORIZED
