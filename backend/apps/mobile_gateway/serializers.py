"""
Serializers for Healthcare Mobile Gateway REST API.
"""
from rest_framework import serializers
from apps.mobile_gateway.models import (
    ApprovalStatus,
    DataClassification,
    DeadLetterEvent,
    DeliveryReceipt,
    DestinationType,
    EmergencyKillSwitch,
    EventType,
    ForwardingAction,
    ForwardingDestination,
    ForwardingRule,
    MobileDevice,
    MobileEvent,
    ProcessingStatus,
    RegistrationStatus,
)


class MobileDeviceSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True, default=None)

    class Meta:
        model = MobileDevice
        fields = [
            "id",
            "user",
            "username",
            "device_identifier",
            "device_name",
            "platform",
            "app_version",
            "os_version",
            "registration_status",
            "public_key",
            "last_seen",
            "is_online",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "last_seen", "is_online", "created_at", "updated_at"]


class DeviceRegistrationSerializer(serializers.Serializer):
    device_identifier = serializers.CharField(max_length=128)
    device_name = serializers.CharField(max_length=100, default="Android Gateway")
    platform = serializers.CharField(max_length=32, default="ANDROID")
    app_version = serializers.CharField(max_length=32, default="3.42.0")
    os_version = serializers.CharField(max_length=32, required=False, default="Android 14")
    public_key = serializers.CharField(required=False, allow_blank=True, default="")
    shared_secret = serializers.CharField(required=False, allow_blank=True, default="")


class ForwardingDestinationSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True, default=None)

    class Meta:
        model = ForwardingDestination
        fields = [
            "id",
            "name",
            "destination_type",
            "endpoint",
            "environment",
            "approval_status",
            "data_classification_allowed",
            "encryption_required",
            "rate_limit_per_minute",
            "enabled",
            "created_by",
            "created_by_username",
            "approved_by",
            "approved_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_endpoint(self, value):
        if value.startswith("http://"):
            raise serializers.ValidationError("Insecure HTTP is forbidden. Destination endpoint must use HTTPS.")
        return value


class ForwardingRuleSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source="destination.name", read_only=True)

    class Meta:
        model = ForwardingRule
        fields = [
            "id",
            "name",
            "event_type",
            "source_filter",
            "content_filter",
            "classification_policy",
            "destination",
            "destination_name",
            "priority",
            "enabled",
            "created_by",
            "approved_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MobileEventSerializer(serializers.ModelSerializer):
    device_identifier = serializers.CharField(source="device.device_identifier", read_only=True)

    class Meta:
        model = MobileEvent
        fields = [
            "id",
            "device",
            "device_identifier",
            "event_type",
            "source",
            "timestamp",
            "content",
            "raw_hash",
            "metadata",
            "classification",
            "risk_level",
            "processing_status",
            "idempotency_key",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class MobileEventIngestSerializer(serializers.Serializer):
    device_identifier = serializers.CharField(max_length=128)
    event_type = serializers.ChoiceField(choices=EventType.choices)
    source = serializers.CharField(max_length=255)
    timestamp = serializers.DateTimeField()
    content = serializers.CharField(allow_blank=True)
    idempotency_key = serializers.CharField(max_length=128)
    metadata = serializers.DictField(required=False, default=dict)


class DeliveryReceiptSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source="destination.name", read_only=True)

    class Meta:
        model = DeliveryReceipt
        fields = [
            "id",
            "mobile_event",
            "destination",
            "destination_name",
            "attempt",
            "status",
            "latency_ms",
            "provider_response_code",
            "error_message",
            "timestamp",
        ]
        read_only_fields = fields


class DeadLetterEventSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source="destination.name", read_only=True)

    class Meta:
        model = DeadLetterEvent
        fields = [
            "id",
            "mobile_event",
            "destination",
            "destination_name",
            "failure_reason",
            "attempt_count",
            "last_attempt",
            "next_retry",
            "status",
            "created_at",
        ]


class EmergencyKillSwitchSerializer(serializers.ModelSerializer):
    triggered_by_username = serializers.CharField(source="triggered_by.username", read_only=True, default=None)

    class Meta:
        model = EmergencyKillSwitch
        fields = [
            "id",
            "scope",
            "target_id",
            "reason",
            "is_active",
            "triggered_by",
            "triggered_by_username",
            "activated_at",
            "deactivated_at",
        ]
        read_only_fields = ["id", "activated_at", "deactivated_at"]
