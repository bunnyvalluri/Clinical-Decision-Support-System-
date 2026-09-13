from rest_framework import serializers
from apps.patients.models import Patient
from apps.clinical.models import ClinicalRecord
from apps.predictions.models import Prediction
from .models import (
    UserRiskAssessment,
    UserVitalRecord,
    Appointment,
    Conversation,
    Message,
    ConsentRecord,
    UserTask,
)


class UserRiskAssessmentSerializer(serializers.ModelSerializer):
    prediction_result = serializers.CharField(source="prediction.prediction_result", read_only=True)
    probability = serializers.FloatField(source="prediction.probability", read_only=True)

    class Meta:
        model = UserRiskAssessment
        fields = [
            "id",
            "patient",
            "symptoms",
            "chest_pain_type",
            "resting_bp",
            "cholesterol",
            "fasting_blood_sugar",
            "resting_ecg",
            "max_heart_rate",
            "exercise_angina",
            "st_depression",
            "status",
            "prediction",
            "prediction_result",
            "probability",
            "patient_notes",
            "created_at",
            "completed_at",
        ]
        read_only_fields = ["id", "patient", "status", "prediction", "created_at", "completed_at"]


class UserVitalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserVitalRecord
        fields = [
            "id",
            "patient",
            "systolic_bp",
            "diastolic_bp",
            "heart_rate",
            "spo2",
            "blood_glucose",
            "weight_kg",
            "temperature_c",
            "source",
            "notes",
            "recorded_at",
            "created_at",
        ]
        read_only_fields = ["id", "patient", "created_at"]


class AppointmentSerializer(serializers.ModelSerializer):
    clinician_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",
            "clinician",
            "clinician_name",
            "department",
            "scheduled_time",
            "duration_minutes",
            "status",
            "location_or_link",
            "reason_for_visit",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "patient", "created_at"]

    def get_clinician_name(self, obj):
        if obj.clinician:
            return obj.clinician.get_full_name() or obj.clinician.username
        return "Attending Specialist"


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    is_from_patient = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_name",
            "content",
            "read_by_patient",
            "read_by_clinician",
            "is_from_patient",
            "created_at",
        ]
        read_only_fields = ["id", "sender", "created_at"]

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username

    def get_is_from_patient(self, obj):
        return obj.sender.role == "PATIENT" if hasattr(obj.sender, "role") else False


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    clinician_name = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "patient",
            "assigned_clinician",
            "clinician_name",
            "subject",
            "status",
            "last_message_at",
            "created_at",
            "messages",
            "unread_count",
        ]
        read_only_fields = ["id", "patient", "created_at", "last_message_at"]

    def get_clinician_name(self, obj):
        if obj.assigned_clinician:
            return obj.assigned_clinician.get_full_name() or obj.assigned_clinician.username
        return "Clinical Care Team"

    def get_unread_count(self, obj):
        return obj.messages.filter(read_by_patient=False).exclude(sender__role="PATIENT").count()


class ConsentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsentRecord
        fields = [
            "id",
            "patient",
            "consent_type",
            "is_granted",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "patient", "created_at"]


class UserTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserTask
        fields = [
            "id",
            "patient",
            "title",
            "description",
            "task_type",
            "due_date",
            "status",
            "completed_at",
            "created_at",
        ]
        read_only_fields = ["id", "patient", "created_at"]


class PatientProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "mrn",
            "first_name",
            "last_name",
            "full_name",
            "date_of_birth",
            "age",
            "gender",
            "blood_group",
            "phone_number",
            "email",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relation",
        ]
        read_only_fields = ["id", "mrn", "date_of_birth", "gender", "blood_group"]


class PatientMedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalRecord
        fields = [
            "id",
            "encounter_type",
            "recorded_at",
            "systolic_bp",
            "diastolic_bp",
            "heart_rate",
            "respiratory_rate",
            "oxygen_saturation",
            "temperature_celsius",
            "blood_glucose_mg_dl",
            "clinical_notes",
        ]
        read_only_fields = fields


class PatientPredictionSerializer(serializers.ModelSerializer):
    explanation = serializers.SerializerMethodField()
    disclaimer = serializers.SerializerMethodField()

    class Meta:
        model = Prediction
        fields = [
            "id",
            "model_name",
            "model_version_str",
            "prediction_result",
            "probability",
            "confidence_interval",
            "created_at",
            "explanation",
            "disclaimer",
        ]
        read_only_fields = fields

    def get_explanation(self, obj):
        prob = float(obj.probability)
        if prob > 0.7:
            return "Based on your clinical markers and vital measurements, our machine learning model estimates an elevated risk of cardiovascular events. Please consult your physician for personalized medical evaluation."
        elif prob > 0.3:
            return "Your current measurements suggest moderate risk factors. Consistent lifestyle choices, physical activity, and continued monitoring are recommended."
        return "Your clinical parameters indicate a low estimated cardiovascular risk. Continue maintaining healthy habits and scheduled follow-ups."

    def get_disclaimer(self, obj):
        return "Notice: This prediction is a model-generated estimate intended for clinical decision support. It is not an autonomous diagnosis. Please discuss these results with your healthcare professional."
