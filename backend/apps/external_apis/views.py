import logging
import uuid
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.external_apis.models import (
    ExternalAPIRegistry,
    ExternalAPIApproval,
    ExternalAPIHealth,
    ExternalAPIAuditLog,
    APIStatus,
)
from apps.external_apis.serializers import (
    ExternalAPIRegistrySerializer,
    ExternalAPIApprovalSerializer,
    ExternalAPIHealthSerializer,
    ExternalAPIAuditLogSerializer,
    DrugSearchQuerySerializer,
    ProviderLookupQuerySerializer,
    NutritionQuerySerializer,
)
from apps.external_apis.services.gateway import ExternalAPIService

logger = logging.getLogger(__name__)
gateway = ExternalAPIService()


class ExternalAPIRegistryListView(APIView):
    """List or register external healthcare APIs in the authoritative registry."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = ExternalAPIRegistry.objects.all()
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        category_filter = request.query_params.get("category")
        if category_filter:
            qs = qs.filter(category__iexact=category_filter)
        serializer = ExternalAPIRegistrySerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    def post(self, request):
        # Only Admins and Medical Informaticists can propose new API entries
        user_role = getattr(request.user, "role", "")
        if user_role not in ["ADMIN", "IT_ADMIN", "MEDICAL_INFORMATICIST"] and not request.user.is_staff:
            return Response({"detail": "Forbidden: Insufficient privileges to register new APIs."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ExternalAPIRegistrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        api_obj = serializer.save(status=APIStatus.DISCOVERED, approved_for_use=False)
        return Response(ExternalAPIRegistrySerializer(api_obj).data, status=status.HTTP_201_CREATED)


class ExternalAPIRegistryDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            api_obj = ExternalAPIRegistry.objects.get(pk=pk)
        except ExternalAPIRegistry.DoesNotExist:
            return Response({"detail": "API record not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ExternalAPIRegistrySerializer(api_obj).data)

    def patch(self, request, pk):
        user_role = getattr(request.user, "role", "")
        if user_role not in ["ADMIN", "IT_ADMIN"] and not request.user.is_staff:
            return Response({"detail": "Forbidden: Admin privileges required to modify API registry."}, status=status.HTTP_403_FORBIDDEN)
        try:
            api_obj = ExternalAPIRegistry.objects.get(pk=pk)
        except ExternalAPIRegistry.DoesNotExist:
            return Response({"detail": "API record not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExternalAPIRegistrySerializer(api_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(ExternalAPIRegistrySerializer(updated).data)


class ExternalAPIApprovalListView(APIView):
    """Audit and submit human-in-the-loop review decisions for API stages."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = ExternalAPIApproval.objects.select_related("api", "reviewer").all()[:100]
        serializer = ExternalAPIApprovalSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    def post(self, request):
        user_role = getattr(request.user, "role", "")
        if user_role not in ["ADMIN", "IT_ADMIN", "CLINICIAN", "DOCTOR", "MEDICAL_INFORMATICIST"] and not request.user.is_staff:
            return Response({"detail": "Forbidden: Insufficient role to approve external APIs."}, status=status.HTTP_403_FORBIDDEN)

        api_id = request.data.get("api_id")
        stage = request.data.get("stage")
        decision = request.data.get("decision")
        notes = request.data.get("notes", "")

        try:
            api_obj = ExternalAPIRegistry.objects.get(id=api_id)
        except (ExternalAPIRegistry.DoesNotExist, ValueError):
            return Response({"detail": "Invalid or missing api_id."}, status=status.HTTP_400_BAD_REQUEST)

        approval = ExternalAPIApproval.objects.create(
            api=api_obj,
            stage=stage,
            decision=decision,
            reviewer=request.user,
            reviewer_role=user_role,
            notes=notes,
        )

        # Handle Stage Transitions
        if decision == "APPROVED":
            if stage == "CLINICAL_REVIEW" or stage == "APPROVED":
                api_obj.status = APIStatus.ACTIVE
                api_obj.approved_for_use = True
            elif stage in APIStatus.values:
                api_obj.status = stage
            api_obj.save(update_fields=["status", "approved_for_use", "updated_at"])
        elif decision == "REJECTED":
            api_obj.status = APIStatus.REJECTED
            api_obj.approved_for_use = False
            api_obj.save(update_fields=["status", "approved_for_use", "updated_at"])

        return Response(ExternalAPIApprovalSerializer(approval).data, status=status.HTTP_201_CREATED)


