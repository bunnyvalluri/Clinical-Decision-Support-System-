"""
Forwarding Policy Engine.

Evaluates:
1. Active Emergency Kill Switches.
2. Declarative Forwarding Rules (Priority order: lowest integer first).
3. Most Restrictive Resolution: BLOCK > REVIEW_REQUIRED > REDACT > ALLOW.
4. Destination Allowlist & Approval Status (Default-Deny).
5. Destination Classification Allowlist.
6. Transport Security Requirements (HTTPS enforcement).
"""
import fnmatch
import re
from typing import List, Optional, Tuple
from urllib.parse import urlparse
from apps.mobile_gateway.models import (
    ApprovalStatus,
    DataClassification,
    DestinationType,
    ForwardingAction,
    ForwardingDestination,
    ForwardingRule,
    MobileDevice,
    MobileEvent,
)
from .kill_switch_service import KillSwitchService


class ForwardingPolicyEngine:
    @classmethod
    def evaluate_event_policy(
        cls,
        event: MobileEvent,
        device: MobileDevice,
    ) -> Tuple[ForwardingAction, List[ForwardingDestination], str]:
        """
        Executes policy pipeline for an incoming event.
        Returns (final_action, approved_destinations, audit_reason).
        """
        # 1. Emergency Kill Switch Gate
        is_killed, kill_switch = KillSwitchService.is_kill_switch_active(
            device=device,
            user_id=str(device.user_id) if device.user_id else None,
        )
        if is_killed:
            return (
                ForwardingAction.BLOCK,
                [],
                f"Blocked by active Emergency Kill Switch ({kill_switch.scope}): {kill_switch.reason}",
            )

        # 2. Hard Security Rule: OTP, Secrets, and Unknowns default to BLOCK
        if event.classification in [
            DataClassification.OTP,
            DataClassification.AUTHENTICATION_SECRET,
            DataClassification.UNKNOWN,
        ]:
            return (
                ForwardingAction.BLOCK,
                [],
                f"Classification '{event.classification}' cannot be forwarded under zero-trust policy.",
            )

        # 3. Retrieve Enabled Forwarding Rules (Ordered by priority ascending)
        rules = ForwardingRule.objects.filter(
            enabled=True,
            destination__approval_status=ApprovalStatus.APPROVED,
            destination__enabled=True,
        ).select_related("destination").order_by("priority")

        matched_actions = []
        matched_destinations = []
        matched_reasons = []

        for rule in rules:
            # Check event_type match
            if rule.event_type not in ["ALL", event.event_type]:
                continue

            # Check source filter (glob or exact)
            if rule.source_filter and rule.source_filter != "*":
                if not fnmatch.fnmatch(event.source.lower(), rule.source_filter.lower()):
                    continue

            # Check declarative content regex filter
            if rule.content_filter:
                try:
                    if not re.search(rule.content_filter, event.content, re.IGNORECASE):
                        continue
                except re.error:
                    # Malformed regex in rule: skip safely
                    continue

            # Check if destination kill switch is active
            dest_killed, dest_ks = KillSwitchService.is_kill_switch_active(
                destination=rule.destination,
                rule=rule,
            )
            if dest_killed:
                continue

            # Check Destination Data Classification Allowlist
            allowed_classes = rule.destination.data_classification_allowed or []
            if event.classification not in allowed_classes and "ALL" not in allowed_classes:
                continue

            # Check HTTPS enforcement for webhooks
            if rule.destination.destination_type == DestinationType.SECURE_WEBHOOK:
                parsed = urlparse(rule.destination.endpoint)
                if parsed.scheme.lower() != "https":
                    continue

            # Rule Matched!
            matched_actions.append(rule.classification_policy)
            matched_destinations.append(rule.destination)
            matched_reasons.append(f"Rule '{rule.name}' matched with action {rule.classification_policy}")

        if not matched_destinations:
            return (
                ForwardingAction.BLOCK,
                [],
                "Default-Deny: No approved forwarding rule matched this event.",
            )

        # 4. Resolve Conflicts: Most Restrictive Wins (BLOCK > REVIEW_REQUIRED > REDACT > ALLOW)
        if ForwardingAction.BLOCK in matched_actions:
            return ForwardingAction.BLOCK, [], "Resolved to BLOCK: Most restrictive policy applied."
        if ForwardingAction.REVIEW_REQUIRED in matched_actions:
            return (
                ForwardingAction.REVIEW_REQUIRED,
                matched_destinations,
                "Resolved to REVIEW_REQUIRED: Clinician sign-off needed.",
            )
        if ForwardingAction.REDACT in matched_actions:
            return (
                ForwardingAction.REDACT,
                matched_destinations,
                "Resolved to REDACT: Forwarding permitted with sanitization.",
            )

        return (
            ForwardingAction.ALLOW,
            matched_destinations,
            "Resolved to ALLOW: Passed all zero-trust policy checks.",
        )
