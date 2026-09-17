import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.mobile_gateway.models import MobileDevice, RegistrationStatus

User = get_user_model()


@pytest.mark.django_db
class TestDeviceLifecycle:
    def setup_method(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            username="patient_jane",
            email="jane@example.com",
            role=UserRole.PATIENT,
        )
        self.it_admin = User.objects.create_user(
            username="admin_bob",
            email="bob@hospital.org",
            role=UserRole.IT_ADMIN,
        )
        self.doctor = User.objects.create_user(
            username="dr_house",
            email="house@hospital.org",
            role=UserRole.DOCTOR,
        )

    def test_patient_registers_device(self):
        self.client.force_authenticate(user=self.patient)
        payload = {
            "device_identifier": "device-uuid-abc-123",
            "device_name": "Jane Pixel 8",
            "platform": "ANDROID",
            "app_version": "3.42.0",
            "os_version": "Android 14",
            "shared_secret": "secret-token-key-12345",
        }
        res = self.client.post("/api/v1/mobile/devices/register/", payload, format="json")
        assert res.status_code in [200, 201]
        device = MobileDevice.objects.get(device_identifier="device-uuid-abc-123")
        assert device.registration_status == RegistrationStatus.PENDING
        assert device.user == self.patient

    def test_admin_approves_device(self):
        device = MobileDevice.objects.create(
            device_identifier="device-uuid-xyz-789",
            user=self.patient,
            registration_status=RegistrationStatus.PENDING,
        )
        self.client.force_authenticate(user=self.it_admin)
        res = self.client.post(f"/api/v1/mobile/devices/{device.id}/approve/")
        assert res.status_code == 200
        device.refresh_from_db()
        assert device.registration_status == RegistrationStatus.ACTIVE

    def test_patient_can_revoke_own_device(self):
        device = MobileDevice.objects.create(
            device_identifier="device-uuid-revoke-1",
            user=self.patient,
            registration_status=RegistrationStatus.ACTIVE,
        )
        self.client.force_authenticate(user=self.patient)
        res = self.client.post(f"/api/v1/mobile/devices/{device.id}/revoke/")
        assert res.status_code == 200
        device.refresh_from_db()
        assert device.registration_status == RegistrationStatus.REVOKED
        assert not device.is_online

    def test_doctor_cannot_access_devices_or_surveil(self):
        device = MobileDevice.objects.create(
            device_identifier="device-uuid-priv-1",
            user=self.patient,
            registration_status=RegistrationStatus.ACTIVE,
        )
        self.client.force_authenticate(user=self.doctor)
        res = self.client.get("/api/v1/mobile/devices/")
        # Doctors are strictly denied access to mobile device registry
        assert res.status_code == 403
