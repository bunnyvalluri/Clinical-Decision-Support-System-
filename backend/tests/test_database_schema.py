import pytest
from datetime import date
from decimal import Decimal
from django.db import IntegrityError, transaction
from apps.accounts.models import User, Role, UserRole
from apps.patients.models import Patient, BloodGroup, Gender
from apps.clinical.models import ClinicalRecord, EncounterType
from apps.model_registry.models import ModelVersion, ModelStatus
from apps.predictions.models import Prediction, PredictionExplanation, RiskLevel
from apps.notifications.models import Notification, NotificationSeverity, NotificationChannel
from apps.reports.models import Report, ReportType, ReportFormat, ReportStatus


@pytest.mark.django_db
class TestDatabaseSchema:
    def test_create_roles_and_users(self):
        doctor_role, _ = Role.objects.get_or_create(
            name="DOCTOR",
            defaults={"description": "Licensed Clinician with full clinical privileges"}
        )
        user = User.objects.create_user(
            username="dr.watson@hospital.org",
            email="dr.watson@hospital.org",
            first_name="John",
            last_name="Watson",
            role=UserRole.DOCTOR,
            role_obj=doctor_role,
            password="SecurePassword123!"
        )
        assert user.id is not None
        assert user.role_obj.name == "DOCTOR"
        assert user.role == UserRole.DOCTOR
        assert user.is_doctor is True
        assert "dr.watson@hospital.org" in str(user)

    def test_patient_demographics_and_soft_delete(self):
        patient = Patient.objects.create(
            mrn="MRN-TEST-99881",
            first_name="Eleanor",
            last_name="Rigby",
            date_of_birth=date(1955, 6, 18),
            gender=Gender.FEMALE,
            blood_group=BloodGroup.O_POS,
            phone_number="+15551234567"
        )
        assert patient.id is not None
        assert patient.is_deleted is False
        assert patient.deleted_at is None

        # Test duplicate MRN unique constraint
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Patient.objects.create(
                    mrn="MRN-TEST-99881",
                    first_name="Duplicate",
                    last_name="Rigby",
                    date_of_birth=date(1960, 1, 1)
                )

        # Test soft delete via standard delete()
        patient.delete()
        assert patient.is_deleted is True
        assert patient.deleted_at is not None

        # Verify default active manager excludes soft-deleted records
        active_patients = Patient.objects.filter(mrn="MRN-TEST-99881")
        assert active_patients.count() == 0

        # Verify all_objects manager includes soft-deleted records
        all_patients = Patient.all_objects.filter(mrn="MRN-TEST-99881")
        assert all_patients.count() == 1

        # Test restore
        patient.restore()
        assert patient.is_deleted is False
        assert patient.deleted_at is None
        assert Patient.objects.filter(mrn="MRN-TEST-99881").count() == 1

    def test_clinical_record_constraints(self):
        patient = Patient.objects.create(
            mrn="MRN-CLIN-001",
            first_name="Arthur",
            last_name="Dent",
            date_of_birth=date(1982, 3, 11)
        )

        record = ClinicalRecord.objects.create(
            patient=patient,
            encounter_type=EncounterType.OUTPATIENT,
            systolic_bp=120,
            diastolic_bp=80,
            heart_rate=72,
            respiratory_rate=16,
            body_temperature=Decimal("37.0"),
            oxygen_saturation=Decimal("98.5"),
            glucose_level=Decimal("95.0"),
            bmi=Decimal("23.4")
        )
        assert record.id is not None
        assert record.patient == patient

        # Test physiological check constraints: negative heart rate
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                ClinicalRecord.objects.create(
                    patient=patient,
                    systolic_bp=120,
                    diastolic_bp=80,
                    heart_rate=-5
                )

        # Test oxygen saturation > 100% check constraint
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                ClinicalRecord.objects.create(
                    patient=patient,
                    oxygen_saturation=Decimal("105.0")
                )

    def test_model_version_and_uniqueness(self):
        mv1 = ModelVersion.objects.create(
            model_name="cardiac_risk_xgb",
            version="v1.0.0",
            algorithm="XGBoost",
            status=ModelStatus.ACTIVE,
            artifact_location="s3://models/cardiac_risk_xgb_v1.0.0.joblib",
            metrics={"accuracy": 0.89, "auc_roc": 0.94, "f1": 0.88},
            training_dataset_info={"samples": 50000, "train_split": 0.8}
        )
        assert mv1.id is not None

        # Test unique constraint on (model_name, version)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                ModelVersion.objects.create(
                    model_name="cardiac_risk_xgb",
                    version="v1.0.0",
                    algorithm="XGBoost",
                    artifact_location="s3://models/dup.joblib"
                )

    def test_prediction_and_explanation_relationships(self):
        patient = Patient.objects.create(
            mrn="MRN-PRED-001",
            first_name="Clara",
            last_name="Oswald",
            date_of_birth=date(1986, 11, 23)
        )
        mv = ModelVersion.objects.create(
            model_name="cardiac_risk_xgb",
            version="v1.1.0",
            algorithm="XGBoost",
            artifact_location="s3://models/cardiac_risk_xgb_v1.1.0.joblib"
        )
        clin_rec = ClinicalRecord.objects.create(
            patient=patient,
            systolic_bp=145,
            diastolic_bp=95,
            heart_rate=88,
            oxygen_saturation=Decimal("96.0")
        )

        prediction = Prediction.objects.create(
            patient=patient,
            clinical_record=clin_rec,
            model_version=mv,
            model_name=mv.model_name,
            model_version_str=mv.version,
            prediction_result=RiskLevel.HIGH,
            probability=Decimal("0.8420"),
            confidence_score=Decimal("0.9100"),
            inference_latency_ms=14.2,
            features_snapshot={
                "systolic_bp": 145,
                "diastolic_bp": 95,
                "heart_rate": 88,
                "age": 39
            }
        )
        assert prediction.id is not None
        assert prediction.patient == patient
        assert prediction.prediction_result == RiskLevel.HIGH

        # Test invalid probability check constraint (> 1.0)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Prediction.objects.create(
                    patient=patient,
                    prediction_result=RiskLevel.LOW,
                    probability=Decimal("1.5000")
                )

        # Test 1-to-1 PredictionExplanation
        explanation = PredictionExplanation.objects.create(
            prediction=prediction,
            method="TreeSHAP",
            feature_importances={
                "systolic_bp": 0.42,
                "diastolic_bp": 0.28,
                "heart_rate": 0.15
            },
            top_risk_factors=[
                "Elevated systolic blood pressure (145 mmHg)",
                "Elevated diastolic pressure (95 mmHg)"
            ],
            baseline_value=0.12
        )
        assert explanation.prediction == prediction
        assert prediction.explanation == explanation

    def test_notification_and_report_creation(self):
        doctor_role, _ = Role.objects.get_or_create(
            name="DOCTOR_SPEC",
            defaults={"description": "Specialist"}
        )
        doctor = User.objects.create_user(
            username="dr.martha@hospital.org",
            email="dr.martha@hospital.org",
            first_name="Martha",
            last_name="Jones",
            role=UserRole.DOCTOR,
            role_obj=doctor_role,
            password="SecurePassword123!"
        )
        patient = Patient.objects.create(
            mrn="MRN-NOTIF-001",
            first_name="Rory",
            last_name="Williams",
            date_of_birth=date(1989, 5, 2)
        )
        mv = ModelVersion.objects.create(
            model_name="sepsis_early_warning",
            version="v2.0.0",
            algorithm="RandomForestClassifier",
            artifact_location="s3://models/sepsis_v2.0.0.joblib"
        )
        pred = Prediction.objects.create(
            patient=patient,
            model_version=mv,
            model_name="sepsis_early_warning",
            model_version_str="v2.0.0",
            prediction_result=RiskLevel.CRITICAL,
            probability=Decimal("0.9650"),
            inference_latency_ms=15.0,
            features_snapshot={"temp": 39.5, "hr": 125}
        )

        # Notification
        notification = Notification.objects.create(
            recipient=doctor,
            patient=patient,
            prediction=pred,
            severity=NotificationSeverity.CRITICAL,
            channel=NotificationChannel.IN_APP,
            title="CRITICAL Risk Alert: Sepsis Warning",
            message="Patient Rory Williams has triggered a critical risk threshold (probability 96.5%)."
        )
        assert notification.id is not None
        assert notification.is_read is False

        # Report
        report = Report.objects.create(
            patient=patient,
            prediction=pred,
            generated_by=doctor,
            report_type=ReportType.RISK_ASSESSMENT,
            format=ReportFormat.PDF,
            status=ReportStatus.COMPLETED,
            file_path="reports/2026/09/MRN-NOTIF-001_sepsis_summary.pdf"
        )
        assert report.id is not None
        assert report.status == ReportStatus.COMPLETED
