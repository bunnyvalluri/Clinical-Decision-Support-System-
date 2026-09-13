import pytest
from datetime import date
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from apps.accounts.models import UserRole
from apps.accounts.serializers import signer
from apps.patients.models import Patient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        username="admin_user@hospital.org",
        email="admin_user@hospital.org",
        password="AdminSecurePass123!",
        first_name="Admin",
        last_name="System",
        role=UserRole.ADMIN,
    )
    return user


@pytest.fixture
def clinician_user(db):
    user = User.objects.create_user(
        username="dr_carol@hospital.org",
        email="dr_carol@hospital.org",
        password="DoctorPass123!",
        first_name="Carol",
        last_name="Danvers",
        role=UserRole.CLINICIAN,
        department="Cardiology",
    )
    return user


@pytest.fixture
def staff_user(db):
    user = User.objects.create_user(
        username="nurse_jackie@hospital.org",
        email="nurse_jackie@hospital.org",
        password="StaffPass123!",
        first_name="Jackie",
        last_name="Peyton",
        role=UserRole.STAFF,
        department="Emergency",
    )
    return user


@pytest.fixture
def patient_alice(db):
    user = User.objects.create_user(
        username="alice@patient.org",
        email="alice@patient.org",
        password="PatientAlicePass123!",
        first_name="Alice",
        last_name="Smith",
        role=UserRole.PATIENT,
    )
    patient = Patient.objects.create(
        user=user,
        mrn="MRN-ALICE-1001",
        first_name="Alice",
        last_name="Smith",
        date_of_birth=date(1992, 4, 12),
        phone_number="+15550001111",
    )
    return user, patient


@pytest.fixture
def patient_bob(db):
    user = User.objects.create_user(
        username="bob@patient.org",
        email="bob@patient.org",
        password="PatientBobPass123!",
        first_name="Bob",
        last_name="Jones",
        role=UserRole.PATIENT,
    )
    patient = Patient.objects.create(
        user=user,
        mrn="MRN-BOB-2002",
        first_name="Bob",
        last_name="Jones",
        date_of_birth=date(1985, 9, 25),
        phone_number="+15550002222",
    )
    return user, patient


