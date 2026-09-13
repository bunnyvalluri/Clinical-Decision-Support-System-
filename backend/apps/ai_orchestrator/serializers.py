"""
Serializers for Clinical AI Orchestration, Deterministic Rules,
Knowledge Retrieval, and Human-in-the-Loop Decisions.
"""
from rest_framework import serializers
from .models import AIInteraction, ClinicalRuleEvaluation, KnowledgeDocument, ModelDriftRecord


class OrchestratorEvaluationRequestSerializer(serializers.Serializer):
    patient_id = serializers.UUIDField(required=True)
    query = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    model_name = serializers.CharField(required=False, allow_blank=True, max_length=128)
    correlation_id = serializers.CharField(required=False, allow_blank=True, max_length=64)


class ClinicalRulesEvaluateSerializer(serializers.Serializer):
    respiratory_rate = serializers.FloatField(required=False, min_value=1, max_value=80)
    systolic_bp = serializers.FloatField(required=False, min_value=30, max_value=300)
    diastolic_bp = serializers.FloatField(required=False, min_value=20, max_value=200)
    heart_rate = serializers.IntegerField(required=False, min_value=20, max_value=300)
    temperature = serializers.FloatField(required=False, min_value=25.0, max_value=45.0)
    oxygen_saturation = serializers.FloatField(required=False, min_value=40.0, max_value=100.0)
    glucose = serializers.FloatField(required=False, min_value=10.0, max_value=1000.0)
    potassium = serializers.FloatField(required=False, min_value=1.0, max_value=12.0)
    creatinine = serializers.FloatField(required=False, min_value=0.1, max_value=30.0)
    lactic_acid = serializers.FloatField(required=False, min_value=0.1, max_value=30.0)
    altered_mental_status = serializers.BooleanField(required=False, default=False)
    glasgow_coma_scale = serializers.IntegerField(required=False, min_value=3, max_value=15)


class KnowledgeQuerySerializer(serializers.Serializer):
    query = serializers.CharField(required=True, min_length=2, max_length=500)
    clinical_context = serializers.DictField(required=False, default=dict)
    top_k = serializers.IntegerField(required=False, min_value=1, max_value=10, default=3)


class HumanReviewDecisionSerializer(serializers.Serializer):
    interaction_id = serializers.UUIDField(required=True)
    decision = serializers.ChoiceField(choices=AIInteraction.HumanDecision.choices, required=True)
    rationale = serializers.CharField(required=True, min_length=5, max_length=2000)


class AIInteractionSerializer(serializers.ModelSerializer):
    clinician_name = serializers.SerializerMethodField()

    class Meta:
        model = AIInteraction
        fields = [
            "id",
            "patient",
            "clinician",
            "clinician_name",
            "correlation_id",
            "operation_type",
            "input_query",
            "tools_invoked",
            "safety_status",
            "guardrail_flags",
            "requires_human_review",
            "human_decision",
            "human_rationale",
            "human_reviewed_at",
            "latency_ms",
            "created_at",
        ]
        read_only_fields = fields

    def get_clinician_name(self, obj) -> str:
        if obj.clinician:
            return f"{obj.clinician.first_name} {obj.clinician.last_name}".strip() or obj.clinician.username
        return "System"


class ModelDriftRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelDriftRecord
        fields = "__all__"
        read_only_fields = ["id", "evaluated_at"]
