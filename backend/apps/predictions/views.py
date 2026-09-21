"""
Prediction Views and ViewSets.
Provides real-time clinical risk inference, batch processing, clinician overrides,
and historical prediction audit inspection.
"""
from django.db.models import QuerySet
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.core.exceptions import ApplicationError
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import HasPredictionAccess, IsAdminOrClinician
from apps.predictions.models import Prediction
from apps.predictions.serializers import (
    BatchPredictionRequestSerializer,
    ClinicalOverrideSerializer,
    PredictionExplanationDetailSerializer,
    PredictionListSerializer,
    PredictionRequestSerializer,
    PredictionSerializer,
)
from services.prediction_service import PredictionService


class PredictionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for real-time patient risk predictions and historical audit inspection.

    Endpoints:
    - GET    /api/v1/predictions/            -> Paginated history of risk predictions.
    - POST   /api/v1/predictions/            -> Run real-time inference for a patient.
    - GET    /api/v1/predictions/{id}/       -> Detailed prediction attributions & explanation.
    - POST   /api/v1/predictions/batch/      -> High-throughput vectorized batch inference.
    - POST   /api/v1/predictions/{id}/override/ -> Physician clinical override.
    """

    permission_classes = [permissions.IsAuthenticated, HasPredictionAccess]
    pagination_class = StandardResultsPagination
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self) -> QuerySet[Prediction]:
        user = self.request.user
        qs = Prediction.objects.select_related(
            "patient",
            "model_version",
            "clinical_record",
            "overridden_by",
            "explanation",
        ).order_by("-prediction_timestamp")

        # Patients can strictly ONLY see predictions about themselves
        if getattr(user, "is_patient", user.role == UserRole.PATIENT):
            qs = qs.filter(patient__user=user)

        # Query parameter filters
        patient_id = self.request.query_params.get("patient_id")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

        risk_level = self.request.query_params.get("risk_level")
        if risk_level:
            qs = qs.filter(prediction_result=risk_level.upper())

        model_name = self.request.query_params.get("model_name")
        if model_name:
            qs = qs.filter(model_name=model_name)

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return PredictionListSerializer
        if self.action == "create":
            return PredictionRequestSerializer
        if self.action == "batch":
            return BatchPredictionRequestSerializer
        if self.action == "override":
            return ClinicalOverrideSerializer
        return PredictionSerializer

    def create(self, request: Request, *args, **kwargs) -> Response:
        """
        Execute real-time risk assessment for a patient.
        Returns prediction, probability, confidence, explanation, and latency.
        """
        serializer = PredictionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = PredictionService()
        try:
            prediction = service.predict_patient(
                patient_id=data["patient_id"],
                clinical_record_id=data.get("clinical_record_id"),
                model_name=data.get("model_name"),
                vitals=data.get("vitals"),
                requested_by=request.user,
            )
        except ApplicationError as exc:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": getattr(exc, "code", "prediction_error"),
                        "message": str(exc.message if hasattr(exc, "message") else exc),
                    },
                },
                status=getattr(exc, "status_code", status.HTTP_400_BAD_REQUEST),
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error("Unexpected prediction failure: %s", exc, exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "prediction_execution_failed",
                        "message": "The clinical prediction service was unable to complete assessment.",
                    },
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_serializer = PredictionSerializer(prediction)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=["post"],
        url_path="batch",
        permission_classes=[permissions.IsAuthenticated, IsAdminOrClinician],
    )
    def batch(self, request: Request) -> Response:
        """
        High-throughput batch prediction for multiple patient encounter records.
        """
        serializer = BatchPredictionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = PredictionService()
        try:
            results = service.predict_batch(
                records=data["records"],
                model_name=data.get("model_name"),
                requested_by=request.user,
            )
        except ApplicationError as exc:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": getattr(exc, "code", "batch_prediction_error"),
                        "message": str(exc.message if hasattr(exc, "message") else exc),
                    },
                },
                status=getattr(exc, "status_code", status.HTTP_400_BAD_REQUEST),
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error("Unexpected batch prediction failure: %s", exc, exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "batch_prediction_failed",
                        "message": "Failed to process batch clinical predictions.",
                    },
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "success": True,
                "total_items": len(results),
                "data": results,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="batch-async",
        permission_classes=[permissions.IsAuthenticated, IsAdminOrClinician],
    )
    def batch_async(self, request: Request) -> Response:
        """
        Asynchronously process large batches of patient records using Celery.
        Returns 202 Accepted immediately with task_id.
        """
        serializer = BatchPredictionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from apps.predictions.tasks import process_bulk_predictions_task
        from config.celery import broadcast_task_status

        task = process_bulk_predictions_task.delay(
            records=data["records"],
            model_name=data.get("model_name"),
            requested_by_id=str(request.user.id),
        )

        broadcast_task_status(
            task_id=task.id,
            task_name="bulk_prediction_processing",
            status="QUEUED",
            progress=0,
            result={"total_records": len(data["records"])},
            recipient_user_id=str(request.user.id),
        )

        return Response(
            {
                "task_id": task.id,
                "status": "QUEUED",
                "total_records": len(data["records"]),
                "message": "Bulk prediction job enqueued successfully.",
            },
            status=status.HTTP_202_ACCEPTED,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="override",
        permission_classes=[permissions.IsAuthenticated, IsAdminOrClinician],
    )
    def override(self, request: Request, pk=None) -> Response:
        """
        Physician clinical override of AI risk prediction with required audit rationale.
        """
        serializer = ClinicalOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = PredictionService()
        updated_prediction = service.record_clinical_override(
            prediction_id=pk,
            clinician_override=data["clinician_override"],
            override_reason=data["override_reason"],
            user=request.user,
        )

        return Response(PredictionSerializer(updated_prediction).data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["get"],
        url_path="explanation",
        permission_classes=[permissions.IsAuthenticated, HasPredictionAccess],
    )
    def explanation(self, request: Request, pk=None) -> Response:
        """
        Retrieve the explainable ML attribution for a specific prediction.

        Returns a MODEL EXPLANATION (not a medical diagnosis) with:
        - Per-feature contributions (signed SHAP values where available)
        - Direction of contribution (INCREASES_RISK / DECREASES_RISK)
        - Relative importance (normalized percentage)
        - Medical non-causation disclaimer
        """
        from services.explanation_service import ExplanationService

        # Fetch the prediction with RBAC enforcement via get_queryset
        try:
            prediction = self.get_queryset().select_related("explanation").get(id=pk)
        except Exception:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "prediction_not_found",
                        "message": "Prediction not found or access denied.",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        explanation_svc = ExplanationService()
        result = explanation_svc.format_explanation_response(
            prediction=prediction,
            explanation=getattr(prediction, "explanation", None),
        ) if hasattr(prediction, "explanation") and prediction.explanation else None

        if result is None:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "explanation_not_available",
                        "message": "No explanation is available for this prediction.",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(result, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["get"],
        url_path="comparison",
        permission_classes=[permissions.IsAuthenticated, HasPredictionAccess],
    )
    def comparison(self, request: Request, pk=None) -> Response:
        """
        GET /api/v1/predictions/{id}/comparison/
        Produce side-by-side comparison between this prediction and its prior baseline.
        """
        try:
            current_pred = self.get_queryset().select_related(
                "patient", "model_version", "clinical_record", "overridden_by", "explanation"
            ).get(id=pk)
        except Exception:
            return Response(
                {"success": False, "error": {"code": "prediction_not_found", "message": "Prediction not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        from services.prediction_comparison_service import (
            PredictionComparisonService,
            get_previous_patient_prediction,
        )

        previous_pred = get_previous_patient_prediction(
            patient_id=current_pred.patient_id,
            current_prediction_id=current_pred.id,
        )

        comparison_data = PredictionComparisonService.compare_patient_predictions(
            current_pred=current_pred,
            previous_pred=previous_pred,
        )

        has_comp = (not comparison_data.get("is_initial_prediction", False)) and (comparison_data.get("previous_prediction") is not None)
        return Response({
            "success": True,
            "has_comparison": has_comp,
            "data": comparison_data,
        }, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="feedback",
        permission_classes=[permissions.IsAuthenticated, HasPredictionAccess],
    )
    def feedback(self, request: Request, pk=None) -> Response:
        """
        GET  /api/v1/predictions/{id}/feedback/ -> List clinician feedback for this prediction.
        POST /api/v1/predictions/{id}/feedback/ -> Submit new feedback by authorized clinician.
        """
        try:
            prediction = self.get_queryset().select_related("patient").get(id=pk)
        except Exception:
            return Response(
                {"success": False, "error": {"code": "prediction_not_found", "message": "Prediction not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        from apps.predictions.models import PredictionFeedback
        from apps.predictions.serializers import PredictionFeedbackSerializer

        if request.method == "GET":
            feedbacks = PredictionFeedback.objects.filter(prediction=prediction).select_related("user").order_by("-created_at")
            serializer = PredictionFeedbackSerializer(feedbacks, many=True)
            return Response({"success": True, "count": len(serializer.data), "data": serializer.data}, status=status.HTTP_200_OK)

        # POST: Patients cannot submit clinical feedback; only clinicians, staff, and admins can
        if getattr(request.user, "is_patient", request.user.role == UserRole.PATIENT):
            return Response(
                {"success": False, "error": "Only authorized clinicians and staff can submit prediction feedback."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PredictionFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        feedback_obj = serializer.save(
            prediction=prediction,
            patient=prediction.patient,
            user=request.user,
            user_role=getattr(request.user, "role", "DOCTOR"),
        )

        # Audit feedback creation
        from apps.core.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.Action.CREATE,
            resource_type="PredictionFeedback",
            resource_id=str(feedback_obj.id),
            description=f"Clinician {request.user.email} submitted {feedback_obj.feedback_category} feedback for prediction {prediction.id}.",
            metadata={
                "prediction_id": str(prediction.id),
                "patient_id": str(prediction.patient_id),
                "category": feedback_obj.feedback_category,
            },
        )

        return Response({"success": True, "data": PredictionFeedbackSerializer(feedback_obj).data}, status=status.HTTP_201_CREATED)

