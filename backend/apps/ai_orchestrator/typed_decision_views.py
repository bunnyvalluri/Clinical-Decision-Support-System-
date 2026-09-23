"""
REST API Views for Controlled Typed Decisions & Laya-MLX Engine.
"""
import uuid
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from integrations.laya_mlx.adapter import LayaMLXProvider
from integrations.laya_mlx.config import LayaMLXConfig
from integrations.laya_mlx.safety import TypedDecisionSafety
from .typed_decision_models import (
    TypedDecisionProvider,
    TypedDecisionModel,
    TypedDecisionSchema,
    TypedDecisionRequest,
    TypedDecisionResult,
    TypedDecisionEvaluation,
    TypedDecisionAuditEvent,
    SchemaStatus,
    DecisionTypeChoices,
    UncertaintyStatusChoices,
)
from .typed_decision_serializers import (
    TypedDecisionProviderSerializer,
    TypedDecisionModelSerializer,
    TypedDecisionSchemaSerializer,
    TypedDecisionRequestSerializer,
    TypedDecisionResultSerializer,
    TypedDecisionEvaluationSerializer,
    TypedDecisionInferenceInputSerializer,
    SchemaRobustnessTestSerializer,
    TypedDecisionKillSwitchSerializer,
)

logger = logging.getLogger("ai_orchestrator.typed_decision_views")


def broadcast_decision_event(event_type: str, data: dict):
    """
    Publish real-time notification to authenticated Django Channels group.
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "typed_decisions",
                {
                    "type": "typed_decision_broadcast",
                    "event": event_type,
                    "payload": data,
                }
            )
    except Exception as e:
        logger.debug(f"Channels broadcast skipped or unavailable: {e}")


class LayaCapabilitiesView(APIView):
    """
    GET /api/ai/providers/laya/capabilities
    Honest platform and runtime capability detection.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        provider = LayaMLXProvider()
        caps = provider.capabilities()
        return Response(caps, status=status.HTTP_200_OK)


