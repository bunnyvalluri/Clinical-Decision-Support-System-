"""
Patient Clinical Timeline Service — BPY-CSE-2666.
Aggregates longitudinal clinical events, admissions, vitals, predictions, physician reviews,
nursing triage, and alerts into a unified, chronological timeline.
Every event includes: timestamp, actor, source, object, and correlation ID.
"""
from datetime import datetime
import logging
from typing import Any, Dict, List, Optional
import uuid

from apps.clinical.models import ClinicalRecord, ClinicalTask, Escalation, TriageRecord
from apps.notifications.models import Notification
from apps.patients.models import Patient
from apps.predictions.models import ClinicalReview, Prediction

logger = logging.getLogger(__name__)


class PatientTimelineService:
    """
    Constructs unified patient clinical timelines across clinical encounters,
    diagnostic assessments, ML inferences, and doctor interventions.
    """

    @classmethod
    def get_timeline_for_patient(
        cls,
        patient_id: str | uuid.UUID,
        max_events: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Aggregate and normalize all clinical events for a single patient into a sorted list.
        """
        events: List[Dict[str, Any]] = []

        try:
            patient = Patient.objects.get(pk=patient_id)
        except (Patient.DoesNotExist, ValueError):
            return []

        # 1. Patient Registration / Admission
        events.append({
            "event_id": f"reg-{patient.id}",
            "event_type": "PATIENT_ADMISSION",
            "title": "Patient Registered / Admitted",
            "description": f"Admitted to system with MRN {patient.mrn}.",
            "timestamp": patient.created_at.isoformat(),
            "actor": "System / Admissions",
            "source": "PatientRegistry",
            "severity": "NORMAL",
            "correlation_id": str(patient.id),
            "metadata": {
                "mrn": patient.mrn,
                "gender": patient.gender,
                "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            },
        })

        # 2. Clinical Records & Vitals Encounters
        records = ClinicalRecord.objects.filter(patient=patient).select_related("recorded_by").order_by("-recorded_at")[:max_events]
        for rec in records:
            actor_name = rec.recorded_by.get_full_name() if rec.recorded_by else "Clinical Staff"
            vitals_summary = f"BP: {rec.systolic_bp or '--'}/{rec.diastolic_bp or '--'} mmHg, HR: {rec.heart_rate or '--'} bpm, SpO2: {rec.oxygen_saturation or '--'}%"
            events.append({
                "event_id": f"rec-{rec.id}",
                "event_type": "VITAL_OBSERVATION",
                "title": f"Encounter: {rec.encounter_type}",
                "description": vitals_summary,
                "timestamp": rec.recorded_at.isoformat(),
                "actor": actor_name,
                "source": "ClinicalRecord",
                "severity": "NORMAL",
                "correlation_id": str(rec.id),
                "metadata": {
                    "systolic_bp": rec.systolic_bp,
                    "diastolic_bp": rec.diastolic_bp,
                    "heart_rate": rec.heart_rate,
                    "respiratory_rate": rec.respiratory_rate,
                    "oxygen_saturation": float(rec.oxygen_saturation) if rec.oxygen_saturation else None,
                    "temperature": float(rec.body_temperature) if rec.body_temperature else None,
                    "symptoms": rec.symptoms,
                },
            })

        # 3. Risk Predictions (Numbered chronologically)
        predictions = Prediction.objects.filter(patient=patient).select_related("model_version").order_by("prediction_timestamp")
        pred_list = list(predictions)
        for idx, pred in enumerate(pred_list, start=1):
            severity = "CRITICAL" if pred.prediction_result in ("HIGH", "CRITICAL") else ("WARNING" if pred.prediction_result == "MEDIUM" else "NORMAL")
            events.append({
                "event_id": f"pred-{pred.id}",
                "event_type": "RISK_PREDICTION",
                "title": f"Risk Prediction #{idx}: {pred.prediction_result}",
                "description": f"Predicted {pred.prediction_result} risk ({float(pred.probability):.1%}) by {pred.model_name} v{pred.model_version_str}.",
                "timestamp": pred.prediction_timestamp.isoformat(),
                "actor": f"AI Risk Engine ({pred.model_name})",
                "source": "PredictionService",
                "severity": severity,
                "correlation_id": str(pred.id),
                "metadata": {
                    "prediction_number": idx,
                    "risk_level": pred.prediction_result,
                    "probability": float(pred.probability),
                    "confidence": float(pred.confidence_score) if pred.confidence_score else None,
                    "uncertainty_score": float(pred.uncertainty_score) if pred.uncertainty_score else None,
                    "is_abstaining": pred.is_abstaining,
                    "ood_status": pred.ood_status,
                    "model_version": pred.model_version_str,
                },
            })

        # 4. Doctor Reviews
        reviews = ClinicalReview.objects.filter(prediction__patient=patient).select_related("doctor", "prediction").order_by("-created_at")[:max_events]
        for rev in reviews:
            doc_name = rev.doctor.get_full_name() if rev.doctor else "Attending Physician"
            events.append({
                "event_id": f"rev-{rev.id}",
                "event_type": "CLINICAL_REVIEW",
                "title": f"Physician Review: {rev.decision}",
                "description": f"{doc_name} marked status '{rev.status}'. Rationale: {rev.rationale or 'Concurred with automated risk trajectory.'}",
                "timestamp": (rev.reviewed_at or rev.created_at).isoformat(),
                "actor": doc_name,
                "source": "ClinicalReview",
                "severity": "NORMAL" if rev.decision == "CONCUR" else "WARNING",
                "correlation_id": str(rev.prediction_id),
                "metadata": {
                    "decision": rev.decision,
                    "status": rev.status,
                    "override_risk_level": rev.override_risk_level,
                    "rationale": rev.rationale,
                },
            })

        # 5. Nurse Triage & Escalations
        triages = TriageRecord.objects.filter(patient=patient).select_related("nurse").order_by("-arrival_time")[:max_events]
        for tr in triages:
            nurse_name = tr.nurse.get_full_name() if tr.nurse else "Triage Nurse"
            events.append({
                "event_id": f"tr-{tr.id}",
                "event_type": "NURSE_TRIAGE",
                "title": f"Triage Intake (ESI {tr.acuity_level})",
                "description": f"State: {tr.state}. Bed: {tr.bed_assignment or 'Unassigned'}. Complaint: {tr.chief_complaint or 'None logged'}.",
                "timestamp": tr.arrival_time.isoformat(),
                "actor": nurse_name,
                "source": "TriageRecord",
                "severity": "CRITICAL" if tr.acuity_level <= 2 else "NORMAL",
                "correlation_id": str(tr.id),
                "metadata": {
                    "acuity_level": tr.acuity_level,
                    "state": tr.state,
                    "bed": tr.bed_assignment,
                },
            })

        # 6. Critical Notifications & Alerts
        alerts = Notification.objects.filter(patient=patient).order_by("-created_at")[:max_events]
        for alt in alerts:
            events.append({
                "event_id": f"alt-{alt.id}",
                "event_type": "CLINICAL_ALERT",
                "title": alt.title,
                "description": alt.message,
                "timestamp": alt.created_at.isoformat(),
                "actor": "Clinical Notification Engine",
                "source": "NotificationService",
                "severity": alt.severity,
                "correlation_id": str(alt.id),
                "metadata": {
                    "channel": alt.channel,
                    "is_read": alt.is_read,
                },
            })

        # Sort all timeline events descending by timestamp
        events.sort(key=lambda e: e["timestamp"], reverse=True)
        return events[:max_events]
