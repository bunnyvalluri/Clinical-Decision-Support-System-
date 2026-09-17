"""
DRF Serializers for the Search Platform API.
Validates input query parameters and formats standardized JSON responses.
"""
from rest_framework import serializers
from .models import SearchIndexRegistry, SearchAuditEvent


class SearchRequestSerializer(serializers.Serializer):
    """Validates parameters for the primary search endpoint."""
    q = serializers.CharField(required=False, allow_blank=True, max_length=200, default="")
    index = serializers.CharField(required=False, allow_blank=True, default="")
    filters = serializers.JSONField(required=False, default=dict)
    sort = serializers.CharField(required=False, allow_blank=True, default="")
    facets = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=100, default=20)
    highlight = serializers.BooleanField(required=False, default=True)


class SearchSuggestionRequestSerializer(serializers.Serializer):
    """Validates autocomplete suggestions request."""
    q = serializers.CharField(required=True, min_length=2, max_length=100)
    index = serializers.CharField(required=False, allow_blank=True, default="")


class SearchIndexRegistrySerializer(serializers.ModelSerializer):
    """Serializer for SearchIndexRegistry."""
    class Meta:
        model = SearchIndexRegistry
        fields = [
            "id",
            "index_uid",
            "entity_type",
            "classification",
            "schema_version",
            "status",
            "document_count",
            "last_reindex",
            "last_reconciliation",
            "updated_at",
        ]


class SearchAuditEventSerializer(serializers.ModelSerializer):
    """Serializer for SearchAuditEvent logs."""
    class Meta:
        model = SearchAuditEvent
        fields = [
            "id",
            "user_id_ref",
            "role",
            "index_name",
            "redacted_query",
            "result_count",
            "latency_ms",
            "search_mode",
            "correlation_id",
            "timestamp",
        ]
