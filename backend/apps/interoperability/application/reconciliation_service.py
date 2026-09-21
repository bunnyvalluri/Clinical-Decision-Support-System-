"""
Patient Reconciliation & Duplicate Detection Service — BPY-CSE-2666.
Detects duplicates using deterministic MRN matching and probabilistic demographic similarity.
"""
from datetime import date
import difflib
from typing import Any, Dict, List, Optional, Tuple

from apps.interoperability.domain.value_objects import MatchScore
from apps.patients.models import Patient


class ReconciliationService:
    """
    Reconciles external patient demographics against internal authoritative Patient records in Neon PostgreSQL.
    Prevents duplicate clinical record proliferation and guards against unintentional identity collisions.
    """

    @classmethod
    def match_patient(cls, incoming_data: Dict[str, Any]) -> MatchScore:
        """
        Evaluate an incoming patient dictionary against existing Patient records.
        Returns a MatchScore with confidence, tier, and matched ID.
        """
        mrn = incoming_data.get("mrn")
        first_name = (incoming_data.get("first_name") or "").strip().lower()
        last_name = (incoming_data.get("last_name") or "").strip().lower()
        dob = incoming_data.get("date_of_birth")
        gender = incoming_data.get("gender")

        # 1. Deterministic Match: Exact MRN
        if mrn:
            exact_patient = Patient.objects.filter(mrn__iexact=mrn).first()
            if exact_patient:
                return MatchScore(
                    is_exact_mrn=True,
                    confidence_score=1.0,
                    matched_fields=("mrn",),
                    matched_patient_id=str(exact_patient.id),
                    match_tier="EXACT",
                )

        # 2. Deterministic Match: Exact Name + DOB + Gender
        if first_name and last_name and dob:
            candidate = Patient.objects.filter(
                first_name__iexact=first_name,
                last_name__iexact=last_name,
                date_of_birth=dob,
            ).first()
            if candidate:
                matched_fields = ["first_name", "last_name", "date_of_birth"]
                if gender and candidate.gender == gender:
                    matched_fields.append("gender")
                return MatchScore(
                    is_exact_mrn=False,
                    confidence_score=0.95,
                    matched_fields=tuple(matched_fields),
                    matched_patient_id=str(candidate.id),
                    match_tier="EXACT_DEMOGRAPHIC",
                )

        # 3. Probabilistic / Fuzzy Matching
        best_match: Optional[Patient] = None
        best_score = 0.0
        best_matched_fields: List[str] = []

        # Narrow search space by DOB if present, or by last name prefix
        candidates: List[Patient] = []
        if dob:
            candidates = list(Patient.objects.filter(date_of_birth=dob)[:50])
        elif last_name:
            candidates = list(Patient.objects.filter(last_name__istartswith=last_name[:3])[:50])

        for cand in candidates:
            score, fields = cls._calculate_demographic_similarity(
                incoming_first=first_name,
                incoming_last=last_name,
                incoming_dob=dob,
                incoming_gender=gender,
                candidate=cand,
            )
            if score > best_score:
                best_score = score
                best_match = cand
                best_matched_fields = fields

        if best_match and best_score >= 0.80:
            return MatchScore(
                is_exact_mrn=False,
                confidence_score=round(best_score, 4),
                matched_fields=tuple(best_matched_fields),
                matched_patient_id=str(best_match.id),
                match_tier="PROBABLE" if best_score >= 0.85 else "POSSIBLE",
            )

        return MatchScore(
            is_exact_mrn=False,
            confidence_score=0.0,
            matched_fields=(),
            matched_patient_id=None,
            match_tier="NO_MATCH",
        )

    @classmethod
    def _calculate_demographic_similarity(
        cls,
        incoming_first: str,
        incoming_last: str,
        incoming_dob: Optional[date],
        incoming_gender: Optional[str],
        candidate: Patient,
    ) -> Tuple[float, List[str]]:
        """Calculate weighted demographic similarity between incoming data and candidate."""
        score = 0.0
        matched_fields = []

        cand_first = (candidate.first_name or "").strip().lower()
        cand_last = (candidate.last_name or "").strip().lower()

        # Last Name similarity (weight 0.35)
        if incoming_last and cand_last:
            ratio = difflib.SequenceMatcher(None, incoming_last, cand_last).ratio()
            score += 0.35 * ratio
            if ratio >= 0.85:
                matched_fields.append("last_name")

        # First Name similarity (weight 0.25)
        if incoming_first and cand_first:
            ratio = difflib.SequenceMatcher(None, incoming_first, cand_first).ratio()
            score += 0.25 * ratio
            if ratio >= 0.85:
                matched_fields.append("first_name")

        # DOB match (weight 0.30)
        if incoming_dob and candidate.date_of_birth:
            if incoming_dob == candidate.date_of_birth:
                score += 0.30
                matched_fields.append("date_of_birth")
            elif (
                incoming_dob.year == candidate.date_of_birth.year
                and incoming_dob.month == candidate.date_of_birth.month
            ):
                score += 0.15
                matched_fields.append("dob_year_month")

        # Gender match (weight 0.10)
        if incoming_gender and candidate.gender:
            if incoming_gender == candidate.gender:
                score += 0.10
                matched_fields.append("gender")

        return score, matched_fields

    @classmethod
    def calculate_field_discrepancies(
        cls,
        existing_patient: Patient,
        incoming_data: Dict[str, Any],
    ) -> Dict[str, Dict[str, Any]]:
        """
        Compare existing authoritative Patient attributes against incoming data.
        Returns a dictionary of discrepancies:
        {
            "phone_number": {"existing": "555-0100", "incoming": "555-0199"},
            ...
        }
        """
        discrepancies: Dict[str, Dict[str, Any]] = {}
        comparable_fields = [
            ("first_name", existing_patient.first_name),
            ("last_name", existing_patient.last_name),
            ("date_of_birth", str(existing_patient.date_of_birth) if existing_patient.date_of_birth else None),
            ("gender", existing_patient.gender),
            ("phone_number", existing_patient.phone_number),
            ("email", existing_patient.email),
            ("address", existing_patient.address),
            ("emergency_contact_name", existing_patient.emergency_contact_name),
            ("emergency_contact_phone", existing_patient.emergency_contact_phone),
        ]

        for field_name, existing_val in comparable_fields:
            incoming_val = incoming_data.get(field_name)
            if incoming_val is not None:
                # Normalize values for comparison
                clean_exist = str(existing_val or "").strip()
                clean_inc = str(incoming_val or "").strip()
                if clean_exist and clean_inc and clean_exist.lower() != clean_inc.lower():
                    discrepancies[field_name] = {
                        "existing": clean_exist,
                        "incoming": clean_inc,
                    }

        return discrepancies
