"""
Integration and unit tests for Clinical Whiteboards & Excalidraw integration (Prompt 32).
Tests models, versioning, SHA-256 content hashing, role-based access control,
secret & PHI scanning, clinical review locking, and AI diagram generation.
"""
import json
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.patients.models import Patient
from apps.whiteboards.models import (
    ClinicalWhiteboard,
    WhiteboardDocument,
    WhiteboardShare,
    WhiteboardAuditEvent,
    WhiteboardType,
    DataClassification,
    WhiteboardStatus,
)
from apps.whiteboards.services.whiteboard_service import WhiteboardService
from apps.whiteboards.services.persistence_service import WhiteboardPersistenceService
from apps.whiteboards.services.ai_service import WhiteboardAIService


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="dr_house",
        email="house@princetonplainsboro.org",
        password="ValidPassword123!",
        role=UserRole.DOCTOR,
        first_name="Gregory",
        last_name="House",
    )


@pytest.fixture
def nurse_user(db):
    return User.objects.create_user(
        username="nurse_jackie",
        email="jackie@all-saints.org",
        password="ValidPassword123!",
        role=UserRole.NURSE,
        first_name="Jackie",
        last_name="Peyton",
    )


@pytest.fixture
def informaticist_user(db):
    return User.objects.create_user(
        username="informaticist_dan",
        email="dan@healthnova.ai",
        password="ValidPassword123!",
        role=UserRole.MEDICAL_INFORMATICIST,
        first_name="Dan",
        last_name="Informaticist",
    )


@pytest.fixture
def it_admin_user(db):
    return User.objects.create_user(
        username="admin_sys",
        email="sysadmin@healthnova.ai",
        password="ValidPassword123!",
        role=UserRole.IT_ADMIN,
        first_name="Sys",
        last_name="Admin",
    )


@pytest.fixture
def patient_record(db):
    return Patient.objects.create(
        first_name="John",
        last_name="Doe",
        mrn="MRN-123456",
        date_of_birth="1980-01-01",
        gender="M",
    )


@pytest.fixture
def patient_user(db, patient_record):
    user = User.objects.create_user(
        username="patient_john",
        email="john.doe@gmail.com",
        password="ValidPassword123!",
        role=UserRole.PATIENT,
        first_name="John",
        last_name="Doe",
    )
    patient_record.user = user
    patient_record.save()
    return user


@pytest.fixture
def sample_elements():
    return [
        {
            "id": "el-1",
            "type": "rectangle",
            "x": 100,
            "y": 100,
            "width": 200,
            "height": 80,
            "strokeColor": "#0284c7",
            "backgroundColor": "#e0f2fe",
            "fillStyle": "solid",
        },
        {
            "id": "el-2",
            "type": "text",
            "x": 110,
            "y": 120,
            "width": 180,
            "height": 30,
            "text": "Triage Assessment Pathway",
            "fontSize": 14,
        },
    ]


