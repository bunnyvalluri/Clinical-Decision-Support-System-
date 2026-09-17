from rest_framework import serializers
from apps.external_apis.models import (
    ExternalAPIRegistry,
    ExternalAPIApproval,
    ExternalAPIHealth,
    ExternalAPILicense,
    ExternalAPIAuditLog,
)


class ExternalAPIRegistrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalAPIRegistry
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "last_validated_at"]


class ExternalAPIApprovalSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.CharField(source="reviewer.username", read_only=True)

    class Meta:
        model = ExternalAPIApproval
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


class ExternalAPIHealthSerializer(serializers.ModelSerializer):
    api_name = serializers.CharField(source="api.name", read_only=True)

    class Meta:
        model = ExternalAPIHealth
        fields = "__all__"
        read_only_fields = ["id", "checked_at"]


class ExternalAPILicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalAPILicense
        fields = "__all__"
        read_only_fields = ["id"]


class ExternalAPIAuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ExternalAPIAuditLog
        fields = "__all__"
        read_only_fields = ["id", "timestamp"]


class DrugSearchQuerySerializer(serializers.Serializer):
    drug_name = serializers.CharField(max_length=150, required=True)


class ProviderLookupQuerySerializer(serializers.Serializer):
    npi = serializers.CharField(max_length=20, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate(self, data):
        if not data.get("npi") and not (data.get("first_name") and data.get("last_name")):
            raise serializers.ValidationError("Must provide either 'npi' or both 'first_name' and 'last_name'.")
        return data


class NutritionQuerySerializer(serializers.Serializer):
    query = serializers.CharField(max_length=150, required=True)
