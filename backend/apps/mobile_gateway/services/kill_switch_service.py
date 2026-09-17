"""
Emergency Forwarding Kill Switch Service.

Allows IT Administrators to immediately freeze mobile forwarding:
- Globally
- Per Destination
- Per Mobile Device
- Per Forwarding Rule
- Per User

Preserves historical audit logs while halting immediate execution.
"""
from typing import Optional, Tuple
from django.utils import timezone
from apps.mobile_gateway.models import EmergencyKillSwitch, MobileDevice, ForwardingDestination, ForwardingRule


class KillSwitchService:
    @classmethod
    def is_kill_switch_active(
        cls,
        device: Optional[MobileDevice] = None,
        destination: Optional[ForwardingDestination] = None,
        rule: Optional[ForwardingRule] = None,
        user_id: Optional[str] = None,
    ) -> Tuple[bool, Optional[EmergencyKillSwitch]]:
        """
        Evaluates whether any active kill switch blocks the current forwarding path.
        Returns (is_blocked, matched_kill_switch).
        """
        active_switches = EmergencyKillSwitch.objects.filter(is_active=True)

        for switch in active_switches:
            if switch.scope == EmergencyKillSwitch.KillScope.GLOBAL:
                return True, switch

            if device and switch.scope == EmergencyKillSwitch.KillScope.DEVICE:
                if switch.target_id in [str(device.id), device.device_identifier]:
                    return True, switch

            if destination and switch.scope == EmergencyKillSwitch.KillScope.DESTINATION:
                if switch.target_id in [str(destination.id), destination.name]:
                    return True, switch

            if rule and switch.scope == EmergencyKillSwitch.KillScope.RULE:
                if switch.target_id in [str(rule.id), rule.name]:
                    return True, switch

            if (user_id or (device and device.user_id)) and switch.scope == EmergencyKillSwitch.KillScope.USER:
                effective_uid = str(user_id or device.user_id)
                if switch.target_id == effective_uid:
                    return True, switch

        return False, None

    @classmethod
    def trigger_kill_switch(
        cls,
        scope: str,
        reason: str,
        triggered_by=None,
        target_id: str = "",
    ) -> EmergencyKillSwitch:
        """Activates a new emergency kill switch."""
        return EmergencyKillSwitch.objects.create(
            scope=scope,
            target_id=target_id,
            reason=reason,
            is_active=True,
            triggered_by=triggered_by,
        )

    @classmethod
    def deactivate_kill_switch(cls, kill_switch_id: str) -> bool:
        """Deactivates a previously triggered kill switch."""
        try:
            ks = EmergencyKillSwitch.objects.get(id=kill_switch_id, is_active=True)
            ks.is_active = False
            ks.deactivated_at = timezone.now()
            ks.save(update_fields=["is_active", "deactivated_at"])
            return True
        except EmergencyKillSwitch.DoesNotExist:
            return False