class LayaHealthView(APIView):
    """
    GET /api/ai/providers/laya/health/
    Detailed health check and diagnostics.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        provider = LayaMLXProvider()
        health = provider.health_check()
        return Response(health, status=status.HTTP_200_OK)


class TypedDecisionInferenceView(APIView):
    """
    POST /api/v1/ai/typed-decisions/predict/
    Executes controlled typed-decision inference under the AI Safety Gateway.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TypedDecisionInferenceInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        schema_name = data["schema_name"]
        schema_version = data["schema_version"]
        case_context = data["case_context"]
        correlation_id = data.get("correlation_id") or str(uuid.uuid4())

        # 1. Fetch and validate schema
        try:
            schema = TypedDecisionSchema.objects.get(name=schema_name, version=schema_version)
        except TypedDecisionSchema.DoesNotExist:
            return Response(
                {"error": f"Schema '{schema_name}' v'{schema_version}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # In production clinical workflows, only APPROVED or ACTIVE schemas may be used
        if schema.status not in (SchemaStatus.APPROVED, SchemaStatus.ACTIVE):
            return Response(
                {
                    "error": f"Schema '{schema_name}' status is {schema.status}. Only APPROVED or ACTIVE schemas may be executed."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Check option robustness gate
        if schema.robustness_status == "ROBUSTNESS_FAILED":
            return Response(
                {
                    "error": f"Schema '{schema_name}' is marked ROBUSTNESS_FAILED and cannot be used for clinical decisions."
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        broadcast_decision_event("typed_decision.started", {
            "correlation_id": correlation_id,
            "schema_name": schema.name,
            "schema_version": schema.version,
        })

        # 3. Minimized context hashing & audit request creation
        clean_context = TypedDecisionSafety.sanitize_context(case_context)
        minimized, had_phi = TypedDecisionSafety.minimize_and_redact_phi(clean_context)
        context_hash = str(uuid.uuid5(uuid.NAMESPACE_DNS, minimized))

        db_provider, _ = TypedDecisionProvider.objects.get_or_create(
            name="laya-mlx",
            defaults={"display_name": "Laya-MLX Native Runtime"}
        )

        user_role = getattr(request.user, "role", "DOCTOR") or "DOCTOR"
        req_audit = TypedDecisionRequest.objects.create(
            schema=schema,
            provider=db_provider,
            user=request.user,
            user_role=user_role,
            correlation_id=correlation_id,
            context_hash=context_hash,
            had_phi_redaction=had_phi,
            decision_type=schema.decision_type,
        )

        # 4. Invoke Provider
        provider = LayaMLXProvider()
        options = data.get("custom_options") or schema.allowed_options

        if schema.decision_type == DecisionTypeChoices.CHOICE:
            output = provider.predict_choice(
                minimized, schema.instructions, options, schema.version, correlation_id
            )
        elif schema.decision_type == DecisionTypeChoices.SCORE:
            output = provider.predict_score(
                minimized, schema.instructions, options, schema.version, correlation_id
            )
        else:
            output = provider.predict_boolean(
                minimized, schema.instructions, schema.version, correlation_id
            )

        # 5. Persist immutable result
        res_obj = TypedDecisionResult.objects.create(
            request=req_audit,
            result_value=str(output.result_value),
            confidence=output.confidence,
            probabilities=output.probabilities,
            uncertainty_status=output.uncertainty_status,
            requires_human_review=output.requires_human_review,
            latency_ms=output.latency_ms,
        )

        event_name = "typed_decision.completed"
        if output.requires_human_review:
            event_name = "typed_decision.requires_review"
        elif output.uncertainty_status == UncertaintyStatusChoices.PROVIDER_UNAVAILABLE:
            event_name = "typed_decision.provider_unavailable"

        broadcast_decision_event(event_name, {
            "result_id": str(res_obj.id),
            "correlation_id": correlation_id,
            "decision_type": schema.decision_type,
            "result_value": str(output.result_value),
            "confidence": output.confidence,
            "requires_human_review": output.requires_human_review,
            "uncertainty_status": output.uncertainty_status,
        })

        return Response(
            {
                "id": str(res_obj.id),
                "correlation_id": correlation_id,
                "schema_name": schema.name,
                "schema_version": schema.version,
                "decision_type": schema.decision_type,
                "result_value": output.result_value,
                "confidence": output.confidence,
                "probabilities": output.probabilities,
                "uncertainty_status": output.uncertainty_status,
                "requires_human_review": output.requires_human_review,
                "latency_ms": output.latency_ms,
                "provider": output.provider_name,
                "model_identifier": output.model_identifier,
                "model_revision": output.model_revision,
                "created_at": res_obj.created_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )


class TypedDecisionSchemaListCreateView(APIView):
    """
    GET /api/v1/ai/typed-decisions/schemas/
    POST /api/v1/ai/typed-decisions/schemas/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        schemas = TypedDecisionSchema.objects.all().order_by("-created_at")
        serializer = TypedDecisionSchemaSerializer(schemas, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Only Informaticist and Admin may create/modify schemas
        user_role = getattr(request.user, "role", "")
        if user_role not in ("INFORMATICIST", "ADMIN") and not request.user.is_staff:
            return Response(
                {"error": "Only Informaticists or Admins may create or register decision schemas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TypedDecisionSchemaSerializer(data=request.data)
        if serializer.is_valid():
            schema = serializer.save(owner=request.user)
            TypedDecisionAuditEvent.objects.create(
                action="SCHEMA_CREATED",
                actor=request.user,
                actor_role=user_role,
                target_identifier=f"{schema.name}:{schema.version}",
                details={"status": schema.status},
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TypedDecisionSchemaDetailView(APIView):
    """
    GET /api/v1/ai/typed-decisions/schemas/<uuid:schema_id>/
    PATCH /api/v1/ai/typed-decisions/schemas/<uuid:schema_id>/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, schema_id):
        try:
            schema = TypedDecisionSchema.objects.get(id=schema_id)
        except TypedDecisionSchema.DoesNotExist:
            return Response({"error": "Schema not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = TypedDecisionSchemaSerializer(schema)
        return Response(serializer.data)

    def patch(self, request, schema_id):
        user_role = getattr(request.user, "role", "")
        if user_role not in ("INFORMATICIST", "ADMIN") and not request.user.is_staff:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        try:
            schema = TypedDecisionSchema.objects.get(id=schema_id)
        except TypedDecisionSchema.DoesNotExist:
            return Response({"error": "Schema not found"}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        if new_status and new_status == SchemaStatus.APPROVED:
            schema.approved_at = timezone.now()
        elif new_status and new_status == SchemaStatus.RETIRED:
            schema.retired_at = timezone.now()

        serializer = TypedDecisionSchemaSerializer(schema, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            TypedDecisionAuditEvent.objects.create(
                action="SCHEMA_UPDATED",
                actor=request.user,
                actor_role=user_role,
                target_identifier=f"{updated.name}:{updated.version}",
                details=request.data,
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SchemaRobustnessTriggerView(APIView):
    """
    POST /api/v1/ai/typed-decisions/evaluations/robustness-test/
    Runs synchronous or triggers asynchronous permutation robustness test.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SchemaRobustnessTestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        schema_id = serializer.validated_data["schema_id"]
        sample_context = serializer.validated_data["sample_context"]

        try:
            schema = TypedDecisionSchema.objects.get(id=schema_id)
        except TypedDecisionSchema.DoesNotExist:
            return Response({"error": "Schema not found"}, status=status.HTTP_404_NOT_FOUND)

        provider = LayaMLXProvider()

        def predict_proxy(ctx, instructions, options):
            return provider.predict_choice(ctx, instructions, options)

        result = TypedDecisionSafety.evaluate_permutation_robustness(
            predict_proxy,
            sample_context,
            schema.instructions,
            schema.allowed_options,
        )

        schema.robustness_status = result["status"]
        schema.robustness_score = result["robustness_score"]
        schema.save()

        eval_obj = TypedDecisionEvaluation.objects.create(
            schema=schema,
            sample_size=result["permutations_tested"],
            robustness_score=result["robustness_score"],
            passed_robustness=result["is_stable"],
            evaluation_details=result,
        )

        TypedDecisionAuditEvent.objects.create(
            action="ROBUSTNESS_EVALUATED",
            actor=request.user,
            actor_role=getattr(request.user, "role", "USER"),
            target_identifier=f"{schema.name}:{schema.version}",
            details=result,
        )

        return Response({
            "evaluation_id": str(eval_obj.id),
            "schema_id": str(schema.id),
            "schema_name": schema.name,
            **result,
        }, status=status.HTTP_200_OK)


class TypedDecisionEvaluationListView(APIView):
    """
    GET /api/v1/ai/typed-decisions/evaluations/
    Lists model and schema evaluation records.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        evals = TypedDecisionEvaluation.objects.all().order_by("-evaluated_at")[:50]
        serializer = TypedDecisionEvaluationSerializer(evals, many=True)
        return Response(serializer.data)


class TypedDecisionHistoryListView(APIView):
    """
    GET /api/v1/ai/typed-decisions/history/
    Lists inference requests and results with role filtering.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, "role", "")
        qs = TypedDecisionRequest.objects.select_related("schema", "result").all().order_by("-created_at")
        if user_role not in ("ADMIN", "INFORMATICIST") and not request.user.is_staff:
            qs = qs.filter(user=request.user)

        serializer = TypedDecisionRequestSerializer(qs[:50], many=True)
        return Response(serializer.data)


class TypedDecisionKillSwitchView(APIView):
    """
    POST /api/v1/ai/typed-decisions/kill-switch/
    Emergency administrative kill switch for Laya-MLX.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_role = getattr(request.user, "role", "")
        if user_role != "ADMIN" and not request.user.is_staff:
            return Response({"error": "Admin permission required."}, status=status.HTTP_403_FORBIDDEN)

        serializer = TypedDecisionKillSwitchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        enabled = serializer.validated_data["enabled"]
        reason = serializer.validated_data.get("reason", "Administrative action")

        LayaMLXConfig.ENABLED = enabled
        db_provider, _ = TypedDecisionProvider.objects.get_or_create(
            name="laya-mlx",
            defaults={"display_name": "Laya-MLX Native Runtime"}
        )
        db_provider.is_enabled = enabled
        db_provider.health_status = "READY" if enabled else "DISABLED"
        db_provider.save()

        TypedDecisionAuditEvent.objects.create(
            action="KILL_SWITCH_TOGGLED",
            actor=request.user,
            actor_role="ADMIN",
            target_identifier="laya-mlx",
            details={"enabled": enabled, "reason": reason},
        )

        broadcast_decision_event("typed_decision.kill_switch_toggled", {
            "enabled": enabled,
            "reason": reason,
            "timestamp": timezone.now().isoformat(),
        })

        return Response({
            "provider": "laya-mlx",
            "is_enabled": enabled,
            "reason": reason,
            "status": "DISABLED" if not enabled else "READY",
        })


class TypedDecisionReviewView(APIView):
    """
    POST /api/v1/ai/typed-decisions/results/<uuid:result_id>/review/
    Allows clinician to review and sign-off on AI workflow decision.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, result_id):
        try:
            res = TypedDecisionResult.objects.get(id=result_id)
        except TypedDecisionResult.DoesNotExist:
            return Response({"error": "Result not found"}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action", "APPROVED")  # APPROVED, OVERRIDDEN, REJECTED
        res.clinician_review_status = action
        res.clinician_action = request.data.get("notes", "")
        res.reviewed_by = request.user
        res.reviewed_at = timezone.now()
        res.save()

        TypedDecisionAuditEvent.objects.create(
            action="DECISION_REVIEWED",
            actor=request.user,
            actor_role=getattr(request.user, "role", "DOCTOR"),
            target_identifier=str(res.id),
            details={"action": action, "notes": res.clinician_action},
        )

        broadcast_decision_event("typed_decision.review_completed", {
            "result_id": str(res.id),
            "action": action,
            "reviewed_by": request.user.username,
        })

        return Response({
            "result_id": str(res.id),
            "status": action,
            "reviewed_at": res.reviewed_at.isoformat(),
        })
