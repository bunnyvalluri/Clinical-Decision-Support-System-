import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.accounts.models import UserRole
from apps.mobile_gateway.models import (
    ApprovalStatus,
    DataClassification,
    EmergencyKillSwitch,
    ForwardingAction,
    ForwardingDestination,
    ForwardingRule,
    MobileDevice,
    MobileEvent,
    RegistrationStatus,
)
from apps.mobile_gateway.services.kill_switch_service import KillSwitchService
from apps.mobile_gateway.services.policy_engine import ForwardingPolicyEngine

User = get_user_model()


@pytest.mark.django_db
class TestKillSwitch:
    def setup_method(self):
        self.admin = User.objects.create_user(
            username="admin_kill",
            email="admin@hospital.org",
            role=UserRole.IT_ADMIN,
        )
        self.device = MobileDevice.objects.create(
            device_identifier="device-ks-1",
            registration_status=RegistrationStatus.ACTIVE,
        )
        self.destination = ForwardingDestination.objects.create(
            name="Allowed Hospital API",
            destination_type="INTERNAL_API",
            endpoint="https://internal.hospital.org/events",
            approval_status=ApprovalStatus.APPROVED,
            data_classification_allowed=["LOW_SENSITIVITY"],
            enabled=True,
        )
        self.rule = ForwardingRule.objects.create(
            name="Allow Heartbeat",
            event_type="DEVICE_STATUS",
            source_filter="*",
            classification_policy=ForwardingAction.ALLOW,
            destination=self.destination,
            priority=10,
            enabled=True,
        )

    def test_global_kill_switch_halts_forwarding(self):
        event = MobileEvent.objects.create(
            device=self.device,
            event_type="DEVICE_STATUS",
            source="battery_monitor",
            timestamp=timezone.now(),
            content="Battery status normal 95%",
            classification=DataClassification.LOW_SENSITIVITY,
            idempotency_key="ks-evt-1",
        )

        # Before kill switch: Rule allows
        action, dests, _ = ForwardingPolicyEngine.evaluate_event_policy(event, self.device)
        assert action == ForwardingAction.ALLOW

        # Trigger Global Kill Switch
        KillSwitchService.trigger_kill_switch(
            scope=EmergencyKillSwitch.KillScope.GLOBAL,
            reason="Emergency security audit in progress",
            triggered_by=self.admin,
        )

        # After kill switch: Evaluates to BLOCK immediately
        action, dests, reason = ForwardingPolicyEngine.evaluate_event_policy(event, self.device)
        assert action == ForwardingAction.BLOCK
        assert "Emergency Kill Switch" in reason

    def test_scoped_device_kill_switch(self):
        event = MobileEvent.objects.create(
            device=self.device,
            event_type="DEVICE_STATUS",
            source="battery_monitor",
            timestamp=timezone.now(),
            content="Battery normal",
            classification=DataClassification.LOW_SENSITIVITY,
            idempotency_key="ks-evt-2",
        )

        KillSwitchService.trigger_kill_switch(
            scope=EmergencyKillSwitch.KillScope.DEVICE,
            target_id=str(self.device.id),
            reason="Device compromised or stolen",
            triggered_by=self.admin,
        )

        action, dests, reason = ForwardingPolicyEngine.evaluate_event_policy(event, self.device)
        assert action == ForwardingAction.BLOCK
        assert "Emergency Kill Switch" in reason
