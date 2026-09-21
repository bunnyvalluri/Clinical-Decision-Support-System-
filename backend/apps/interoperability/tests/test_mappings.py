"""
Unit Tests for FHIR R4 Mappers.
"""
from datetime import date
from django.test import TestCase

from apps.accounts.models import User, UserRole
from apps.clinical.models import ClinicalRecord, ClinicalTask, EncounterType, TaskPriority, TaskType
from apps.interoperability.mappings import (
    DiagnosticReportFHIRMapper,
    EncounterFHIRMapper,
    ObservationFHIRMapper,
    PatientFHIRMapper,
    PractitionerFHIRMapper,
    RiskAssessmentFHIRMapper,
    ServiceRequestFHIRMapper,
)
from apps.model_registry.models import ModelStatus, ModelVersion
from apps.patients.models import Gender, Patient
from apps.predictions.models import Prediction, RiskLevel
from apps.reports.models import Report, ReportType


class TestFHIRMappers(TestCase):
    """Tests for bi-directional FHIR R4 translations."""

    def setUp(self):
        self.patient = Patient.objects.create(
            mrn="MRN-TEST-1001",
            first_name="Marcus",
            last_name="Vance",
            gender=Gender.MALE,
            date_of_birth=date(1978, 5, 20),
            phone_number="+1-555-0144",
            email="marcus.vance@example.com",
            address="100 Hospital Way, Medical City",
            emergency_contact_name="Elena Vance",
            emergency_contact_phone="+1-555-0145",
            emergency_contact_relation="Spouse",
        )

        self.doctor = User.objects.create_user(
            username="dr_house",
            email="house@healthnova.ai",
            first_name="Gregory",
            last_name="House",
            role=UserRole.DOCTOR,
        )

        self.clinical_record = ClinicalRecord.objects.create(
            patient=self.patient,
            recorded_by=self.doctor,
            encounter_type=EncounterType.INPATIENT,
            systolic_bp=135,
            diastolic_bp=85,
            heart_rate=88,
            respiratory_rate=18,
            body_temperature=37.2,
            oxygen_saturation=96.5,
            glucose_level=110.0,
            symptoms="Mild dyspnea on exertion",
        )

        self.model_version = ModelVersion.objects.create(
            model_name="MortalityRiskClassifier",
            version="1.4.0",
            algorithm="GradientBoostingClassifier",
            status=ModelStatus.PRODUCTION,
            artifact_location="models/mortality_v140.pkl",
            training_dataset_identifier="mimic_iv_extract_v1",
            feature_schema_version="1.0.0",
            preprocessing_version="1.0.0",
        )

        self.prediction = Prediction.objects.create(
            patient=self.patient,
            clinical_record=self.clinical_record,
            model_version=self.model_version,
            model_name="MortalityRiskClassifier",
            model_version_str="1.4.0",
            prediction_result=RiskLevel.HIGH,
            probability=0.7850,
            confidence_score=0.8800,
            inference_latency_ms=14.2,
            features_snapshot={"age": 48, "systolic_bp": 135, "heart_rate": 88},
        )

    def test_patient_to_fhir_and_back(self):
        # 1. Outbound
        fhir_patient = PatientFHIRMapper.to_fhir(self.patient)
        self.assertEqual(fhir_patient["resourceType"], "Patient")
        self.assertEqual(fhir_patient["gender"], "male")
        self.assertEqual(fhir_patient["birthDate"], "1978-05-20")
        self.assertEqual(fhir_patient["name"][0]["family"], "Vance")
        self.assertEqual(fhir_patient["name"][0]["given"], ["Marcus"])

        # 2. Inbound
        parsed = PatientFHIRMapper.to_internal(fhir_patient)
        self.assertEqual(parsed["mrn"], "MRN-TEST-1001")
        self.assertEqual(parsed["first_name"], "Marcus")
        self.assertEqual(parsed["last_name"], "Vance")
        self.assertEqual(parsed["gender"], Gender.MALE)
        self.assertEqual(parsed["date_of_birth"], date(1978, 5, 20))
        self.assertEqual(parsed["phone_number"], "+1-555-0144")

    def test_observation_to_fhir_and_back(self):
        observations = ObservationFHIRMapper.to_fhir(self.clinical_record)
        self.assertTrue(len(observations) > 0)

        # Check BP compound panel
        bp_obs = next((o for o in observations if o["id"].startswith("bp-")), None)
        self.assertIsNotNone(bp_obs)
        self.assertEqual(bp_obs["code"]["coding"][0]["code"], "85354-9")
        self.assertEqual(len(bp_obs["component"]), 2)

        # Parse BP observation back to internal
        parsed_bp = ObservationFHIRMapper.to_internal(bp_obs)
        self.assertEqual(parsed_bp.get("systolic_bp"), 135.0)
        self.assertEqual(parsed_bp.get("diastolic_bp"), 85.0)

        # Check Heart Rate observation
        hr_obs = next((o for o in observations if o["id"].startswith("heart_rate-")), None)
        self.assertIsNotNone(hr_obs)
        self.assertEqual(hr_obs["code"]["coding"][0]["code"], "8867-4")
        self.assertEqual(hr_obs["valueQuantity"]["value"], 88.0)

        parsed_hr = ObservationFHIRMapper.to_internal(hr_obs)
        self.assertEqual(parsed_hr.get("heart_rate"), 88.0)

    def test_encounter_to_fhir_and_back(self):
        fhir_enc = EncounterFHIRMapper.to_fhir(self.clinical_record)
        self.assertEqual(fhir_enc["resourceType"], "Encounter")
        self.assertEqual(fhir_enc["class"]["code"], "IMP")
        self.assertEqual(fhir_enc["subject"]["reference"], f"Patient/{self.patient.id}")

        parsed_enc = EncounterFHIRMapper.to_internal(fhir_enc)
        self.assertEqual(parsed_enc["encounter_type"], EncounterType.INPATIENT)
        self.assertEqual(parsed_enc["symptoms"], "Mild dyspnea on exertion")

    def test_practitioner_to_fhir_and_back(self):
        fhir_prac = PractitionerFHIRMapper.to_fhir(self.doctor)
        self.assertEqual(fhir_prac["resourceType"], "Practitioner")
        self.assertEqual(fhir_prac["name"][0]["family"], "House")
        self.assertEqual(fhir_prac["telecom"][0]["value"], "house@healthnova.ai")

        parsed_prac = PractitionerFHIRMapper.to_internal(fhir_prac)
        self.assertEqual(parsed_prac["last_name"], "House")
        self.assertEqual(parsed_prac["email"], "house@healthnova.ai")

    def test_risk_assessment_to_fhir_and_back(self):
        fhir_ra = RiskAssessmentFHIRMapper.to_fhir(self.prediction)
        self.assertEqual(fhir_ra["resourceType"], "RiskAssessment")
        self.assertEqual(fhir_ra["subject"]["reference"], f"Patient/{self.patient.id}")
        self.assertEqual(fhir_ra["prediction"][0]["outcome"]["coding"][0]["code"], "HIGH")
        self.assertEqual(fhir_ra["prediction"][0]["probabilityDecimal"], 0.785)

        parsed_ra = RiskAssessmentFHIRMapper.to_internal(fhir_ra)
        self.assertEqual(parsed_ra["prediction_result"], "HIGH")
        self.assertEqual(parsed_ra["probability"], 0.785)

    def test_service_request_to_fhir_and_back(self):
        task = ClinicalTask.objects.create(
            patient=self.patient,
            title="Stat Troponin Draw",
            task_type=TaskType.LAB_DRAW,
            priority=TaskPriority.STAT,
        )
        fhir_sr = ServiceRequestFHIRMapper.to_fhir(task)
        self.assertEqual(fhir_sr["resourceType"], "ServiceRequest")
        self.assertEqual(fhir_sr["priority"], "stat")

        parsed_sr = ServiceRequestFHIRMapper.to_internal(fhir_sr)
        self.assertEqual(parsed_sr["priority"], TaskPriority.STAT)
        self.assertEqual(parsed_sr["title"], "Stat Troponin Draw")
