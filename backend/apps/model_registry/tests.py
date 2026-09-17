"""
Tests for Model Registry, MLOps Services, and Lifecycle State Machine — BPY-CSE-2666.
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.model_registry.models import (
    ModelApproval,
    ModelDeployment,
    ModelStatus,
    ModelVersion,
)
from ml.mlops.security import ModelArtifactSecurity, ModelSecurityError
from ml.training.trainers import AdaBoostTrainer, RandomForestTrainer, SVMTrainer

User = get_user_model()


class ModelRegistryLifecycleTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.informaticist = User.objects.create_user(
            username="informaticist1",
            email="informaticist@hospital.org",
            password="SecurePassword123!",
            role="INFORMATICIST",
        )
        self.client.force_authenticate(user=self.informaticist)

        self.model = ModelVersion.objects.create(
            model_name="random_forest_risk_model",
            algorithm="RandomForestClassifier",
            version="1.0.0",
            status=ModelStatus.DRAFT,
            artifact_location="ml/artifacts/rf_model.joblib",
            checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            accuracy=0.985,
            precision=0.982,
            recall=1.000,
            f1_score=0.991,
            roc_auc=0.998,
        )

    def test_lifecycle_approval(self):
        """Clinician approval gate promotes model to APPROVED."""
        url = f"/api/v1/models/versions/{self.model.id}/approve/"
        response = self.client.post(url, {"clinical_rationale": "Validated on Cleveland cohort"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.model.refresh_from_db()
        self.assertEqual(self.model.status, ModelStatus.APPROVED)
        self.assertTrue(ModelApproval.objects.filter(model_version=self.model).exists())

    def test_production_deployment_requires_approval(self):
        """Unapproved model cannot be deployed to PRODUCTION directly."""
        url = f"/api/v1/models/versions/{self.model.id}/deploy/"
        response = self.client.post(url, {"stage": "PRODUCTION", "traffic_percentage": 100}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approved_model_can_deploy_to_production(self):
        """Approved model can be promoted to PRODUCTION."""
        self.model.status = ModelStatus.APPROVED
        self.model.save()

        url = f"/api/v1/models/versions/{self.model.id}/deploy/"
        response = self.client.post(url, {"stage": "PRODUCTION", "traffic_percentage": 100}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.model.refresh_from_db()
        self.assertEqual(self.model.status, ModelStatus.PRODUCTION)
        self.assertTrue(self.model.is_active)
        self.assertTrue(ModelDeployment.objects.filter(model_version=self.model, stage="PRODUCTION").exists())

    def test_model_comparison_endpoint(self):
        """Compare endpoint returns structured comparison data."""
        url = "/api/v1/models/versions/compare/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("success"))
        self.assertGreaterEqual(len(response.data.get("data", [])), 1)

    def test_security_audit_endpoint(self):
        """Security audit endpoint returns artifact verification status."""
        url = "/api/v1/models/versions/security-audit/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("success"))
        record = response.data["data"][0]
        self.assertEqual(record["security_status"], "VERIFIED")


class OOPTrainersTestCase(TestCase):
    def test_trainer_instantiation(self):
        """Verify trainers instantiate with correct base estimators."""
        rf = RandomForestTrainer(version="2.0.0")
        self.assertEqual(rf.model_name, "random_forest_risk_model")
        self.assertIsNotNone(rf.build_estimator())

        svm = SVMTrainer(version="2.0.0")
        self.assertEqual(svm.model_name, "svm_risk_model")
        self.assertIsNotNone(svm.build_estimator())

        ada = AdaBoostTrainer(version="2.0.0")
        self.assertEqual(ada.model_name, "adaboost_risk_model")
        self.assertIsNotNone(ada.build_estimator())
