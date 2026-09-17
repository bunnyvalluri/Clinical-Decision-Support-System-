"""
Serializers for NocoDB datasets, schemas, rows, views, and audit events.
"""
from rest_framework import serializers
from apps.nocodb.models import (
    NocoDBConnection,
    NocoDBDataset,
    NocoDBSchemaColumn,
    NocoDBRowRecord,
    NocoDBViewPreference,
    NocoDBAuditEvent,
)


class NocoDBSchemaColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = NocoDBSchemaColumn
        fields = [
            "id",
            "name",
            "display_name",
            "column_type",
            "is_primary",
            "is_phi",
            "is_read_only",
            "options",
            "order",
        ]


class NocoDBDatasetListSerializer(serializers.ModelSerializer):
    column_count = serializers.IntegerField(source="columns.count", read_only=True)

    class Meta:
        model = NocoDBDataset
        fields = [
            "id",
            "slug",
            "title",
            "description",
            "category",
            "allowed_roles",
            "is_active",
            "is_system_dataset",
            "row_count",
            "column_count",
            "last_synced_at",
            "updated_at",
        ]


class NocoDBDatasetDetailSerializer(serializers.ModelSerializer):
    columns = NocoDBSchemaColumnSerializer(many=True, read_only=True)

    class Meta:
        model = NocoDBDataset
        fields = [
            "id",
            "slug",
            "title",
            "description",
            "category",
            "allowed_roles",
            "is_active",
            "is_system_dataset",
            "source_model",
            "row_count",
            "columns",
            "last_synced_at",
            "created_at",
            "updated_at",
        ]


class NocoDBRowRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = NocoDBRowRecord
        fields = [
            "id",
            "anon_ref_id",
            "data",
            "is_archived",
            "created_at",
            "updated_at",
        ]


class NocoDBViewPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NocoDBViewPreference
        fields = [
            "id",
            "name",
            "view_type",
            "config",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class NocoDBAuditEventSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True, default="")

    class Meta:
        model = NocoDBAuditEvent
        fields = [
            "id",
            "user_email",
            "user_role",
            "action",
            "dataset_slug",
            "resource_id",
            "details",
            "ip_address",
            "created_at",
        ]


class NocoDBConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = NocoDBConnection
        fields = [
            "id",
            "name",
            "base_url",
            "is_active",
            "health_status",
            "last_health_check_at",
            "last_sync_at",
            "sync_interval_minutes",
        ]
        read_only_fields = ["id", "health_status", "last_health_check_at", "last_sync_at"]
