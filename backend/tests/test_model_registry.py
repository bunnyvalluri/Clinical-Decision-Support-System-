"""
Automated tests for ML Model Registry and In-Memory Loading Service.

Covers:
1. Model loading & in-memory caching (no repeated disk reads)
2. Model version selection
3. Active model lifecycle rules (only ACTIVE can serve predictions; CANDIDATE and ARCHIVED blocked)
4. Invalid artifact handling (missing file, corrupted file)
5. Model rollback and non-silent promotion with audit logging
"""
from decimal import Decimal
from pathlib import Path
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from sklearn.dummy import DummyClassifier
from sklearn.pipeline import Pipeline
import joblib

from apps.core.models import AuditLog
from apps.model_registry.models import ModelStatus, ModelVersion
from services.model_loader import (
    InvalidArtifactError,
    ModelLoaderService,
    NoActiveModelError,
)

User = get_user_model()


@pytest.fixture(autouse=True)
def clear_model_cache():
    """Ensure in-memory model cache is clean before and after each test."""
    ModelLoaderService.invalidate_cache()
    yield
    ModelLoaderService.invalidate_cache()


@pytest.fixture
def test_admin_and_clinician(db):
    admin = User.objects.create_user(
        username="registry_admin",
        email="registry.admin@hospital.local",
        password="AdminPassword123!",
        role="ADMIN",
        is_staff=True,
    )
    clinician = User.objects.create_user(
        username="registry_doc",
        email="registry.doc@hospital.local",
        password="DoctorPassword123!",
        role="DOCTOR",
    )
    patient = User.objects.create_user(
        username="registry_pat",
        email="registry.pat@hospital.local",
        password="PatientPassword123!",
        role="PATIENT",
    )
    return {"admin": admin, "clinician": clinician, "patient": patient}


@pytest.fixture
def dummy_artifact(tmp_path):
    """Create a valid serialized dummy pipeline artifact."""
    pipe = Pipeline([("classifier", DummyClassifier(strategy="most_frequent"))])
    pipe.fit([[1, 2], [3, 4]], ["LOW", "HIGH"])
    artifact_file = tmp_path / "test_pipeline.joblib"
    joblib.dump(pipe, artifact_file)
    return str(artifact_file)


# ---------------------------------------------------------------------------
# 1. Model Loading & In-Memory Caching Tests
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestModelLoaderCaching:
    def test_model_loading_and_in_memory_caching(self, dummy_artifact):
        # Create active model version
        mv = ModelVersion.objects.create(
            model_name="cardiac_model",
            algorithm="RandomForest",
            version="1.0.0",
            status=ModelStatus.ACTIVE,
            artifact_location=dummy_artifact,
            accuracy=Decimal("0.9500"),
        )

        assert not ModelLoaderService.is_cached("cardiac_model")

        # 1. First fetch loads from disk and populates cache
        pipe1, record1 = ModelLoaderService.get_active_model("cardiac_model")
        assert pipe1 is not None
        assert record1.id == mv.id
        assert ModelLoaderService.is_cached("cardiac_model")

        # 2. Second fetch returns the identical in-memory instance without re-reading
        pipe2, record2 = ModelLoaderService.get_active_model("cardiac_model")
        assert pipe1 is pipe2
        assert record1.version == record2.version

    def test_warmup_active_models(self, dummy_artifact):
        ModelVersion.objects.create(
            model_name="model_a",
            algorithm="SVM",
            version="1.0.0",
            status=ModelStatus.ACTIVE,
            artifact_location=dummy_artifact,
        )
        ModelVersion.objects.create(
            model_name="model_b",
            algorithm="RandomForest",
            version="1.0.0",
            status=ModelStatus.ACTIVE,
            artifact_location=dummy_artifact,
        )

        warmed = ModelLoaderService.warmup_active_models()
        assert warmed == 2
        assert ModelLoaderService.is_cached("model_a")
        assert ModelLoaderService.is_cached("model_b")


# ---------------------------------------------------------------------------
# 2. Active Model Rules & Selection Tests
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestActiveModelRules:
    def test_candidate_model_cannot_serve_predictions(self, dummy_artifact):
        ModelVersion.objects.create(
            model_name="sepsis_model",
            algorithm="AdaBoost",
            version="1.0.0",
            status=ModelStatus.CANDIDATE,
            artifact_location=dummy_artifact,
        )

        with pytest.raises(NoActiveModelError) as exc_info:
            ModelLoaderService.get_active_model("sepsis_model")
        assert "Only models in ACTIVE status can serve production predictions" in str(exc_info.value)

    def test_archived_model_cannot_serve_predictions(self, dummy_artifact):
        ModelVersion.objects.create(
            model_name="sepsis_model",
            algorithm="AdaBoost",
            version="0.9.0",
            status=ModelStatus.ARCHIVED,
            artifact_location=dummy_artifact,
        )

        with pytest.raises(NoActiveModelError):
            ModelLoaderService.get_active_model("sepsis_model")

    def test_model_version_selection(self, tmp_path):
        pipe_v1 = Pipeline([("clf", DummyClassifier(strategy="constant", constant="LOW"))])
        pipe_v1.fit([[1]], ["LOW"])
        f1 = tmp_path / "v1.joblib"
        joblib.dump(pipe_v1, f1)

        pipe_v2 = Pipeline([("clf", DummyClassifier(strategy="constant", constant="HIGH"))])
        pipe_v2.fit([[1]], ["HIGH"])
        f2 = tmp_path / "v2.joblib"
        joblib.dump(pipe_v2, f2)

        ModelVersion.objects.create(
            model_name="diabetes_model",
            algorithm="RandomForest",
            version="1.0.0",
            status=ModelStatus.ARCHIVED,
            artifact_location=str(f1),
        )
        ModelVersion.objects.create(
            model_name="diabetes_model",
            algorithm="RandomForest",
            version="2.0.0",
            status=ModelStatus.ACTIVE,
            artifact_location=str(f2),
        )

        # Active version should be 2.0.0
        _, active_rec = ModelLoaderService.get_active_model("diabetes_model")
        assert active_rec.version == "2.0.0"

        # Explicit version load retrieves v1.0.0
        _, v1_rec = ModelLoaderService.get_model_version("diabetes_model", "1.0.0")
        assert v1_rec.version == "1.0.0"


