"""
API views for Clinical Whiteboards.
Integrates object-level RBAC, version control, AI diagram generation, and audit logging.
"""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.models import User, UserRole
from apps.patients.models import Patient
from apps.whiteboards.models import (
    ClinicalWhiteboard,
    WhiteboardDocument,
    WhiteboardShare,
    WhiteboardComment,
    WhiteboardAuditEvent,
    WhiteboardStatus,
    WhiteboardType,
    DataClassification,
)
from apps.whiteboards.permissions import CanAccessWhiteboard, CanReviewWhiteboard, CanRestoreWhiteboard
from apps.whiteboards.serializers import (
    ClinicalWhiteboardListSerializer,
    ClinicalWhiteboardDetailSerializer,
    WhiteboardCreateSerializer,
    WhiteboardDocumentSerializer,
    WhiteboardSaveDocumentSerializer,
    WhiteboardRestoreSerializer,
    WhiteboardReviewSerializer,
    WhiteboardShareCreateSerializer,
    WhiteboardShareSerializer,
    WhiteboardCommentSerializer,
    WhiteboardAIGenerateSerializer,
)
from apps.whiteboards.services.whiteboard_service import WhiteboardService
from apps.whiteboards.services.persistence_service import WhiteboardPersistenceService
from apps.whiteboards.services.ai_service import WhiteboardAIService
from apps.whiteboards.services.export_service import WhiteboardExportService


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class ClinicalWhiteboardViewSet(viewsets.ModelViewSet):
    """
    Primary API ViewSet for Clinical Whiteboards.
    Enforces role scoping, audit trails, and clinical governance.
    """
    queryset = ClinicalWhiteboard.objects.all()
    permission_classes = [permissions.IsAuthenticated, CanAccessWhiteboard]

    def get_serializer_class(self):
        if self.action == "list":
            return ClinicalWhiteboardListSerializer
        elif self.action in ["retrieve", "update", "partial_update"]:
            return ClinicalWhiteboardDetailSerializer
        return ClinicalWhiteboardDetailSerializer

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", "")
        qs = ClinicalWhiteboard.objects.exclude(status=WhiteboardStatus.PURGED)

        # Role-based query filtering
        if role == UserRole.PATIENT:
            patient = getattr(user, "patient_profile", None)
            if not patient:
                return qs.none()
            return qs.filter(
                patient=patient,
                type__in=[WhiteboardType.CARE_PLAN, WhiteboardType.PATIENT_JOURNEY],
                status=WhiteboardStatus.APPROVED,
            )

        if role in [UserRole.IT_ADMIN, UserRole.ADMIN]:
            # Admins view non-PHI boards or architecture/incident response boards
            qs = qs.exclude(classification=DataClassification.PHI)

        # Informaticist scoping
        if role == UserRole.MEDICAL_INFORMATICIST:
            # Informaticists focus on ML, AI, Architecture, Decision Trees, and Data Lineage
            pass

        # Filter params
        board_type = self.request.query_params.get("type")
        if board_type:
            qs = qs.filter(type=board_type)

        classification = self.request.query_params.get("classification")
        if classification:
            qs = qs.filter(classification=classification)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        patient_id = self.request.query_params.get("patient_id")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(title__icontains=search)

        return qs

    def create(self, request, *args, **kwargs):
        serializer = WhiteboardCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        patient = None
        patient_id = data.get("patient_id")
        if patient_id:
            patient = get_object_or_404(Patient, id=patient_id)

        whiteboard = WhiteboardService.create_whiteboard(
            title=data["title"],
            owner=request.user,
            whiteboard_type=data.get("type", WhiteboardType.GENERAL),
            classification=data.get("classification", DataClassification.INTERNAL),
            description=data.get("description", ""),
            patient=patient,
            tags=data.get("tags", []),
            metadata=data.get("metadata", {}),
            initial_elements=data.get("initial_elements", []),
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        detail_serializer = ClinicalWhiteboardDetailSerializer(whiteboard)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Audit VIEW event
        WhiteboardAuditEvent.objects.create(
            whiteboard=instance,
            user=request.user,
            user_role=getattr(request.user, "role", ""),
            action="VIEW",
            version_number=instance.current_version,
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "put"])
    def document(self, request, pk=None):
        whiteboard = self.get_object()

        if request.method == "GET":
            doc = whiteboard.documents.order_by("-version_number").first()
            if not doc:
                return Response({"detail": "No document found."}, status=status.HTTP_404_NOT_FOUND)
            serializer = WhiteboardDocumentSerializer(doc)
            return Response(serializer.data)

        elif request.method == "PUT":
            serializer = WhiteboardSaveDocumentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            doc = WhiteboardPersistenceService.save_document(
                whiteboard=whiteboard,
                elements=data["elements"],
                app_state=data.get("appState", {}),
                files=data.get("files", {}),
                user=request.user,
                is_checkpoint=data.get("is_checkpoint", False),
                checkpoint_summary=data.get("checkpoint_summary", ""),
                ip_address=get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )

            # Optional thumbnail update if provided
            thumbnail = request.data.get("thumbnail_data")
            if thumbnail:
                whiteboard.thumbnail_data = thumbnail
                whiteboard.save(update_fields=["thumbnail_data"])

            return Response({
                "saved": True,
                "version_number": doc.version_number,
                "content_hash": doc.content_hash,
                "is_checkpoint": doc.is_checkpoint,
                "updated_at": whiteboard.updated_at.isoformat(),
            })

    @action(detail=True, methods=["get"])
    def versions(self, request, pk=None):
        whiteboard = self.get_object()
        docs = whiteboard.documents.order_by("-version_number")
        serializer = WhiteboardDocumentSerializer(docs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, CanRestoreWhiteboard])
    def restore(self, request, pk=None):
        whiteboard = self.get_object()
        serializer = WhiteboardRestoreSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_doc = WhiteboardPersistenceService.restore_version(
            whiteboard=whiteboard,
            target_version_number=serializer.validated_data["target_version"],
            user=request.user,
            reason=serializer.validated_data.get("reason", ""),
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response({
            "restored": True,
            "current_version": whiteboard.current_version,
            "document": WhiteboardDocumentSerializer(new_doc).data,
        })

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, CanReviewWhiteboard])
    def review(self, request, pk=None):
        whiteboard = self.get_object()
        serializer = WhiteboardReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        wb = WhiteboardService.perform_clinical_review(
            whiteboard=whiteboard,
            action=serializer.validated_data["action"],
            reviewer=request.user,
            notes=serializer.validated_data.get("notes", ""),
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response(ClinicalWhiteboardDetailSerializer(wb).data)

    @action(detail=True, methods=["post"])
    def ai_generate(self, request, pk=None):
        whiteboard = self.get_object()
        serializer = WhiteboardAIGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = WhiteboardAIService.generate_diagram(
            whiteboard=whiteboard,
            prompt=serializer.validated_data["prompt"],
            user=request.user,
            category=serializer.validated_data.get("category", "GENERAL"),
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response(result)

    @action(detail=True, methods=["get", "post"])
    def shares(self, request, pk=None):
        whiteboard = self.get_object()

        if request.method == "GET":
            shares = whiteboard.shares.filter(is_revoked=False)
            return Response(WhiteboardShareSerializer(shares, many=True).data)

        elif request.method == "POST":
            serializer = WhiteboardShareCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            target_user = None
            if data.get("target_user_id"):
                target_user = get_object_or_404(User, id=data["target_user_id"])

            share = WhiteboardService.create_share(
                whiteboard=whiteboard,
                user=request.user,
                target_role=data.get("target_role", ""),
                target_user=target_user,
                allow_edit=data.get("allow_edit", False),
                expires_in_hours=data.get("expires_in_hours", 48),
                ip_address=get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )

            return Response(WhiteboardShareSerializer(share).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="revoke-share")
    def revoke_share(self, request, pk=None):
        whiteboard = self.get_object()
        share_id = request.data.get("share_id")
        share = get_object_or_404(WhiteboardShare, id=share_id, whiteboard=whiteboard)

        WhiteboardService.revoke_share(
            share=share,
            user=request.user,
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response({"revoked": True})

    @action(detail=True, methods=["get", "post"])
    def comments(self, request, pk=None):
        whiteboard = self.get_object()

        if request.method == "GET":
            comments = whiteboard.comments.all()
            return Response(WhiteboardCommentSerializer(comments, many=True).data)

        elif request.method == "POST":
            text = request.data.get("text", "").strip()
            if not text:
                raise ValidationError("Comment text cannot be empty.")

            comment = WhiteboardComment.objects.create(
                whiteboard=whiteboard,
                element_id=request.data.get("element_id", ""),
                author=request.user,
                text=text,
            )
            return Response(WhiteboardCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="export-audit")
    def export_audit(self, request, pk=None):
        whiteboard = self.get_object()
        fmt = request.data.get("format", "JSON")
        WhiteboardExportService.audit_export(
            whiteboard=whiteboard,
            format_type=fmt,
            user=request.user,
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        return Response({"audited": True, "format": fmt})