@pytest.mark.django_db
class TestWhiteboardLifecycle:
    def test_create_whiteboard_and_initial_document(self, doctor_user, sample_elements):
        client = APIClient()
        client.force_authenticate(user=doctor_user)

        payload = {
            "title": "Emergency Sepsis Screening Protocol",
            "description": "Evidence-based triage escalation",
            "type": WhiteboardType.DECISION_TREE,
            "classification": DataClassification.INTERNAL,
            "initial_elements": sample_elements,
        }

        response = client.post("/api/v1/whiteboards/", data=payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        wb_id = response.data["id"]

        wb = ClinicalWhiteboard.objects.get(id=wb_id)
        assert wb.title == "Emergency Sepsis Screening Protocol"
        assert wb.current_version == 1
        assert wb.status == WhiteboardStatus.DRAFT
        assert not wb.is_locked

        # Check document creation
        doc = wb.documents.first()
        assert doc is not None
        assert doc.version_number == 1
        assert len(doc.elements) == 2
        assert doc.content_hash != ""
        assert doc.is_checkpoint is True

        # Check audit event
        audit = WhiteboardAuditEvent.objects.filter(whiteboard=wb, action="CREATE").first()
        assert audit is not None
        assert audit.user == doctor_user

    def test_document_autosave_and_checkpoint(self, doctor_user, sample_elements):
        wb = WhiteboardService.create_whiteboard(
            title="ICU Care Plan",
            owner=doctor_user,
            whiteboard_type=WhiteboardType.CARE_PLAN,
            initial_elements=sample_elements,
        )

        client = APIClient()
        client.force_authenticate(user=doctor_user)

        # 1. Autosave update (in-place draft document)
        updated_elements = list(sample_elements)
        updated_elements.append({
            "id": "el-3",
            "type": "rectangle",
            "x": 300,
            "y": 100,
            "width": 150,
            "height": 50,
        })
        save_payload = {
            "elements": updated_elements,
            "appState": {"viewBackgroundColor": "#ffffff"},
            "files": {},
            "is_checkpoint": False,
        }

        response = client.put(f"/api/v1/whiteboards/{wb.id}/document/", data=save_payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["saved"] is True
        assert response.data["version_number"] == 1

        # 2. Checkpoint creation (increments version to 2)
        checkpoint_payload = {
            "elements": updated_elements,
            "appState": {"viewBackgroundColor": "#ffffff"},
            "files": {},
            "is_checkpoint": True,
            "checkpoint_summary": "Milestone: Added fluid resuscitation branch",
        }
        res_cp = client.put(f"/api/v1/whiteboards/{wb.id}/document/", data=checkpoint_payload, format="json")
        assert res_cp.status_code == status.HTTP_200_OK
        assert res_cp.data["version_number"] == 2

        wb.refresh_from_db()
        assert wb.current_version == 2
        assert wb.documents.count() == 2

    def test_version_restore(self, doctor_user, sample_elements):
        wb = WhiteboardService.create_whiteboard(
            title="Stroke Pathway",
            owner=doctor_user,
            initial_elements=sample_elements,
        )

        # Create checkpoint v2
        doc_v2 = WhiteboardPersistenceService.save_document(
            whiteboard=wb,
            elements=[],
            app_state={},
            files={},
            user=doctor_user,
            is_checkpoint=True,
            checkpoint_summary="v2 blanked",
        )
        assert wb.current_version == 2

        client = APIClient()
        client.force_authenticate(user=doctor_user)

        # Restore v1
        restore_payload = {"target_version": 1, "reason": "Accidental clear, rolling back"}
        res = client.post(f"/api/v1/whiteboards/{wb.id}/restore/", data=restore_payload, format="json")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["restored"] is True
        assert res.data["current_version"] == 3

        wb.refresh_from_db()
        assert wb.current_version == 3
        v3_doc = wb.documents.get(version_number=3)
        assert len(v3_doc.elements) == 2  # Restored from v1


@pytest.mark.django_db
class TestClinicalGovernanceAndLocking:
    def test_clinical_review_approval_locks_whiteboard(self, doctor_user, nurse_user, sample_elements):
        wb = WhiteboardService.create_whiteboard(
            title="Pediatric Triage Tree",
            owner=nurse_user,
            whiteboard_type=WhiteboardType.TRIAGE_WORKFLOW,
            initial_elements=sample_elements,
        )

        client = APIClient()
        # 1. Nurse submits for review
        client.force_authenticate(user=nurse_user)
        res_sub = client.post(
            f"/api/v1/whiteboards/{wb.id}/review/",
            data={"action": "SUBMIT", "notes": "Ready for attending review"},
            format="json",
        )
        assert res_sub.status_code == status.HTTP_200_OK
        wb.refresh_from_db()
        assert wb.status == WhiteboardStatus.IN_REVIEW

        # 2. Nurse cannot approve (Only doctors can approve)
        res_nurse_app = client.post(
            f"/api/v1/whiteboards/{wb.id}/review/",
            data={"action": "APPROVE", "notes": "Nurse signing off"},
            format="json",
        )
        assert res_nurse_app.status_code == status.HTTP_403_FORBIDDEN

        # 3. Doctor approves -> Locks whiteboard
        client.force_authenticate(user=doctor_user)
        res_doc_app = client.post(
            f"/api/v1/whiteboards/{wb.id}/review/",
            data={"action": "APPROVE", "notes": "Approved by Dr. House"},
            format="json",
        )
        assert res_doc_app.status_code == status.HTTP_200_OK
        wb.refresh_from_db()
        assert wb.status == WhiteboardStatus.APPROVED
        assert wb.is_locked is True
        assert wb.clinical_reviewer == doctor_user

        # 4. Modifications to locked whiteboard are rejected (Forbidden / Locked)
        save_payload = {"elements": [], "appState": {}, "files": {}}
        res_locked_save = client.put(f"/api/v1/whiteboards/{wb.id}/document/", data=save_payload, format="json")
        assert res_locked_save.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestSecurityAndScanning:
    def test_secret_scanner_rejects_credentials(self, doctor_user):
        wb = WhiteboardService.create_whiteboard(
            title="Architecture Diagram",
            owner=doctor_user,
            whiteboard_type=WhiteboardType.SYSTEM_ARCHITECTURE,
        )

        client = APIClient()
        client.force_authenticate(user=doctor_user)

        # Attempt to inject AWS key
        leaked_elements = [
            {
                "id": "bad-1",
                "type": "text",
                "text": "Connecting to S3 with key: AKIAIOSFODNN7EXAMPLE",
            }
        ]
        res = client.put(
            f"/api/v1/whiteboards/{wb.id}/document/",
            data={"elements": leaked_elements, "appState": {}, "files": {}},
            format="json",
        )
        assert res.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY]
        assert "Detected sensitive credential" in str(res.data)

    def test_phi_scanner_rejects_ssn_on_internal_board(self, doctor_user):
        wb = WhiteboardService.create_whiteboard(
            title="Team Notes",
            owner=doctor_user,
            classification=DataClassification.INTERNAL,
        )

        client = APIClient()
        client.force_authenticate(user=doctor_user)

        # Attempt to write SSN on an INTERNAL board
        phi_elements = [
            {
                "id": "bad-phi",
                "type": "text",
                "text": "Patient SSN is 123-45-6789",
            }
        ]
        res = client.put(
            f"/api/v1/whiteboards/{wb.id}/document/",
            data={"elements": phi_elements, "appState": {}, "files": {}},
            format="json",
        )
        assert res.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY]
        assert "HIPAA Pre-Save Violation" in str(res.data)