class ExternalAPIHealthListView(APIView):
    """Inspect or trigger health checks across external healthcare providers."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = ExternalAPIHealth.objects.select_related("api").all()[:50]
        serializer = ExternalAPIHealthSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})

    def post(self, request):
        # Trigger immediate probe run
        results = gateway.run_health_checks()
        return Response({"status": "PROBE_COMPLETE", "probes": results})


class ExternalAPIAuditLogListView(APIView):
    """Privileged audit log inspection."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, "role", "")
        if user_role not in ["ADMIN", "IT_ADMIN", "MEDICAL_INFORMATICIST"] and not request.user.is_staff:
            return Response({"detail": "Forbidden: Admin or Informaticist role required."}, status=status.HTTP_403_FORBIDDEN)
        qs = ExternalAPIAuditLog.objects.select_related("api", "user").all()[:100]
        serializer = ExternalAPIAuditLogSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})


class DrugSearchView(APIView):
    """Clinician-facing query to openFDA for official drug labeling and adverse events."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = DrugSearchQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        drug_name = serializer.validated_data["drug_name"]

        try:
            result = gateway.query(
                provider_name="openFDA",
                endpoint="label.json",
                params={"search": f'openfda.brand_name:"{drug_name}"', "limit": 1},
                user=request.user,
                request_id=f"req-drug-{uuid.uuid4().hex[:8]}",
            )
            return Response(result)
        except Exception as exc:
            logger.error("Drug search failed: %s", exc)
            return Response(
                {
                    "error": "EXTERNAL_DATA_UNAVAILABLE",
                    "detail": "OpenFDA drug reference information is temporarily unavailable.",
                    "provenance": {"provider": "openFDA", "status": "FAILED"},
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class ProviderLookupView(APIView):
    """NPPES NPI Registry lookup for healthcare provider verification."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = ProviderLookupQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        params = {}
        if serializer.validated_data.get("npi"):
            params["number"] = serializer.validated_data["npi"]
        if serializer.validated_data.get("first_name"):
            params["first_name"] = serializer.validated_data["first_name"]
        if serializer.validated_data.get("last_name"):
            params["last_name"] = serializer.validated_data["last_name"]

        try:
            result = gateway.query(
                provider_name="NPPES",
                endpoint="",
                params=params,
                user=request.user,
                request_id=f"req-npi-{uuid.uuid4().hex[:8]}",
            )
            return Response(result)
        except Exception as exc:
            logger.error("Provider lookup failed: %s", exc)
            return Response(
                {
                    "error": "EXTERNAL_DATA_UNAVAILABLE",
                    "detail": "NPPES Provider Registry is temporarily unavailable.",
                    "provenance": {"provider": "NPPES", "status": "FAILED"},
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class NutritionSearchView(APIView):
    """USDA FoodData Central nutritional lookup for dietary triage."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = NutritionQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        query = serializer.validated_data["query"]

        try:
            result = gateway.query(
                provider_name="USDA FoodData Central",
                endpoint="foods/search",
                params={"query": query, "pageSize": 1},
                user=request.user,
                request_id=f"req-nutr-{uuid.uuid4().hex[:8]}",
            )
            return Response(result)
        except Exception as exc:
            logger.error("Nutrition search failed: %s", exc)
            return Response(
                {
                    "error": "EXTERNAL_DATA_UNAVAILABLE",
                    "detail": "USDA FoodData Central reference is temporarily unavailable.",
                    "provenance": {"provider": "USDA FoodData Central", "status": "FAILED"},
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class CircuitBreakerStatusView(APIView):
    """Inspect and reset circuit breaker states for external providers."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        states = {}
        for name in gateway.adapters.keys():
            states[name] = gateway.get_circuit_state(name)
        return Response({"circuit_states": states})

    def post(self, request):
        user_role = getattr(request.user, "role", "")
        if user_role not in ["ADMIN", "IT_ADMIN"] and not request.user.is_staff:
            return Response({"detail": "Forbidden: Admin role required to reset circuit breakers."}, status=status.HTTP_403_FORBIDDEN)
        provider = request.data.get("provider")
        if provider:
            gateway.reset_circuit(provider)
            return Response({"detail": f"Circuit breaker for '{provider}' reset to CLOSED."})
        return Response({"detail": "Missing provider name."}, status=status.HTTP_400_BAD_REQUEST)
