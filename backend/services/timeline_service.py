"""
Patient Clinical Timeline Service — BPY-CSE-2666.
Aggregates longitudinal clinical events, admissions, vitals, predictions, physician reviews,
nursing triage, alerts, data quality anomalies, FHIR imports, and feedback into a unified,
chronological timeline.

Every event standardizes:
- event_id
- patient_id
- event_type (Phase 3 Controlled Taxonomy)
- timestamp
- source
- actor
- severity
- status
- authorization_scope
- provenance
- metadata
- correlation_id
"""
from datetime import datetime
import logging
from typing import Any, Dict, List, Optional
import uuid

from django.utils import timezone
from django.utils.dateparse import parse_datetime

from apps.accounts.models import UserRole
from apps.clinical.models import (
    AISafetyEvent,
    ClinicalAlert,
    ClinicalRecord,
    ClinicalTask,
    DataQualityIssue,
    Escalation,
    PatientTimelineEvent,
    TriageRecord,
)
from apps.notifications.models import Notification
from apps.patients.models import Patient
from apps.predictions.models import ClinicalReview, Prediction, PredictionFeedback, PredictionOutcomeLink

try:
    from apps.interoperability.models import FHIRProvenanceRecord
except ImportError:
    FHIRProvenanceRecord = None

logger = logging.getLogger(__name__)


