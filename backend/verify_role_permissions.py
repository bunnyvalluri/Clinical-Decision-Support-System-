import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.patients.models import Patient
from apps.clinical.models import ClinicalRecord
from apps.core.models import AuditLog
from apps.model_registry.models import ModelVersion
from apps.predictions.models import Prediction, ClinicalReview, ReviewStatus, ReviewDecision, RiskLevel

User = get_user_model()

def run_checks():
    print("=" * 60)
    print("PROMPT 19: EXECUTING ROLE & PERMISSION AUTHORIZATION VERIFICATION")
    print("=" * 60)
    
    client = APIClient()
    
    # 1. Setup ephemeral test users
    with transaction.atomic():
        doc_user, _ = User.objects.get_or_create(
            username="verify_doc_vance",
            defaults={
                "email": "verify_doc@hospital.org",
                "role": UserRole.DOCTOR,
                "first_name": "Elena",
                "last_name": "Vance",
                "department": "Cardiology",
            }
        )
        nurse_user, _ = User.objects.get_or_create(
            username="verify_nurse_jenkins",
            defaults={
                "email": "verify_nurse@hospital.org",
                "role": UserRole.NURSE,
                "first_name": "Sarah",
                "last_name": "Jenkins",
                "department": "Triage",
            }
        )
        info_user, _ = User.objects.get_or_create(
            username="verify_info_rivera",
            defaults={
                "email": "verify_info@hospital.org",
                "role": UserRole.MEDICAL_INFORMATICIST,
                "first_name": "Alex",
                "last_name": "Rivera",
                "department": "Informatics",
            }
        )
        admin_user, _ = User.objects.get_or_create(
            username="verify_admin_chen",
            defaults={
                "email": "verify_admin@hospital.org",
                "role": UserRole.IT_ADMIN,
                "first_name": "Marcus",
                "last_name": "Chen",
                "department": "IT Systems",
            }
        )
        
        patient = Patient.objects.first()
        if not patient:
            patient = Patient.objects.create(
                mrn="MRN-VERIFY-001",
                first_name="Arthur",
                last_name="Pendleton",
                date_of_birth="1960-01-01",
                gender="MALE",
                primary_physician=doc_user
            )

        mv = ModelVersion.objects.filter(status="ACTIVE").first()
        if not mv:
            mv = ModelVersion.objects.create(
                name="RandomForestClassifier",
                version="v1.0.0",
                algorithm="RandomForestClassifier",
                status="ACTIVE",
                metrics={"brier": 0.0027, "accuracy": 0.985},
            )
            
        pred = Prediction.objects.filter(patient=patient).first()
        if not pred:
            pred = Prediction.objects.create(
                patient=patient,
                model_version=mv,
                model_name="RandomForestClassifier",
                model_version_str="v1.0.0",
                prediction_result=RiskLevel.HIGH,
                probability=0.7420,
                inference_latency_ms=0.136,
                features_snapshot={"systolic_bp": 165},
            )

        # TEST 1: Doctor cannot access admin users
        client.force_authenticate(user=doc_user)
        res1 = client.get("/api/v1/admin/users/")
        assert res1.status_code == 403, f"Expected 403, got {res1.status_code}"
        print("PASS: Doctor blocked from admin user management (HTTP 403).")

        # TEST 2: Nurse cannot review prediction
        client.force_authenticate(user=nurse_user)
        res2 = client.post(f"/api/v1/predictions/reviews/{pred.id}/decision/", {
            "decision": "CONCUR",
            "status": "REVIEWED",
            "rationale": "Nurse attempting physician review."
        }, format="json")
        assert res2.status_code == 403, f"Expected 403, got {res2.status_code}"
        print("PASS: Nurse blocked from physician clinical review (HTTP 403).")

        # TEST 3: Informaticist cannot enter vitals
        client.force_authenticate(user=info_user)
        res3 = client.post("/api/v1/clinical/vitals/", {
            "patient_id": str(patient.id),
            "systolic_bp": 130,
            "diastolic_bp": 85,
            "heart_rate": 78,
        }, format="json")
        assert res3.status_code == 403, f"Expected 403, got {res3.status_code}"
        print("PASS: Medical Informaticist blocked from vitals entry (HTTP 403).")

        # TEST 4: Nurse vitals entry biological contradiction
        client.force_authenticate(user=nurse_user)
        res4_bad = client.post("/api/v1/clinical/vitals/", {
            "patient_id": str(patient.id),
            "systolic_bp": 80,
            "diastolic_bp": 120, # Contradiction!
            "heart_rate": 80,
        }, format="json")
        assert res4_bad.status_code == 400, f"Expected 400, got {res4_bad.status_code}"
        print(f"PASS: Biological contradiction (SBP <= DBP) rejected: {res4_bad.data.get('error')}")

        # TEST 5: Nurse valid vitals entry and escalation
        res4_good = client.post("/api/v1/clinical/vitals/", {
            "patient_id": str(patient.id),
            "systolic_bp": 155,
            "diastolic_bp": 95,
            "heart_rate": 105,
            "respiratory_rate": 20,
            "oxygen_saturation": 94.0,
            "body_temperature": 37.8,
        }, format="json")
        assert res4_good.status_code == 201, f"Expected 201, got {res4_good.status_code}"
        print("PASS: Nurse entered valid bedside vitals (HTTP 201).")

        res5 = client.post("/api/v1/clinical/triage/escalate/", {
            "patient_id": str(patient.id),
            "reason": "Elevated BP and SpO2 dropping to 94%",
            "priority": "HIGH",
            "doctor_id": str(doc_user.id),
        }, format="json")
        assert res5.status_code == 201, f"Expected 201, got {res5.status_code}"
        print("PASS: Nurse escalated patient deterioration to Doctor (HTTP 201).")

        # TEST 6: Doctor can record clinical review
        client.force_authenticate(user=doc_user)
        res6 = client.post(f"/api/v1/predictions/reviews/{pred.id}/decision/", {
            "decision": "OVERRIDE",
            "status": "REVIEWED",
            "rationale": "Clinical observation shows stable trajectory. Movement artifact on monitor.",
            "override_risk_level": "MEDIUM",
        }, format="json")
        assert res6.status_code == 200, f"Expected 200, got {res6.status_code}"
        print("PASS: Doctor successfully recorded Clinical Review decision (HTTP 200).")

        # TEST 7: Informaticist view model benchmarks and drift
        client.force_authenticate(user=info_user)
        res7_bench = client.get("/api/v1/models/informatics/overview/")
        assert res7_bench.status_code == 200, f"Expected 200, got {res7_bench.status_code}"
        benchmarks = res7_bench.data["data"]["model_benchmarks"]
        print(f"PASS: Informaticist retrieved {len(benchmarks)} empirical model benchmarks.")

        res7_drift = client.get("/api/v1/models/informatics/drift/")
        assert res7_drift.status_code == 200, f"Expected 200, got {res7_drift.status_code}"
        print(f"PASS: Informaticist retrieved drift telemetry (Status: {res7_drift.data['data']['overall_drift_status']}).")

        # TEST 8: IT Admin can view users without password hashes and toggle status
        client.force_authenticate(user=admin_user)
        res8 = client.get("/api/v1/admin/users/")
        assert res8.status_code == 200, f"Expected 200, got {res8.status_code}"
        users_list = res8.data["data"]
        for u in users_list:
            assert "password" not in u
            assert "password_hash" not in u
        print(f"PASS: IT Admin listed {len(users_list)} users with ZERO password exposure.")

        res8_toggle = client.post(f"/api/v1/admin/users/{nurse_user.id}/toggle-active/")
        assert res8_toggle.status_code == 200, f"Expected 200, got {res8_toggle.status_code}"
        print("PASS: IT Admin toggled user active state successfully (HTTP 200).")

        print("=" * 60)
        print("ALL 8 RBAC & AUTHORIZATION CHECKS PASSED WITH 100% SUCCESS")
        print("=" * 60)

if __name__ == "__main__":
    run_checks()
