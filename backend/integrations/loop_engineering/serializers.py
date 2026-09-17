"""
Serializers for loop_engineering integration and API.
"""
from rest_framework import serializers
from apps.engineering_loops.models import (
    EngineeringLoop,
    EngineeringLoopRun,
    EngineeringLoopTask,
    EngineeringLoopArtifact,
    EngineeringLoopApproval,
    EngineeringLoopAuditEvent,
    EngineeringLoopBudget,
    EngineeringToolRegistry,
)


class EngineeringLoopSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineeringLoop
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class EngineeringLoopRunSerializer(serializers.ModelSerializer):
    loop_name = serializers.CharField(source="loop.name", read_only=True)
    pattern = serializers.CharField(source="loop.pattern", read_only=True)
    autonomy_level = serializers.CharField(source="loop.autonomy_level", read_only=True)

    class Meta:
        model = EngineeringLoopRun
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class EngineeringLoopTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineeringLoopTask
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class EngineeringLoopArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineeringLoopArtifact
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class EngineeringLoopApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineeringLoopApproval
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class EngineeringLoopAuditEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineeringLoopAuditEvent
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class EngineeringLoopBudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineeringLoopBudget
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class EngineeringToolRegistrySerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineeringToolRegistry
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
