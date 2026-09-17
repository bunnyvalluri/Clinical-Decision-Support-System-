import json
import time
import pytest
from rest_framework.test import APIClient
from django.utils import timezone
from apps.mobile_gateway.models import (
    ApprovalStatus,
    DataClassification,
    ForwardingAction,
    ForwardingDestination,
    ForwardingRule,
    MobileDevice,
    MobileEvent,
    ProcessingStatus,
    RegistrationStatus,
)
from apps.mobile_gateway.services.device_auth_service import DeviceAuthService
import hmac
import hashlib


@pytest.mark.django_db
class TestEventIngestion:
    def setup_method(self):
        self.client = APIClient()
        self.shared_secret = "test-secret-key-abcdef"
        self.device = MobileDevice.objects.create(
            device_identifier="ingest-dev-1",
            registration_status=RegistrationStatus.ACTIVE,
            shared_secret=self.shared_secret,
        )

    def test_unregistered_device_rejected(self):
        payload = {
            "device_identifier": "unknown-device-000",
            "event_type": "SMS_RECEIVED",
            "source": "+15551234",
            "timestamp": timezone.now().isoformat(),
            "content": "Test message",
            "idempotency_key": "idemp-unregistered",
        }
        res = self.client.post("/api/v1/mobile/events/ingest/", payload, format="json")
        assert res.status_code == 401

    def test_revoked_device_forbidden(self):
        self.device.registration_status = RegistrationStatus.REVOKED
        self.device.save()

        payload = {
            "device_identifier": self.device.device_identifier,
            "event_type": "SMS_RECEIVED",
            "source": "+15551234",
            "timestamp": timezone.now().isoformat(),
            "content": "Test message",
            "idempotency_key": "idemp-revoked",
        }
        res = self.client.post("/api/v1/mobile/events/ingest/", payload, format="json")
        assert res.status_code == 403

    def test_ingest_otp_message_blocked_and_sanitized(self):
        payload = {
            "device_identifier": self.device.device_identifier,
            "event_type": "SMS_RECEIVED",
            "source": "+15551234",
            "timestamp": timezone.now().isoformat(),
            "content": "Your login verification code is 584912.",
            "idempotency_key": "idemp-otp-test",
        }
        res = self.client.post("/api/v1/mobile/events/ingest/", payload, format="json")
        assert res.status_code == 201
        data = res.json()
        assert data["classification"] == "OTP"
        assert data["policy_action"] == "BLOCK"
        assert data["status"] == "BLOCKED"

        # Verify database record is sanitized
        event = MobileEvent.objects.get(id=data["event_id"])
        assert "584912" not in event.content
        assert "[REDACTED_OTP]" in event.content

    def test_idempotency_duplicate_prevented(self):
        payload = {
            "device_identifier": self.device.device_identifier,
            "event_type": "DEVICE_STATUS",
            "source": "battery",
            "timestamp": timezone.now().isoformat(),
            "content": "Battery 88%",
            "idempotency_key": "idemp-duplicate-test",
        }
        res1 = self.client.post("/api/v1/mobile/events/ingest/", payload, format="json")
        assert res1.status_code == 201
        event_id1 = res1.json()["event_id"]

        # Submitting second time with same idempotency key
        res2 = self.client.post("/api/v1/mobile/events/ingest/", payload, format="json")
        assert res2.status_code == 201
        event_id2 = res2.json()["event_id"]
        assert event_id1 == event_id2
        assert MobileEvent.objects.filter(idempotency_key="idemp-duplicate-test").count() == 1

    def test_hmac_tamper_detection(self):
        body_dict = {
            "device_identifier": self.device.device_identifier,
            "event_type": "DEVICE_STATUS",
            "source": "system",
            "timestamp": timezone.now().isoformat(),
            "content": "Sync ok",
            "idempotency_key": "idemp-hmac-test",
        }
        raw_body = json.dumps(body_dict).encode("utf-8")
        ts = str(int(time.time()))
        nonce = "tamper-nonce-123"

        # Valid signature
        data_to_sign = f"{ts}:{nonce}:".encode("utf-8") + raw_body
        valid_sig = hmac.new(self.shared_secret.encode("utf-8"), data_to_sign, hashlib.sha256).hexdigest()

        # Submit with tampered signature
        headers = {
            "HTTP_X_SIGNATURE": "tampered_fake_signature_hex_00000000000000000000000000000000000",
            "HTTP_X_TIMESTAMP": ts,
            "HTTP_X_NONCE": nonce,
        }
        res = self.client.post(
            "/api/v1/mobile/events/ingest/",
            data=raw_body,
            content_type="application/json",
            **headers,
        )
        assert res.status_code == 401
        assert "Invalid request signature" in res.json()["error"]