@pytest.mark.django_db
class TestAuthenticationLifecycle:
    """Test registration, login, token refresh, and logout/blacklisting."""

    def test_registration_success(self, api_client):
        payload = {
            "email": "new.clinician@hospital.org",
            "password": "StrongPassword9988!",
            "password_confirm": "StrongPassword9988!",
            "first_name": "Gregory",
            "last_name": "House",
            "role": UserRole.CLINICIAN,
            "department": "Diagnostic Medicine",
        }
        response = api_client.post("/api/v1/auth/register/", payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert "tokens" in response.data["data"]
        assert "access" in response.data["data"]["tokens"]
        assert "refresh" in response.data["data"]["tokens"]
        # Assert passwords and secrets are never in the response
        assert "password" not in response.data["data"]["user"]

    def test_registration_weak_password_rejected(self, api_client):
        payload = {
            "email": "weak@hospital.org",
            "password": "123",
            "password_confirm": "123",
            "first_name": "Weak",
            "last_name": "User",
        }
        response = api_client.post("/api/v1/auth/register/", payload)
        assert response.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY)

    def test_registration_duplicate_email_rejected(self, api_client, clinician_user):
        payload = {
            "email": clinician_user.email,
            "password": "StrongPassword9988!",
            "password_confirm": "StrongPassword9988!",
        }
        response = api_client.post("/api/v1/auth/register/", payload)
        assert response.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY)

    def test_login_and_jwt_token_claims(self, api_client, clinician_user):
        payload = {
            "email": clinician_user.email,
            "password": "DoctorPass123!",
        }
        response = api_client.post("/api/v1/auth/login/", payload)
        assert response.status_code == status.HTTP_200_OK
        data = response.data["data"]
        assert "access" in data
        assert "refresh" in data
        assert data["user"]["email"] == clinician_user.email
        assert data["user"]["role"] == UserRole.CLINICIAN

        # Validate embedded JWT claims
        decoded_token = AccessToken(data["access"])
        assert decoded_token["email"] == clinician_user.email
        assert decoded_token["role"] == UserRole.CLINICIAN
        assert decoded_token["is_clinician"] is True

    def test_token_refresh(self, api_client, clinician_user):
        refresh = RefreshToken.for_user(clinician_user)
        response = api_client.post("/api/v1/auth/token/refresh/", {"refresh": str(refresh)})
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data["data"]

    def test_logout_and_token_invalidation(self, api_client, clinician_user):
        refresh = RefreshToken.for_user(clinician_user)
        access = refresh.access_token

        # Authenticated logout
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        logout_response = api_client.post("/api/v1/auth/logout/", {"refresh": str(refresh)})
        assert logout_response.status_code == status.HTTP_200_OK

        # Verify refresh token is now blacklisted
        api_client.credentials()
        refresh_response = api_client.post("/api/v1/auth/token/refresh/", {"refresh": str(refresh)})
        assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestPasswordResetAndEmailVerification:
    """Test password reset token flow and email verification architecture."""

    def test_password_reset_flow(self, api_client, clinician_user):
        # 1. Request reset
        req_response = api_client.post(
            "/api/v1/auth/password-reset/",
            {"email": clinician_user.email}
        )
        assert req_response.status_code == status.HTTP_200_OK

        # 2. Generate token programmatically as simulated from email
        token = default_token_generator.make_token(clinician_user)
        uidb64 = urlsafe_base64_encode(force_bytes(clinician_user.pk))

        # 3. Confirm reset
        confirm_payload = {
            "uidb64": uidb64,
            "token": token,
            "new_password": "NewUltraSecurePass123!",
            "new_password_confirm": "NewUltraSecurePass123!",
        }
        confirm_response = api_client.post("/api/v1/auth/password-reset/confirm/", confirm_payload)
        assert confirm_response.status_code == status.HTTP_200_OK

        # 4. Old password fails, new password succeeds
        old_login = api_client.post(
            "/api/v1/auth/login/",
            {"email": clinician_user.email, "password": "DoctorPass123!"}
        )
        assert old_login.status_code == status.HTTP_401_UNAUTHORIZED

        new_login = api_client.post(
            "/api/v1/auth/login/",
            {"email": clinician_user.email, "password": "NewUltraSecurePass123!"}
        )
        assert new_login.status_code == status.HTTP_200_OK

    def test_email_verification_flow(self, api_client, clinician_user):
        assert clinician_user.is_email_verified is False

        # Authenticate and request verification
        refresh = RefreshToken.for_user(clinician_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        req_res = api_client.post("/api/v1/auth/email-verify/request/")
        assert req_res.status_code == status.HTTP_200_OK
        token = req_res.data["data"]["token"]

        # Confirm verification
        api_client.credentials()
        confirm_res = api_client.post("/api/v1/auth/email-verify/confirm/", {"token": token})
        assert confirm_res.status_code == status.HTTP_200_OK

        clinician_user.refresh_from_db()
        assert clinician_user.is_email_verified is True


@pytest.mark.django_db
class TestCurrentUserAndProfile:
    """Test /me/ and /profile/ endpoints."""

    def test_current_user_and_profile_endpoints(self, api_client, patient_alice):
        user, patient = patient_alice
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        # Current user endpoint
        me_res = api_client.get("/api/v1/auth/me/")
        assert me_res.status_code == status.HTTP_200_OK
        assert me_res.data["data"]["email"] == user.email
        assert me_res.data["data"]["patient_id"] == str(patient.id)

        # Profile endpoint
        prof_res = api_client.get("/api/v1/auth/profile/")
        assert prof_res.status_code == status.HTTP_200_OK
        assert prof_res.data["data"]["patient_record"]["mrn"] == "MRN-ALICE-1001"

        # Update profile
        patch_res = api_client.patch(
            "/api/v1/auth/profile/",
            {"phone_number": "+15559998888"}
        )
        assert patch_res.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.phone_number == "+15559998888"


@pytest.mark.django_db
class TestRoleBasedAccessControl:
    """Test RBAC across ADMIN, CLINICIAN, STAFF, and PATIENT roles."""

    def test_admin_can_manage_users(self, api_client, admin_user, clinician_user):
        refresh = RefreshToken.for_user(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        res = api_client.get("/api/v1/auth/users/")
        assert res.status_code == status.HTTP_200_OK

    def test_clinician_cannot_manage_users(self, api_client, clinician_user):
        refresh = RefreshToken.for_user(clinician_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        res = api_client.get("/api/v1/auth/users/")
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_can_register_patient(self, api_client, staff_user):
        refresh = RefreshToken.for_user(staff_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        payload = {
            "mrn": "MRN-STAFF-REG-01",
            "first_name": "David",
            "last_name": "Tennant",
            "date_of_birth": "1971-04-18",
            "gender": "MALE",
        }
        res = api_client.post("/api/v1/patients/", payload)
        assert res.status_code == status.HTTP_201_CREATED

    def test_patient_cannot_register_arbitrary_patients(self, api_client, patient_alice):
        user, _ = patient_alice
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        payload = {
            "mrn": "MRN-MALICIOUS-01",
            "first_name": "Fake",
            "last_name": "Patient",
            "date_of_birth": "1990-01-01",
        }
        res = api_client.post("/api/v1/patients/", payload)
        assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestHorizontalPrivilegeEscalationPrevention:
    """
    CRUCIAL: Test that a patient can NEVER access another patient's records
    simply by manipulating the UUID/ID in an API request.
    """

    def test_patient_cannot_read_another_patient_record(self, api_client, patient_alice, patient_bob):
        user_alice, pat_alice = patient_alice
        _, pat_bob = patient_bob

        # Alice logs in
        refresh_alice = RefreshToken.for_user(user_alice)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh_alice.access_token}")

        # 1. Alice queries her own record -> 200 OK
        own_res = api_client.get(f"/api/v1/patients/{pat_alice.id}/")
        assert own_res.status_code == status.HTTP_200_OK
        assert own_res.data["mrn"] == "MRN-ALICE-1001"

        # 2. Alice attempts HORIZONTAL ESCALATION by requesting Bob's ID -> 403 Forbidden!
        escalation_res = api_client.get(f"/api/v1/patients/{pat_bob.id}/")
        assert escalation_res.status_code == status.HTTP_403_FORBIDDEN

        # 3. Alice attempts to mutate Bob's record -> 403 Forbidden!
        mutate_res = api_client.patch(
            f"/api/v1/patients/{pat_bob.id}/",
            {"phone_number": "+15559990000"}
        )
        assert mutate_res.status_code == status.HTTP_403_FORBIDDEN

    def test_patient_list_only_returns_own_record(self, api_client, patient_alice, patient_bob):
        user_alice, pat_alice = patient_alice
        _, pat_bob = patient_bob

        refresh_alice = RefreshToken.for_user(user_alice)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh_alice.access_token}")

        list_res = api_client.get("/api/v1/patients/")
        assert list_res.status_code == status.HTTP_200_OK
        results = list_res.data.get("data", list_res.data)
        if isinstance(results, dict) and "results" in results:
            results = results["results"]
        returned_mrns = [p["mrn"] for p in results]

        # Alice's list MUST contain Alice and MUST NOT contain Bob
        assert "MRN-ALICE-1001" in returned_mrns
        assert "MRN-BOB-2002" not in returned_mrns
        assert len(returned_mrns) == 1

    def test_clinician_can_access_both_patients(self, api_client, clinician_user, patient_alice, patient_bob):
        _, pat_alice = patient_alice
        _, pat_bob = patient_bob

        refresh_clinician = RefreshToken.for_user(clinician_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh_clinician.access_token}")

        res_alice = api_client.get(f"/api/v1/patients/{pat_alice.id}/")
        assert res_alice.status_code == status.HTTP_200_OK

        res_bob = api_client.get(f"/api/v1/patients/{pat_bob.id}/")
        assert res_bob.status_code == status.HTTP_200_OK
