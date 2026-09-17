"""
DRF Serializers for Infrastructure & Deployment Management.
Exposes deployment records and server health strictly to authorized IT Administrators.
"""

from rest_framework import serializers
from .models import InfrastructureServer, DeploymentApplication, DeploymentRecord


class InfrastructureServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfrastructureServer
        fields = [
            "id",
            "coolify_server_id",
            "name",
            "environment",
            "status",
            "region",
            "provider",
            "last_health_check",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DeploymentApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeploymentApplication
        fields = [
            "id",
            "coolify_resource_id",
            "name",
            "environment",
            "repository",
            "branch",
            "deployment_status",
            "last_deployment_id",
            "last_deployed_commit",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DeploymentRecordSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    application_name = serializers.CharField(source="application.name", read_only=True)

    class Meta:
        model = DeploymentRecord
        fields = [
            "id",
            "coolify_deployment_id",
            "application",
            "application_name",
            "commit_sha",
            "status",
            "started_at",
            "finished_at",
            "trigger",
            "actor",
            "actor_username",
            "environment",
            "correlation_id",
        ]
        read_only_fields = ["id", "started_at", "correlation_id"]


class TriggerDeploymentRequestSerializer(serializers.Serializer):
    application_id = serializers.CharField(required=True)
    commit_sha = serializers.CharField(required=False, allow_blank=True)
    reason = serializers.CharField(required=False, default="Operational update")
