"""
Unit Tests for Duplicate Detection and Patient Reconciliation.
"""
from datetime import date
from django.test import TestCase

from apps.interoperability.application.reconciliation_service import ReconciliationService
from apps.patients.models import Gender, Patient


class TestDuplicateDetection(TestCase):
    """Tests for deterministic and probabilistic patient matching."""

    def setUp(self):
        self.patient = Patient.objects.create(
            mrn="MRN-DUP-001",
            first_name="Alexander",
            last_name="Hamilton",
            gender=Gender.MALE,
            date_of_birth=date(1980, 1, 11),
            phone_number="555-0100",
            email="alexander.h@treasury.gov",
            address="57 Wall Street, New York, NY",
        )

    def test_exact_mrn_match(self):
        incoming = {
            "mrn": "MRN-DUP-001",
            "first_name": "Alex",
            "last_name": "Hamilton",
        }
        score = ReconciliationService.match_patient(incoming)
        self.assertTrue(score.is_exact_mrn)
        self.assertEqual(score.confidence_score, 1.0)
        self.assertEqual(score.match_tier, "EXACT")
        self.assertEqual(score.matched_patient_id, str(self.patient.id))

    def test_exact_demographic_match(self):
        incoming = {
            "mrn": "DIFFERENT-MRN-999",  # Different MRN
            "first_name": "Alexander",
            "last_name": "Hamilton",
            "date_of_birth": date(1980, 1, 11),
            "gender": Gender.MALE,
        }
        score = ReconciliationService.match_patient(incoming)
        self.assertFalse(score.is_exact_mrn)
        self.assertEqual(score.confidence_score, 0.95)
        self.assertEqual(score.match_tier, "EXACT_DEMOGRAPHIC")
        self.assertEqual(score.matched_patient_id, str(self.patient.id))

    def test_probabilistic_fuzzy_name_match(self):
        incoming = {
            "first_name": "Alexandre",  # Typo in first name
            "last_name": "Hamiltone",   # Typo in last name
            "date_of_birth": date(1980, 1, 11),
            "gender": Gender.MALE,
        }
        score = ReconciliationService.match_patient(incoming)
        self.assertFalse(score.is_exact_mrn)
        self.assertTrue(score.confidence_score >= 0.80)
        self.assertIn(score.match_tier, ("PROBABLE", "POSSIBLE"))
        self.assertEqual(score.matched_patient_id, str(self.patient.id))

    def test_no_match(self):
        incoming = {
            "mrn": "MRN-UNKNOWN-888",
            "first_name": "Theodore",
            "last_name": "Roosevelt",
            "date_of_birth": date(1958, 10, 27),
            "gender": Gender.MALE,
        }
        score = ReconciliationService.match_patient(incoming)
        self.assertEqual(score.match_tier, "NO_MATCH")
        self.assertIsNone(score.matched_patient_id)

    def test_field_discrepancy_detection(self):
        incoming_with_new_phone = {
            "phone_number": "555-9999",  # Different from 555-0100
            "address": "120 Broadway, New York, NY",  # Different from 57 Wall St
        }
        discrepancies = ReconciliationService.calculate_field_discrepancies(self.patient, incoming_with_new_phone)
        self.assertIn("phone_number", discrepancies)
        self.assertEqual(discrepancies["phone_number"]["existing"], "555-0100")
        self.assertEqual(discrepancies["phone_number"]["incoming"], "555-9999")
        self.assertIn("address", discrepancies)
