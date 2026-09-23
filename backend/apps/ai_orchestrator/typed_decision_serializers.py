"""
DRF Serializers for Typed Decisions & Laya-MLX Management.
"""
from rest_framework import serializers
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
 )


class TypedDecisionProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypedDecisionProvider
        fields = "__all__"


class TypedDecisionModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypedDecisionModel
        fields = "__all__"


class TypedDecisionSchemaSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = TypedDecisionSchema
        fields = "__all__"


class TypedDecisionResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypedDecisionResult
        fields = "__all__"


class TypedDecisionRequestSerializer(serializers.ModelSerializer):
    result = TypedDecisionResultSerializer(read_only=True)
    schema_name = serializers.ReadOnlyField(source="schema.name")

    class Meta:
        model = TypedDecisionRequest
        fields = "__all__"


class TypedDecisionEvaluationSerializer(serializers.ModelSerializer):
    schema_name = serializers.ReadOnlyField(source="schema.name")
    model_name = serializers.ReadOnlyField(source="model.model_identifier")

    class Meta:
        model = TypedDecisionEvaluation
        fields = "__all__"


class TypedDecisionInferenceInputSerializer(serializers.Serializer):
    schema_name = serializers.CharField(max_length=128, required=True)
    schema_version = serializers.CharField(max_length=32, default="1.0.0")
    case_context = serializers.CharField(required=True)
    custom_options = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )
    correlation_id = serializers.CharField(max_length=64, required=False, default="")


class SchemaRobustnessTestSerializer(serializers.Serializer):
    schema_id = serializers.UUIDField(required=True)
    sample_context = serializers.CharField(required=False, default="Patient presenting with stable vitals for triage routing.")


class TypedDecisionKillSwitchSerializer(serializers.Serializer):
    enabled = serializers.BooleanField(required=True)
    reason = serializers.CharField(max_length=255, required=False, default="")
