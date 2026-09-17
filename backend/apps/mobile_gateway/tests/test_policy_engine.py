import pytest
from django.utils import timezone
from apps.mobile_gateway.models import (
    ApprovalStatus,
    DataClassification,
    ForwardingAction,
    ForwardingDestination,
    ForwardingRule,
    MobileDevice,
    MobileEvent,
    RegistrationStatus,
)
from apps.mobile_gateway.services.policy_engine import ForwardingPolicyEngine


@pytest.mark.django_db
class TestPolicyEngine:
    def setup_method(self):
        self.device = MobileDevice.objects.create(
            device_identifier="policy-device-1",
            registration_status=RegistrationStatus.ACTIVE,
        )
        self.destination = ForwardingDestination.objects.create(
            name="Clinical Webhook",
            destination_type="SECURE_WEBHOOK",
            endpoint="https://api.hospital.org/v1/webhook",
            approval_status=ApprovalStatus.APPROVED,
            data_classification_allowed=["LOW_SENSITIVITY", "PHI"],
            enabled=True,
        )

    def test_default_deny_when_no_rules_match(self):
        event = MobileEvent.objects.create(
            device=self.device,
            event_type="SMS_RECEIVED",
            source="+15559999",
            timestamp=timezone.now(),
            content="Normal checkin",
            classification=DataClassification.LOW_SENSITIVITY,
            idempotency_key="idemp-1",
        )
        action, dests, reason = ForwardingPolicyEngine.evaluate_event_policy(event, self.device)
        assert action == ForwardingAction.BLOCK
        assert len(dests) == 0
        assert "Default-Deny" in reason

    def test_conflict_resolution_most_restrictive_wins(self):
        event = MobileEvent.objects.create(
            device=self.device,
            event_type="SMS_RECEIVED",
            source="+15559999",
            timestamp=timezone.now(),
            content="Device status update",
            classification=DataClassification.LOW_SENSITIVITY,
            idempotency_key="idemp-2",
        )

        ForwardingRule.objects.create(
            name="Allow Rule",
            event_type="SMS_RECEIVED",
            source_filter="*",
            classification_policy=ForwardingAction.ALLOW,
            destination=self.destination,
            priority=50,
            enabled=True,
        )

        ForwardingRule.objects.create(
            name="Block Rule",
            event_type="SMS_RECEIVED",
            source_filter="*",
            classification_policy=ForwardingAction.BLOCK,
            destination=self.destination,
            priority=60,
            enabled=True,
        )

        action, dests, reason = ForwardingPolicyEngine.evaluate_event_policy(event, self.device)
        # Even though Allow Rule has higher priority (50 < 60), the most restrictive policy (BLOCK) wins!
        assert action == ForwardingAction.BLOCK

    def test_otp_and_secrets_unconditionally_blocked(self):
        event = MobileEvent.objects.create(
            device=self.device,
            event_type="SMS_RECEIVED",
            source="+15559999",
            timestamp=timezone.now(),
            content="[REDACTED_OTP]",
            classification=DataClassification.OTP,
            idempotency_key="idemp-3",
        )
        action, dests, reason = ForwardingPolicyEngine.evaluate_event_policy(event, self.device)
        assert action == ForwardingAction.BLOCK
        assert "zero-trust" in reason.lower()