class PatientTimelineService:
    """
    Constructs unified patient clinical timelines across clinical encounters,
    diagnostic assessments, ML inferences, doctor interventions, guidelines, and safety events.
    Supports filtering, pagination, and role-based privacy scoping.
    """

    @classmethod
    def get_timeline_for_patient(
        cls,
        patient_id: str | uuid.UUID,
        max_events: int = 50,
        user_role: str = "DOCTOR",
        event_type: Optional[str] = None,
        date_from: Optional[str | datetime] = None,
        date_to: Optional[str | datetime] = None,
        source: Optional[str] = None,
        severity: Optional[str] = None,
        offset: int = 0,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Aggregate, filter, and normalize all clinical events for a single patient into a sorted list.
        """
        events: List[Dict[str, Any]] = []

        try:
            patient = Patient.objects.get(pk=patient_id)
        except (Patient.DoesNotExist, ValueError):
            return []

        patient_uuid_str = str(patient.id)
        is_patient_user = (str(user_role).upper() in ["PATIENT", "USER"])
        is_informaticist = (str(user_role).upper() in ["MEDICAL_INFORMATICIST", "INFORMATICIST", "ADMIN", "DEVELOPER"])

        # 1. Patient Registration / Admission
        events.append({
            "event_id": f"reg-{patient.id}",
            "patient_id": patient_uuid_str,
            "event_type": PatientTimelineEvent.EventType.ENCOUNTER,
            "title": "Patient Registered / Admitted",
            "description": f"Admitted to system with MRN {patient.mrn}.",
            "timestamp": patient.created_at.isoformat(),
            "actor": "System / Admissions",
            "source": "PatientRegistry",
            "severity": "NORMAL",
            "status": "ACTIVE",
            "authorization_scope": "PUBLIC_PATIENT",
            "provenance": {"origin": "Internal Hospital Registration", "mrn": patient.mrn},
            "correlation_id": str(patient.id),
            "metadata": {
                "mrn": patient.mrn,
                "gender": patient.gender,
                "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            },
        })

        # 2. Clinical Records & Vitals Encounters
        records = ClinicalRecord.objects.filter(patient=patient).select_related("recorded_by").order_by("-recorded_at")[:100]
        for rec in records:
            actor_name = rec.recorded_by.get_full_name() if rec.recorded_by else "Clinical Staff"
            vitals_summary = f"BP: {rec.systolic_bp or '--'}/{rec.diastolic_bp or '--'} mmHg, HR: {rec.heart_rate or '--'} bpm, SpO2: {rec.oxygen_saturation or '--'}%"
            events.append({
                "event_id": f"rec-{rec.id}",
                "patient_id": patient_uuid_str,
                "event_type": PatientTimelineEvent.EventType.VITAL,
                "title": f"Encounter: {rec.encounter_type}",
                "description": vitals_summary,
                "timestamp": rec.recorded_at.isoformat(),
                "actor": actor_name,
                "source": "ClinicalRecord",
                "severity": "NORMAL",
                "status": "ACTIVE",
                "authorization_scope": "PUBLIC_PATIENT",
                "provenance": {
                    "source": "EHR Clinical Record",
                    "recorded_by": actor_name,
                    "record_id": str(rec.id),
                },
                "correlation_id": str(rec.id),
                "metadata": {
                    "encounter_type": rec.encounter_type,
                    "systolic_bp": rec.systolic_bp,
                    "diastolic_bp": rec.diastolic_bp,
                    "heart_rate": rec.heart_rate,
                    "respiratory_rate": rec.respiratory_rate,
                    "oxygen_saturation": float(rec.oxygen_saturation) if rec.oxygen_saturation else None,
                    "temperature": float(rec.body_temperature) if rec.body_temperature else None,
                    "glucose_level": float(rec.glucose_level) if rec.glucose_level else None,
                    "symptoms": rec.symptoms,
                },
            })

        # 3. Risk Predictions (Numbered chronologically)
        predictions = Prediction.objects.filter(patient=patient).select_related("model_version", "clinical_review").order_by("prediction_timestamp")
        pred_list = list(predictions)
        for idx, pred in enumerate(pred_list, start=1):
            pred_sev = "CRITICAL" if pred.prediction_result in ("HIGH", "CRITICAL") else ("WARNING" if pred.prediction_result == "MEDIUM" else "NORMAL")
            
            # Patient-friendly vs Clinical description
            if is_patient_user:
                desc = f"Health risk screening assessed as {pred.prediction_result.lower()} risk level. Consult care team for questions."
            else:
                desc = (
                    f"Predicted {pred.prediction_result} risk ({float(pred.probability):.1%}) "
                    f"via {pred.model_name} v{pred.model_version_str}."
                )

            events.append({
                "event_id": f"pred-{pred.id}",
                "patient_id": patient_uuid_str,
                "event_type": PatientTimelineEvent.EventType.RISK_PREDICTION,
                "title": f"Risk Prediction #{idx}: {pred.prediction_result}",
                "description": desc,
                "timestamp": pred.prediction_timestamp.isoformat(),
                "actor": f"AI Risk Engine ({pred.model_name})",
                "source": "PredictionService",
                "severity": pred_sev,
                "status": pred.review_status,
                "authorization_scope": "PUBLIC_PATIENT",
                "provenance": {
                    "model_name": pred.model_name,
                    "model_version": pred.model_version_str,
                    "dataset_version": pred.model_version.training_dataset_identifier if pred.model_version else "clinical_risk_v1",
                    "feature_schema_version": pred.feature_schema_version,
                    "input_features": pred.features_snapshot,
                },
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
                    "clinician_override": pred.clinician_override,
                },
            })

        # 4. Doctor Reviews & Overrides
        reviews = ClinicalReview.objects.filter(prediction__patient=patient).select_related("doctor", "prediction").order_by("-created_at")[:100]
        for rev in reviews:
            doc_name = rev.doctor.get_full_name() if rev.doctor else "Attending Physician"
            is_override = (rev.decision == "OVERRIDE" or rev.status == ReviewStatus.OVERRIDDEN)
            ev_type = PatientTimelineEvent.EventType.PREDICTION_OVERRIDE if is_override else PatientTimelineEvent.EventType.PREDICTION_REVIEW

            events.append({
                "event_id": f"rev-{rev.id}",
                "patient_id": patient_uuid_str,
                "event_type": ev_type,
                "title": f"Physician {'Override' if is_override else 'Review'}: {rev.decision}",
                "description": f"{doc_name} marked status '{rev.status}'. Rationale: {rev.rationale or 'Concurred with automated risk trajectory.'}",
                "timestamp": (rev.reviewed_at or rev.created_at).isoformat(),
                "actor": doc_name,
                "source": "ClinicalReview",
                "severity": "WARNING" if is_override else "NORMAL",
                "status": rev.status,
                "authorization_scope": "PUBLIC_PATIENT",
                "provenance": {
                    "reviewer": doc_name,
                    "reviewer_id": str(rev.doctor_id) if rev.doctor_id else "",
                    "prediction_id": str(rev.prediction_id),
                },
                "correlation_id": str(rev.prediction_id),
                "metadata": {
                    "decision": rev.decision,
                    "status": rev.status,
                    "override_risk_level": rev.override_risk_level,
                    "structured_reason": getattr(rev, "structured_reason", ""),
                    "rationale": rev.rationale,
                },
            })

        # 5. Nurse Triage & Acuity
        triages = TriageRecord.objects.filter(patient=patient).select_related("nurse").order_by("-arrival_time")[:50]
        for tr in triages:
            nurse_name = tr.nurse.get_full_name() if tr.nurse else "Triage Nurse"
            events.append({
                "event_id": f"tr-{tr.id}",
                "patient_id": patient_uuid_str,
                "event_type": PatientTimelineEvent.EventType.NURSE_TRIAGE,
                "title": f"Triage Intake (ESI {tr.acuity_level})",
                "description": f"State: {tr.state}. Bed: {tr.bed_assignment or 'Unassigned'}. Complaint: {tr.chief_complaint or 'None logged'}.",
                "timestamp": tr.arrival_time.isoformat(),
                "actor": nurse_name,
                "source": "TriageRecord",
                "severity": "CRITICAL" if tr.acuity_level <= 2 else "NORMAL",
                "status": "ACTIVE",
                "authorization_scope": "CLINICAL_STAFF",
                "provenance": {"triage_record_id": str(tr.id), "nurse": nurse_name},
                "correlation_id": str(tr.id),
                "metadata": {
                    "acuity_level": tr.acuity_level,
                    "state": tr.state,
                    "bed": tr.bed_assignment,
                    "chief_complaint": tr.chief_complaint,
                },
            })

        # 6. Clinical Escalations
        escalations = Escalation.objects.filter(patient=patient).select_related("escalated_by", "assigned_doctor").order_by("-created_at")[:50]
        for esc in escalations:
            esc_by = esc.escalated_by.get_full_name() if esc.escalated_by else "Clinical Nurse"
            events.append({
                "event_id": f"esc-{esc.id}",
                "patient_id": patient_uuid_str,
                "event_type": PatientTimelineEvent.EventType.ESCALATION,
                "title": f"Clinical Escalation: {esc.priority} Priority",
                "description": f"Escalated by {esc_by}: {esc.reason}",
                "timestamp": esc.created_at.isoformat(),
                "actor": esc_by,
                "source": "ClinicalEscalation",
                "severity": "CRITICAL" if esc.priority == "CRITICAL" else "WARNING",
                "status": esc.status,
                "authorization_scope": "CLINICAL_STAFF",
                "provenance": {"escalation_id": str(esc.id), "escalated_by": esc_by},
                "correlation_id": str(esc.id),
                "metadata": {
                    "priority": esc.priority,
                    "status": esc.status,
                    "reason": esc.reason,
                    "doctor_notes": esc.doctor_notes,
                },
            })

        # 7. Dedicated Clinical Alerts
        clinical_alerts = ClinicalAlert.objects.filter(patient=patient).select_related("acknowledged_by", "resolved_by").order_by("-created_at")[:100]
        for ca in clinical_alerts:
            events.append({
                "event_id": f"ca-{ca.id}",
                "patient_id": patient_uuid_str,
                "event_type": PatientTimelineEvent.EventType.CLINICAL_ALERT,
                "title": f"Alert: {ca.alert_type} [{ca.severity}]",
                "description": ca.message,
                "timestamp": ca.created_at.isoformat(),
                "actor": ca.source,
                "source": "ClinicalAlert",
                "severity": ca.severity,
                "status": "RESOLVED" if ca.is_resolved else ("ACKNOWLEDGED" if ca.is_acknowledged else "ACTIVE"),
                "authorization_scope": "CLINICAL_STAFF",
                "provenance": {"alert_source": ca.source, "alert_id": str(ca.id)},
                "correlation_id": str(ca.id),
                "metadata": {
                    "alert_type": ca.alert_type,
                    "is_acknowledged": ca.is_acknowledged,
                    "acknowledged_by": ca.acknowledged_by.get_full_name() if ca.acknowledged_by else None,
                    "is_resolved": ca.is_resolved,
                    "resolved_by": ca.resolved_by.get_full_name() if ca.resolved_by else None,
                    "details": ca.details,
                },
            })

        # 8. Clinical Data Quality Events (Visible to Clinicians / Informaticists)
        if not is_patient_user:
            dq_issues = DataQualityIssue.objects.filter(patient=patient).order_by("-created_at")[:50]
            for dq in dq_issues:
                events.append({
                    "event_id": f"dq-{dq.id}",
                    "patient_id": patient_uuid_str,
                    "event_type": PatientTimelineEvent.EventType.DATA_QUALITY_EVENT,
                    "title": f"Data Quality: {dq.issue_type} ({dq.feature_name})",
                    "description": f"Observed value '{dq.observed_value}' out of expected range '{dq.expected_range}'. Severity: {dq.severity}.",
                    "timestamp": dq.created_at.isoformat(),
                    "actor": "ClinicalDataQualityGate",
                    "source": "DataQualityEngine",
                    "severity": dq.severity,
                    "status": dq.status,
                    "authorization_scope": "INFORMATICIST_ADMIN",
                    "provenance": {"feature": dq.feature_name, "issue_id": str(dq.id)},
                    "correlation_id": str(dq.id),
                    "metadata": {
                        "feature_name": dq.feature_name,
                        "observed_value": dq.observed_value,
                        "expected_range": dq.expected_range,
                        "status": dq.status,
                    },
                })

        # 9. FHIR Interoperability Provenance Events
        if not is_patient_user and FHIRProvenanceRecord is not None:
            try:
                fhir_records = FHIRProvenanceRecord.objects.filter(
                    entity_type="Patient",
                    entity_id=patient_uuid_str,
                ).order_by("-recorded_at")[:50]
                for fpr in fhir_records:
                    events.append({
                        "event_id": f"fhir-{fpr.id}",
                        "patient_id": patient_uuid_str,
                        "event_type": PatientTimelineEvent.EventType.FHIR_IMPORT,
                        "title": f"FHIR Interoperability: {fpr.fhir_resource_type} Import",
                        "description": f"Verified resource {fpr.fhir_resource_type} exchanged with {fpr.external_system_name}.",
                        "timestamp": fpr.recorded_at.isoformat(),
                        "actor": fpr.external_system_name,
                        "source": "FHIRGateway",
                        "severity": "NORMAL",
                        "status": "ACTIVE",
                        "authorization_scope": "INFORMATICIST_ADMIN",
                        "provenance": {
                            "system": fpr.external_system_name,
                            "external_resource_id": fpr.external_resource_id,
                            "payload_sha256": fpr.payload_sha256,
                        },
                        "correlation_id": str(fpr.id),
                        "metadata": {
                            "direction": fpr.direction,
                            "fhir_resource_type": fpr.fhir_resource_type,
                        },
                    })
            except Exception as exc:
                logger.debug("FHIR provenance query skipped: %s", exc)

        # 10. Prediction Feedback Entries
        feedbacks = PredictionFeedback.objects.filter(patient=patient).select_related("user").order_by("-created_at")[:50]
        for fb in feedbacks:
            user_name = fb.user.get_full_name() if fb.user else "Clinician"
            events.append({
                "event_id": f"fb-{fb.id}",
                "patient_id": patient_uuid_str,
                "event_type": PatientTimelineEvent.EventType.PREDICTION_REVIEW,
                "title": f"Clinician Feedback: {fb.feedback_category}",
                "description": f"{user_name} provided feedback: '{fb.comments or 'Feedback logged'}'",
                "timestamp": fb.created_at.isoformat(),
                "actor": user_name,
                "source": "PredictionFeedback",
                "severity": "NORMAL",
                "status": "ACTIVE",
                "authorization_scope": "CLINICAL_STAFF",
                "provenance": {"feedback_id": str(fb.id), "prediction_id": str(fb.prediction_id)},
                "correlation_id": str(fb.prediction_id),
                "metadata": {
                    "category": fb.feedback_category,
                    "comments": fb.comments,
                    "user_role": fb.user_role,
                },
            })

        # 11. Domain Patient Timeline Events
        domain_events = PatientTimelineEvent.objects.filter(patient=patient).select_related("actor_user").order_by("-timestamp")[:100]
        for de in domain_events:
            # Respect authorization scope for patient user
            if is_patient_user and de.authorization_scope != "PUBLIC_PATIENT":
                continue

            events.append({
                "event_id": f"pte-{de.id}",
                "patient_id": patient_uuid_str,
                "event_type": de.event_type,
                "title": de.title,
                "description": de.description,
                "timestamp": de.timestamp.isoformat(),
                "actor": de.actor or (de.actor_user.get_full_name() if de.actor_user else "Clinical Staff"),
                "source": de.source,
                "severity": de.severity,
                "status": de.status,
                "authorization_scope": de.authorization_scope,
                "correlation_id": de.correlation_id or str(de.id),
                "provenance": de.provenance,
                "metadata": de.metadata,
            })

        # 12. AI Safety Events (Clinician/Informaticist Only)
        if not is_patient_user:
            safety_events = AISafetyEvent.objects.filter(patient=patient).order_by("-timestamp")[:50]
            for se in safety_events:
                events.append({
                    "event_id": f"se-{se.id}",
                    "patient_id": patient_uuid_str,
                    "event_type": PatientTimelineEvent.EventType.AI_INTERACTION,
                    "title": f"AI Safety Gate: {se.event_type} [{se.action_taken}]",
                    "description": f"Safety evaluation ({se.severity}) with action '{se.action_taken}'. Correlation: {se.correlation_id}",
                    "timestamp": se.timestamp.isoformat(),
                    "actor": f"AI Safety Gate ({se.user_role})",
                    "source": "AISafetyGate",
                    "severity": "CRITICAL" if se.severity == "CRITICAL" else ("WARNING" if se.severity in ("HIGH", "MEDIUM") else "NORMAL"),
                    "status": "ACTIVE",
                    "authorization_scope": "INFORMATICIST_ADMIN",
                    "correlation_id": se.correlation_id,
                    "provenance": {"safety_gate": "AISafetyGate", "action_taken": se.action_taken},
                    "metadata": {
                        "event_type": se.event_type,
                        "action_taken": se.action_taken,
                        "details": se.details,
                    },
                })

        # Apply Filters
        filtered = events

        # Filter by event_type
        if event_type and event_type.upper() != "ALL":
            ev_upper = event_type.upper()
            filtered = [e for e in filtered if e["event_type"] == ev_upper]

        # Filter by source
        if source:
            src_lower = source.lower()
            filtered = [e for e in filtered if src_lower in e["source"].lower()]

        # Filter by severity
        if severity:
            sev_upper = severity.upper()
            filtered = [e for e in filtered if e["severity"] == sev_upper]

        # Filter by date_from / date_to
        if date_from:
            try:
                dt_from = parse_datetime(str(date_from)) or date_from
                filtered = [e for e in filtered if parse_datetime(e["timestamp"]) >= dt_from]
            except Exception:
                pass

        if date_to:
            try:
                dt_to = parse_datetime(str(date_to)) or date_to
                filtered = [e for e in filtered if parse_datetime(e["timestamp"]) <= dt_to]
            except Exception:
                pass

        # Sort all timeline events descending by timestamp
        filtered.sort(key=lambda e: e["timestamp"], reverse=True)

        # Apply Pagination (offset and limit)
        total_limit = limit if limit is not None else max_events
        return filtered[offset : offset + total_limit]
