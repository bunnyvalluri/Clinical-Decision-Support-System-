"""
Serializers for Clinical Whiteboards, versioned documents, shares, and audit records.
"""
from rest_framework import serializers
from apps.accounts.models import User
from apps.patients.models import Patient
from apps.whiteboards.models import (
    ClinicalWhiteboard,
    WhiteboardDocument,
    WhiteboardShare,
    WhiteboardComment,
    WhiteboardAuditEvent,
    WhiteboardType,
    DataClassification,
    WhiteboardStatus,
)


class UserSummarySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "name"]

    def get_name(self, obj):
        full = obj.get_full_name()
        return full if full.strip() else obj.username


class WhiteboardDocumentSerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = WhiteboardDocument
        fields = [
            "id",
            "version_number",
            "elements",
            "app_state",
            "files",
            "content_hash",
            "size_bytes",
            "schema_version",
            "is_checkpoint",
            "checkpoint_summary",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "version_number", "content_hash", "size_bytes", "created_by", "created_at"]


class ClinicalWhiteboardListSerializer(serializers.ModelSerializer):
    owner = UserSummarySerializer(read_only=True)
    created_by = UserSummarySerializer(read_only=True)
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)

    class Meta:
        model = ClinicalWhiteboard
        fields = [
            "id",
            "title",
            "description",
            "type",
            "classification",
            "status",
            "current_version",
            "is_locked",
            "owner",
            "created_by",
            "patient",
            "patient_mrn",
            "tags",
            "thumbnail_data",
            "created_at",
            "updated_at",
        ]


class ClinicalWhiteboardDetailSerializer(serializers.ModelSerializer):
    owner = UserSummarySerializer(read_only=True)
    created_by = UserSummarySerializer(read_only=True)
    updated_by = UserSummarySerializer(read_only=True)
    locked_by = UserSummarySerializer(read_only=True)
    clinical_reviewer = UserSummarySerializer(read_only=True)
    current_document = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    patient_mrn = serializers.CharField(source="patient.mrn", read_only=True)

    class Meta:
        model = ClinicalWhiteboard
        fields = [
            "id",
            "title",
            "description",
            "type",
            "classification",
            "status",
            "current_version",
            "is_locked",
            "locked_by",
            "locked_at",
            "clinical_reviewer",
            "reviewed_at",
            "review_notes",
            "owner",
            "created_by",
            "updated_by",
            "patient",
            "patient_name",
            "patient_mrn",
            "tags",
            "metadata",
            "thumbnail_data",
            "created_at",
            "updated_at",
            "current_document",
        ]

    def get_current_document(self, obj):
        doc = obj.documents.order_by("-version_number").first()
        if doc:
            return WhiteboardDocumentSerializer(doc).data
        return None

    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name}"
        return None


class WhiteboardCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    type = serializers.ChoiceField(choices=WhiteboardType.choices, default=WhiteboardType.GENERAL)
    classification = serializers.ChoiceField(choices=DataClassification.choices, default=DataClassification.INTERNAL)
    patient_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    metadata = serializers.DictField(required=False, default=dict)
    initial_elements = serializers.ListField(required=False, default=list)


class WhiteboardSaveDocumentSerializer(serializers.Serializer):
    elements = serializers.ListField(child=serializers.DictField())
    appState = serializers.DictField(required=False, default=dict)
    files = serializers.DictField(required=False, default=dict)
    is_checkpoint = serializers.BooleanField(required=False, default=False)
    checkpoint_summary = serializers.CharField(required=False, allow_blank=True, default="")


class WhiteboardRestoreSerializer(serializers.Serializer):
    target_version = serializers.IntegerField(min_value=1)
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class WhiteboardReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["SUBMIT", "APPROVE", "REQUEST_CHANGES", "ARCHIVE"])
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class WhiteboardShareCreateSerializer(serializers.Serializer):
    target_role = serializers.CharField(required=False, allow_blank=True, default="")
    target_user_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    allow_edit = serializers.BooleanField(required=False, default=False)
    expires_in_hours = serializers.IntegerField(required=False, default=48, min_value=1)


class WhiteboardShareSerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(read_only=True)
    target_user = UserSummarySerializer(read_only=True)
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = WhiteboardShare
        fields = [
            "id",
            "share_token",
            "target_role",
            "target_user",
            "allow_edit",
            "created_by",
            "created_at",
            "expires_at",
            "is_revoked",
            "revoked_at",
            "is_valid",
        ]


class WhiteboardCommentSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)

    class Meta:
        model = WhiteboardComment
        fields = [
            "id",
            "whiteboard",
            "element_id",
            "author",
            "text",
            "is_resolved",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "whiteboard", "author", "created_at", "updated_at"]


class WhiteboardAIGenerateSerializer(serializers.Serializer):
    prompt = serializers.CharField(min_length=5, max_length=1000)
    category = serializers.ChoiceField(
        choices=["SEPSIS", "CARDIAC", "TRIAGE", "GENERAL"],
        default="GENERAL",
    )
