"""
DRF Serializers for Web Intelligence endpoints.
"""
from rest_framework import serializers
from .models import (
    DomainPolicy,
    WebCrawlJob,
    WebCrawlPage,
    WebDocument,
    WebExtraction,
    WebResearchResult,
    WebResearchSession,
    WebResearchSource,
    WebSource,
)


class SearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=500, required=True)
    limit = serializers.IntegerField(default=10, min_value=1, max_value=20)
    domain = serializers.CharField(max_length=255, required=False, allow_blank=True)


class SearchResultItemSerializer(serializers.Serializer):
    title = serializers.CharField()
    url = serializers.CharField()
    snippet = serializers.CharField()
    markdown = serializers.CharField(allow_blank=True, required=False)
    content_hash = serializers.CharField()
    relevance_score = serializers.FloatField()
    trust_tier = serializers.CharField()
    retrieved_at = serializers.CharField()
    source_name = serializers.CharField()


class ScrapeRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True, max_length=2048)
    formats = serializers.ListField(child=serializers.CharField(), default=list)
    only_main_content = serializers.BooleanField(default=True)


class MapRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True, max_length=2048)
    search = serializers.CharField(max_length=100, required=False, allow_blank=True)
    limit = serializers.IntegerField(default=100, min_value=1, max_value=200)


class CrawlRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True, max_length=2048)
    max_depth = serializers.IntegerField(default=2, min_value=1, max_value=3)
    limit = serializers.IntegerField(default=25, min_value=1, max_value=50)
    idempotency_key = serializers.CharField(max_length=128, required=False, allow_blank=True)


class BatchScrapeRequestSerializer(serializers.Serializer):
    urls = serializers.ListField(
        child=serializers.URLField(max_length=2048),
        min_length=1,
        max_length=20,
        required=True,
    )


class ExtractRequestSerializer(serializers.Serializer):
    urls = serializers.ListField(
        child=serializers.URLField(max_length=2048),
        min_length=1,
        max_length=5,
        required=True,
    )
    schema = serializers.DictField(required=True)
    prompt = serializers.CharField(required=False, allow_blank=True)


class ResearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=1000, required=True)
    mode = serializers.CharField(default="MEDICAL_EVIDENCE")


class ClinicianReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["ACCEPTED", "REJECTED", "REQUIRES_ADDITIONAL_EVIDENCE"])
    review_notes = serializers.CharField(required=False, allow_blank=True)


class WebCrawlPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebCrawlPage
        fields = ["id", "url", "title", "status_code", "content_hash", "error", "created_at"]


class WebCrawlJobSerializer(serializers.ModelSerializer):
    pages = WebCrawlPageSerializer(many=True, read_only=True)

    class Meta:
        model = WebCrawlJob
        fields = [
            "id",
            "upstream_job_id",
            "base_url",
            "status",
            "total_pages",
            "completed_pages",
            "failure_count",
            "error_message",
            "created_at",
            "updated_at",
            "pages",
        ]


class WebResearchSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebResearchSource
        fields = ["id", "citation_number", "source_title", "source_url", "relevance_score"]


class WebResearchSessionSerializer(serializers.ModelSerializer):
    sources = WebResearchSourceSerializer(many=True, read_only=True)

    class Meta:
        model = WebResearchSession
        fields = [
            "id",
            "role",
            "query",
            "mode",
            "status",
            "findings",
            "uncertainty_notes",
            "limitations",
            "conflicting_evidence",
            "clinician_review_status",
            "reviewed_at",
            "review_notes",
            "policy_version",
            "created_at",
            "completed_at",
            "sources",
        ]


class DomainPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = DomainPolicy
        fields = ["id", "domain", "category", "trust_tier", "status", "allowed_roles", "reason", "updated_at"]


class WebSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebSource
        fields = ["id", "name", "domain", "base_url", "trust_tier", "freshness_ttl_hours", "last_retrieved_at", "updated_at"]


class WebDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebDocument
        fields = [
            "id",
            "url",
            "canonical_url",
            "title",
            "description",
            "markdown_content",
            "sanitized_html",
            "content_hash",
            "status_code",
            "trust_tier",
            "retrieved_at",
        ]
