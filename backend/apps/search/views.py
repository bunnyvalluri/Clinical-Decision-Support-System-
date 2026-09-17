"""
REST Framework API Views for Search Platform.
Implements validated, authorization-aware endpoints for search, autocomplete,
facets, cluster health, reindexing, task queue monitoring, and tenant tokens.
"""
import json
import logging
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from integrations.meilisearch.service import get_search_service
from integrations.meilisearch.health import SearchHealthService
from integrations.meilisearch.permissions import SearchPolicyService, ROLE_IT_ADMIN, ROLE_INFORMATICIST
from integrations.meilisearch.tenant_tokens import generate_scoped_tenant_token
from integrations.meilisearch.client import get_meilisearch_client
from integrations.meilisearch.index_manager import INDEX_CONFIGS
from .models import SearchIndexRegistry
from .serializers import (
    SearchRequestSerializer,
    SearchSuggestionRequestSerializer,
    SearchIndexRegistrySerializer,
)

logger = logging.getLogger(__name__)


class SearchQueryView(APIView):
    """
    Primary multi-index clinical search endpoint.
    GET /api/v1/search/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = SearchRequestSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        query = data.get("q", "")
        index_name = data.get("index") or None
        sort = data.get("sort") or None
        page = data.get("page", 1)
        limit = data.get("limit", 20)
        highlight = data.get("highlight", True)
        facets = data.get("facets", [])

        # Parse filters if provided as JSON string
        filters_dict = None
        raw_filters = request.query_params.get("filters")
        if raw_filters:
            try:
                filters_dict = json.loads(raw_filters)
            except Exception:
                filters_dict = None

        correlation_id = getattr(request, "correlation_id", "")

        service = get_search_service()
        try:
            results = service.search(
                user=request.user,
                query=query,
                index_name=index_name,
                filters_dict=filters_dict,
                sort=sort,
                facets=facets,
                page=page,
                limit=limit,
                highlight=highlight,
                correlation_id=correlation_id,
            )
            return Response({"success": True, "data": results}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("SearchQueryView exception: %s", exc)
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR if not hasattr(exc, "code") else status.HTTP_403_FORBIDDEN,
            )


class SearchSuggestionsView(APIView):
    """
    Fast autocomplete suggestions.
    GET /api/v1/search/suggestions/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = SearchSuggestionRequestSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        query = serializer.validated_data["q"]
        index_name = serializer.validated_data.get("index") or None

        service = get_search_service()
        suggestions = service.get_suggestions(request.user, query, index_name)
        return Response({"success": True, "data": suggestions}, status=status.HTTP_200_OK)


class SearchFacetsView(APIView):
    """
    Facet distribution for filtering.
    GET /api/v1/search/facets/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        index_name = request.query_params.get("index", "patients")
        service = get_search_service()
        facets = service.get_facets(request.user, index_name)
        return Response({"success": True, "data": facets}, status=status.HTTP_200_OK)


class SearchHealthView(APIView):
    """
    Cluster status and telemetry for IT Admin.
    GET /api/v1/search/health/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        health = SearchHealthService.get_health_status()
        return Response({"success": True, "data": health}, status=status.HTTP_200_OK)


class SearchReindexView(APIView):
    """
    Trigger reindexing (IT Admin and Medical Informaticist only).
    POST /api/v1/search/reindex/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        role = SearchPolicyService.normalize_role(request.user)
        if role not in (ROLE_IT_ADMIN, ROLE_INFORMATICIST):
            return Response(
                {"success": False, "error": "Only Administrators and Informaticists may trigger reindexing."},
                status=status.HTTP_403_FORBIDDEN,
            )

        target_index = request.data.get("index", "")
        from .tasks import reindex_all_search_task
        task = reindex_all_search_task.delay(target_index)

        return Response(
            {
                "success": True,
                "message": f"Reindexing initiated for '{target_index or 'all'}'",
                "task_id": str(task.id),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class SearchIndexesView(APIView):
    """
    List registered search indexes and schema definitions.
    GET /api/v1/search/indexes/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        allowed = SearchPolicyService.get_allowed_indexes(request.user)
        indexes_data = []

        for idx_uid in allowed:
            cfg = INDEX_CONFIGS.get(idx_uid, {})
            indexes_data.append({
                "index_uid": idx_uid,
                "searchable_attributes": cfg.get("searchable_attributes", []),
                "filterable_attributes": cfg.get("filterable_attributes", []),
                "sortable_attributes": cfg.get("sortable_attributes", []),
            })

        return Response({"success": True, "data": indexes_data}, status=status.HTTP_200_OK)


class SearchTasksView(APIView):
    """
    Meilisearch task queue monitor (IT Admin only).
    GET /api/v1/search/tasks/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        role = SearchPolicyService.normalize_role(request.user)
        if role != ROLE_IT_ADMIN:
            return Response(
                {"success": False, "error": "Only IT Administrators may inspect the raw search task queue."},
                status=status.HTTP_403_FORBIDDEN,
            )

        client = get_meilisearch_client()
        tasks = client.get_tasks(limit=30)
        return Response({"success": True, "data": tasks}, status=status.HTTP_200_OK)


class SearchTenantTokenView(APIView):
    """
    Generate scoped tenant token for authenticated client.
    GET /api/v1/search/tenant-token/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        token = generate_scoped_tenant_token(request.user)
        if not token:
            return Response(
                {"success": False, "error": "Could not generate tenant token."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response({"success": True, "token": token}, status=status.HTTP_200_OK)