@pytest.mark.django_db
class TestRoleAccessAndPatientBoundaries:
    def test_patient_can_only_view_own_approved_care_plan(self, doctor_user, patient_user, patient_record, sample_elements):
        # 1. Draft care plan
        wb_draft = WhiteboardService.create_whiteboard(
            title="John's Post-Op Recovery Plan",
            owner=doctor_user,
            whiteboard_type=WhiteboardType.CARE_PLAN,
            patient=patient_record,
            initial_elements=sample_elements,
        )

        client = APIClient()
        client.force_authenticate(user=patient_user)

        # Draft board is inaccessible to patient (403 or 404 filtered)
        res_draft = client.get(f"/api/v1/whiteboards/{wb_draft.id}/")
        assert res_draft.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

        # Approve board
        WhiteboardService.perform_clinical_review(
            whiteboard=wb_draft,
            action="APPROVE",
            reviewer=doctor_user,
            notes="Ready for patient view",
        )

        # Patient can now view approved care plan
        res_approved = client.get(f"/api/v1/whiteboards/{wb_draft.id}/")
        assert res_approved.status_code == status.HTTP_200_OK

        # Patient CANNOT edit (read-only)
        res_edit = client.put(
            f"/api/v1/whiteboards/{wb_draft.id}/document/",
            data={"elements": [], "appState": {}, "files": {}},
            format="json",
        )
        assert res_edit.status_code == status.HTTP_403_FORBIDDEN

    def test_it_admin_cannot_access_phi_whiteboard(self, doctor_user, it_admin_user, patient_record):
        wb_phi = WhiteboardService.create_whiteboard(
            title="Confidential Oncology Care Plan",
            owner=doctor_user,
            whiteboard_type=WhiteboardType.CARE_PLAN,
            classification=DataClassification.PHI,
            patient=patient_record,
        )

        client = APIClient()
        client.force_authenticate(user=it_admin_user)

        res = client.get(f"/api/v1/whiteboards/{wb_phi.id}/")
        assert res.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]


@pytest.mark.django_db
class TestAIDiagramGeneration:
    def test_ai_diagram_generation_contains_disclaimer_and_guidelines(self, doctor_user):
        wb = WhiteboardService.create_whiteboard(
            title="Sepsis Care Protocol",
            owner=doctor_user,
            whiteboard_type=WhiteboardType.DECISION_TREE,
        )

        client = APIClient()
        client.force_authenticate(user=doctor_user)

        payload = {
            "prompt": "Create early lactate screening flowchart for septic shock",
            "category": "SEPSIS",
        }
        res = client.post(f"/api/v1/whiteboards/{wb.id}/ai_generate/", data=payload, format="json")
        assert res.status_code == status.HTTP_200_OK
        data = res.data

        assert "elements" in data
        assert len(data["elements"]) > 0
        assert "guideline_citations" in data
        assert len(data["guideline_citations"]) > 0
        assert "Surviving Sepsis Campaign" in data["guideline_citations"][0]["source"]

        # Verify non-authoritative disclaimer is present in the generated elements
        has_disclaimer = any(
            "Non-Authoritative" in el.get("text", "")
            for el in data["elements"]
            if el.get("type") == "text"
        )
        assert has_disclaimer is True

        # Check audit event
        audit = WhiteboardAuditEvent.objects.filter(whiteboard=wb, action="AI_GENERATION").first()
        assert audit is not None
        assert audit.details["category"] == "SEPSIS"