# ---------------------------------------------------------------------------
# 3. Invalid Artifact Handling Tests
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestInvalidArtifactHandling:
    def test_missing_artifact_raises_invalid_artifact_error(self):
        ModelVersion.objects.create(
            model_name="missing_model",
            algorithm="SVM",
            version="1.0.0",
            status=ModelStatus.ACTIVE,
            artifact_location="non/existent/path/model.joblib",
        )

        with pytest.raises(InvalidArtifactError) as exc_info:
            ModelLoaderService.get_active_model("missing_model")
        assert "does not exist" in str(exc_info.value)

    def test_corrupted_artifact_raises_invalid_artifact_error(self, tmp_path):
        corrupted_file = tmp_path / "corrupted.joblib"
        corrupted_file.write_text("THIS IS NOT A VALID JOBLIB PICKLE DATA")

        ModelVersion.objects.create(
            model_name="corrupt_model",
            algorithm="SVM",
            version="1.0.0",
            status=ModelStatus.ACTIVE,
            artifact_location=str(corrupted_file),
        )

        with pytest.raises(InvalidArtifactError) as exc_info:
            ModelLoaderService.get_active_model("corrupt_model")
        assert "Failed to deserialize" in str(exc_info.value)


# ---------------------------------------------------------------------------
# 4. Model Activation & Rollback Tests (Non-Silent Replacement)
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestModelActivationAndRollback:
    def test_activation_and_rollback_with_audit_trail(self, dummy_artifact, test_admin_and_clinician):
        admin = test_admin_and_clinician["admin"]

        v1 = ModelVersion.objects.create(
            model_name="icu_risk_model",
            algorithm="RandomForest",
            version="1.0.0",
            status=ModelStatus.ACTIVE,
            artifact_location=dummy_artifact,
            activated_at=timezone.now(),
        )

        v2 = ModelVersion.objects.create(
            model_name="icu_risk_model",
            algorithm="RandomForest",
            version="2.0.0",
            status=ModelStatus.CANDIDATE,
            artifact_location=dummy_artifact,
        )

        # Cache v1
        ModelLoaderService.get_active_model("icu_risk_model")
        assert ModelLoaderService.is_cached("icu_risk_model")

        # 1. Promote v2 to ACTIVE
        v2.activate(activated_by=admin, reason="Clinical validation passed with higher sensitivity")

        v1.refresh_from_db()
        v2.refresh_from_db()

        # Check atomic lifecycle updates
        assert v1.status == ModelStatus.ARCHIVED
        assert v1.retired_at is not None
        assert v2.status == ModelStatus.ACTIVE
        assert v2.activated_at is not None
        assert v2.activated_by == admin

        # Check in-memory cache was invalidated
        assert not ModelLoaderService.is_cached("icu_risk_model")

        # Verify active model is now v2
        _, active_mv = ModelLoaderService.get_active_model("icu_risk_model")
        assert active_mv.version == "2.0.0"

        # Check AuditLog recorded the promotion
        audit_log = AuditLog.objects.filter(
            resource_type="ModelVersion",
            resource_id=str(v2.id),
        ).first()
        assert audit_log is not None
        assert "Promoted icu_risk_model v2.0.0 to ACTIVE" in audit_log.description
        assert "1.0.0" in str(audit_log.metadata["prior_active_versions"])

        # 2. Rollback to v1.0.0
        v2.rollback(to_version="1.0.0", user=admin, reason="Drift observed in telemetry")

        v1.refresh_from_db()
        v2.refresh_from_db()

        assert v1.status == ModelStatus.ACTIVE
        assert v2.status == ModelStatus.ARCHIVED

        # Verify loader service now serves v1.0.0
        _, rolled_back_mv = ModelLoaderService.get_active_model("icu_risk_model")
        assert rolled_back_mv.version == "1.0.0"

    def test_api_activate_and_rollback_endpoints(self, dummy_artifact, test_admin_and_clinician):
        clinician = test_admin_and_clinician["clinician"]
        client = APIClient()
        refresh = RefreshToken.for_user(clinician)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        mv1 = ModelVersion.objects.create(
            model_name="resp_risk_model",
            algorithm="SVM",
            version="1.0.0",
            status=ModelStatus.ACTIVE,
            artifact_location=dummy_artifact,
        )
        mv2 = ModelVersion.objects.create(
            model_name="resp_risk_model",
            algorithm="SVM",
            version="2.0.0",
            status=ModelStatus.CANDIDATE,
            artifact_location=dummy_artifact,
        )

        # 1. API call to activate v2
        res_act = client.post(f"/api/v1/models/{mv2.id}/activate/", {"reason": "Approved by clinical board"})
        assert res_act.status_code == status.HTTP_200_OK
        mv2.refresh_from_db()
        assert mv2.status == ModelStatus.ACTIVE

        # 2. API call to rollback to v1
        res_roll = client.post(f"/api/v1/models/{mv2.id}/rollback/", {"target_version": "1.0.0", "reason": "Adverse alert spike"})
        assert res_roll.status_code == status.HTTP_200_OK
        mv1.refresh_from_db()
        assert mv1.status == ModelStatus.ACTIVE
