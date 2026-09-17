"""
REST Framework views for NocoDB Healthcare Analytics.
"""
from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.nocodb.models import (
    NocoDBDataset,
    NocoDBRowRecord,
    NocoDBAuditEvent,
    NocoDBViewPreference,
)
from apps.nocodb.permissions import (
    CanAccessNocoDBWorkspace,
    CanAccessDataset,
    CanMutateNocoDBData,
    CanExportNocoDBDataset,
    normalize_role,
)
from apps.nocodb.serializers import (
    NocoDBDatasetListSerializer,
    NocoDBDatasetDetailSerializer,
    NocoDBAuditEventSerializer,
    NocoDBViewPreferenceSerializer,
)
from apps.nocodb.services.dataset_service import DatasetService
from apps.nocodb.services.sync_service import SyncService
from apps.nocodb.services.integration_service import IntegrationService
from apps.nocodb.services.mcp_gateway import NocoDBMCPGateway
from apps.nocodb.services.schema_service import SchemaService
from apps.nocodb.validators import validate_query_safety, validate_page_size


class NocoDBHealthView(APIView):
    """Checks NocoDB integration health, container status, and DB connectivity."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        telemetry = IntegrationService.check_nocodb_health()
        return Response(telemetry, status=status.HTTP_200_OK)


class NocoDBDatasetListView(APIView):
    """Lists all datasets accessible to the calling user role."""
    permission_classes = [IsAuthenticated, CanAccessNocoDBWorkspace]

    def get(self, request):
        # Ensure standard datasets exist
        SchemaService.ensure_standard_datasets()
        datasets = DatasetService.list_accessible_datasets(request.user)
        serializer = NocoDBDatasetListSerializer(datasets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NocoDBDatasetDetailView(APIView):
    """Retrieves dataset metadata and column schema."""
    permission_classes = [IsAuthenticated, CanAccessNocoDBWorkspace]

    def get(self, request, slug):
        try:
            dataset = NocoDBDataset.objects.get(slug=slug, is_active=True)
        except NocoDBDataset.DoesNotExist:
            return Response({"error": f"Dataset '{slug}' not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check access permission
        self.check_object_permissions(request, dataset)
        serializer = NocoDBDatasetDetailSerializer(dataset)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NocoDBRowsView(APIView):
    """Queries and paginates dataset rows with search, sorting, and filtering."""
    permission_classes = [IsAuthenticated, CanAccessNocoDBWorkspace]

    def get(self, request, slug):
        try:
            dataset = NocoDBDataset.objects.get(slug=slug, is_active=True)
        except NocoDBDataset.DoesNotExist:
            return Response({"error": f"Dataset '{slug}' not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check access permission
        role = normalize_role(getattr(request.user, "role", ""))
        allowed = [r.lower() for r in (dataset.allowed_roles or [])]
        if not request.user.is_superuser and role != "admin" and role not in allowed:
            return Response({"error": "Role not authorized for this dataset."}, status=status.HTTP_403_FORBIDDEN)

        page = int(request.query_params.get("page", 1))
        page_size = validate_page_size(request.query_params.get("page_size", 25))
        sort = request.query_params.get("sort", "")
        search = request.query_params.get("search", "")

        # Extract column filters
        filters = {}
        for k, v in request.query_params.items():
            if k.startswith("filter[") and k.endswith("]"):
                col = k[7:-1]
                filters[col] = v

        try:
            validate_query_safety(search)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        data = DatasetService.query_rows(
            dataset=dataset,
            user=request.user,
            page=page,
            page_size=page_size,
            sort=sort,
            search=search,
            filters=filters,
            request=request,
        )
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        """Inserts a new row into an analytical dataset."""
        try:
            dataset = NocoDBDataset.objects.get(slug=slug, is_active=True)
        except NocoDBDataset.DoesNotExist:
            return Response({"error": f"Dataset '{slug}' not found."}, status=status.HTTP_404_NOT_FOUND)

        role = normalize_role(getattr(request.user, "role", ""))
        if not request.user.is_superuser and role not in ["admin", "informaticist"]:
            return Response({"error": "Only Informaticists and Admins can insert analytical records."}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data
        row_id = f"custom_{NocoDBRowRecord.objects.filter(dataset=dataset).count() + 1}"
        record = NocoDBRowRecord.objects.create(
            dataset=dataset,
            anon_ref_id=row_id,
            data=payload,
        )
        dataset.row_count = NocoDBRowRecord.objects.filter(dataset=dataset, is_archived=False).count()
        dataset.save(update_fields=["row_count"])
        return Response({"success": True, "record_id": str(record.id), "data": record.data}, status=status.HTTP_201_CREATED)


class NocoDBRowDetailView(APIView):
    """Updates or soft-deletes a row in an analytical dataset."""
    permission_classes = [IsAuthenticated, CanAccessNocoDBWorkspace, CanMutateNocoDBData]

    def patch(self, request, slug, row_id):
        try:
            dataset = NocoDBDataset.objects.get(slug=slug, is_active=True)
        except NocoDBDataset.DoesNotExist:
            return Response({"error": f"Dataset '{slug}' not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            record = DatasetService.mutate_row(
                dataset=dataset,
                row_id=row_id,
                new_data=request.data,
                user=request.user,
                request=request,
            )
            return Response({"success": True, "record_id": str(record.id), "data": record.data}, status=status.HTTP_200_OK)
        except NocoDBRowRecord.DoesNotExist:
            return Response({"error": "Row record not found."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, slug, row_id):
        role = normalize_role(getattr(request.user, "role", ""))
        if not request.user.is_superuser and role != "admin":
            return Response({"error": "Only Admins can archive rows."}, status=status.HTTP_403_FORBIDDEN)

        try:
            record = NocoDBRowRecord.objects.get(id=row_id, dataset__slug=slug)
            record.is_archived = True
            record.save(update_fields=["is_archived", "updated_at"])
            return Response({"success": True, "message": "Row archived."}, status=status.HTTP_200_OK)
        except NocoDBRowRecord.DoesNotExist:
            return Response({"error": "Row record not found."}, status=status.HTTP_404_NOT_FOUND)


class NocoDBExportView(APIView):
    """Exports dataset to CSV with spreadsheet formula injection sanitization."""
    permission_classes = [IsAuthenticated, CanAccessNocoDBWorkspace, CanExportNocoDBDataset]

    def get(self, request, slug):
        try:
            dataset = NocoDBDataset.objects.get(slug=slug, is_active=True)
        except NocoDBDataset.DoesNotExist:
            return Response({"error": f"Dataset '{slug}' not found."}, status=status.HTTP_404_NOT_FOUND)

        csv_content = IntegrationService.export_dataset_csv(dataset=dataset, user=request.user, request=request)
        response = HttpResponse(csv_content, content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{dataset.slug}_export.csv"'
        return response


class NocoDBSyncTriggerView(APIView):
    """Triggers an on-demand projection sync from Neon PostgreSQL."""
    permission_classes = [IsAuthenticated, CanAccessNocoDBWorkspace]

    def post(self, request):
        role = normalize_role(getattr(request.user, "role", ""))
        if not request.user.is_superuser and role not in ["admin", "informaticist"]:
            return Response({"error": "Only Admins and Informaticists can trigger sync."}, status=status.HTTP_403_FORBIDDEN)

        sync_results = SyncService.sync_all_datasets()
        return Response({"success": True, "results": sync_results}, status=status.HTTP_200_OK)


class NocoDBAuditLogsView(APIView):
    """Lists audit events for NocoDB workspace interactions."""
    permission_classes = [IsAuthenticated, CanAccessNocoDBWorkspace]

    def get(self, request):
        role = normalize_role(getattr(request.user, "role", ""))
        if not request.user.is_superuser and role not in ["admin", "informaticist"]:
            return Response({"error": "Only Admins and Informaticists can view audit logs."}, status=status.HTTP_403_FORBIDDEN)

        limit = min(int(request.query_params.get("limit", 50)), 100)
        logs = NocoDBAuditEvent.objects.all().order_by("-created_at")[:limit]
        serializer = NocoDBAuditEventSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NocoDBMCPExecuteView(APIView):
    """Guarded MCP tool execution endpoint for AI agents."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Returns the MCP tool manifest."""
        manifest = NocoDBMCPGateway.get_tool_manifest()
        return Response({"tools": manifest}, status=status.HTTP_200_OK)

    def post(self, request):
        tool_name = request.data.get("tool")
        arguments = request.data.get("arguments", {})
        agent_name = request.data.get("agent", "ruflo_coordinator")

        if not tool_name:
            return Response({"error": "Missing 'tool' parameter."}, status=status.HTTP_400_BAD_REQUEST)

        res = NocoDBMCPGateway.execute_tool(
            tool_name=tool_name,
            arguments=arguments,
            user=request.user,
            agent_name=agent_name,
        )
        status_code = status.HTTP_200_OK if res.get("success") else status.HTTP_400_BAD_REQUEST
        return Response(res, status=status_code)


class NocoDBViewPreferencesView(APIView):
    """Saves and retrieves custom user views (filters, sorts, hidden columns) for a dataset."""
    permission_classes = [IsAuthenticated, CanAccessNocoDBWorkspace]

    def get(self, request, slug):
        views = NocoDBViewPreference.objects.filter(user=request.user, dataset__slug=slug)
        serializer = NocoDBViewPreferenceSerializer(views, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        try:
            dataset = NocoDBDataset.objects.get(slug=slug, is_active=True)
        except NocoDBDataset.DoesNotExist:
            return Response({"error": f"Dataset '{slug}' not found."}, status=status.HTTP_404_NOT_FOUND)

        name = request.data.get("name", "Custom View")
        view_type = request.data.get("view_type", "grid")
        config = request.data.get("config", {})
        is_default = request.data.get("is_default", False)

        pref, _ = NocoDBViewPreference.objects.update_or_create(
            user=request.user,
            dataset=dataset,
            name=name,
            defaults={
                "view_type": view_type,
                "config": config,
                "is_default": is_default,
            },
        )
        serializer = NocoDBViewPreferenceSerializer(pref)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
