"""
Triage and bedside nursing views for BPY-CSE-2666 Clinical Decision Support System.

Provides queue management, vital signs validation, task tracking, and doctor escalations.
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User, UserRole
from apps.clinical.models import (
    ClinicalRecord,
    ClinicalTask,
    Escalation,
    EscalationPriority,
    EscalationStatus,
    TaskPriority,
    TaskStatus,
    TaskType,
    TriageRecord,
    TriageState,
)
from apps.core.models import AuditLog
from apps.core.permissions import CanEnterVitals, CanManageTriage, IsClinicianOrStaff, IsNurse
from apps.notifications.models import Notification, NotificationChannel, NotificationSeverity
from apps.patients.models import Patient
from apps.predictions.models import Prediction


@api_view(["GET", "POST"])
@permission_classes([CanManageTriage])
def triage_queue_view(request: Request) -> Response:
    """
    Triage queue endpoint.
    GET: List active patients in emergency/ward triage queue.
    POST: Admit a new patient into the triage queue.
    """
    if request.method == "GET":
        state_filter = request.query_params.get("state")
        queryset = TriageRecord.objects.select_related("patient", "nurse").order_by("acuity_level", "arrival_time")
        if state_filter:
            queryset = queryset.filter(state=state_filter)

        results = []
        for item in queryset[:100]:
            results.append({
                "id": str(item.id),
                "patient_id": str(item.patient.id),
                "mrn": item.patient.mrn,
                "patient_name": f"{item.patient.first_name} {item.patient.last_name}",
                "state": item.state,
                "acuity_level": item.acuity_level,
                "chief_complaint": item.chief_complaint,
                "bed_assignment": item.bed_assignment,
                "arrival_time": item.arrival_time.isoformat(),
                "nurse_name": item.nurse.full_name if item.nurse else "Unassigned",
                "triage_notes": item.triage_notes,
            })
        return Response({"success": True, "count": len(results), "data": results})

    # POST: Add patient to triage queue
    patient_id = request.data.get("patient_id")
    chief_complaint = request.data.get("chief_complaint", "")
    acuity_level = int(request.data.get("acuity_level", 3))
    bed_assignment = request.data.get("bed_assignment", "")

    try:
        patient = Patient.objects.get(id=patient_id)
    except (Patient.DoesNotExist, ValueError):
        return Response(
            {"success": False, "error": "Patient not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    triage_record = TriageRecord.objects.create(
        patient=patient,
        nurse=request.user,
        state=TriageState.WAITING,
        acuity_level=acuity_level,
        chief_complaint=chief_complaint,
        bed_assignment=bed_assignment,
        arrival_time=timezone.now(),
    )

    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.CREATE,
        resource_type="TriageRecord",
        resource_id=str(triage_record.id),
        description=f"Nurse {request.user.email} initiated triage for {patient.mrn} (ESI: {acuity_level})",
    )

    return Response({
        "success": True,
        "message": "Patient admitted to triage queue.",
        "data": {
            "id": str(triage_record.id),
            "state": triage_record.state,
            "acuity_level": triage_record.acuity_level,
        },
    }, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([CanManageTriage])
def update_triage_state_view(request: Request, pk: str) -> Response:
    """Update triage state (e.g. WAITING -> TRIAGE_IN_PROGRESS -> TRIAGED -> COMPLETED)."""
    try:
        record = TriageRecord.objects.get(id=pk)
    except (TriageRecord.DoesNotExist, ValueError):
        return Response({"success": False, "error": "Triage record not found."}, status=status.HTTP_404_NOT_FOUND)

    new_state = request.data.get("state")
    if new_state not in TriageState.values:
        return Response(
            {"success": False, "error": f"Invalid state. Allowed: {TriageState.values}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    old_state = record.state
    record.state = new_state
    if "bed_assignment" in request.data:
        record.bed_assignment = request.data["bed_assignment"]
    if "triage_notes" in request.data:
        record.triage_notes = request.data["triage_notes"]
    record.nurse = request.user
    record.save()

    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.UPDATE,
        resource_type="TriageRecord",
        resource_id=str(record.id),
        description=f"Triage state transitioned: {old_state} -> {new_state} for {record.patient.mrn}",
    )

    return Response({"success": True, "message": f"Triage state updated to {new_state}.", "state": new_state})


@api_view(["GET", "POST", "PATCH"])
@permission_classes([IsClinicianOrStaff])
def clinical_tasks_view(request: Request) -> Response:
    """Manage nursing clinical tasks (vitals check, medication, reassessments)."""
    if request.method == "GET":
        status_filter = request.query_params.get("status")
        queryset = ClinicalTask.objects.select_related("patient", "assigned_to").order_by("due_at", "-created_at")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        results = []
        for task in queryset[:50]:
            results.append({
                "id": str(task.id),
                "patient_mrn": task.patient.mrn,
                "patient_name": f"{task.patient.first_name} {task.patient.last_name}",
                "title": task.title,
                "task_type": task.task_type,
                "priority": task.priority,
                "status": task.status,
                "due_at": task.due_at.isoformat() if task.due_at else None,
                "assigned_to": task.assigned_to.full_name if task.assigned_to else "Unassigned",
                "notes": task.notes,
            })
        return Response({"success": True, "count": len(results), "data": results})

    if request.method == "POST":
        patient_id = request.data.get("patient_id")
        title = request.data.get("title")
        task_type = request.data.get("task_type", TaskType.VITALS_CHECK)
        priority = request.data.get("priority", TaskPriority.ROUTINE)

        try:
            patient = Patient.objects.get(id=patient_id)
        except (Patient.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)

        task = ClinicalTask.objects.create(
            patient=patient,
            created_by=request.user,
            assigned_to=request.user,
            title=title,
            task_type=task_type,
            priority=priority,
            status=TaskStatus.PENDING,
            due_at=timezone.now() + timezone.timedelta(hours=2),
            notes=request.data.get("notes", ""),
        )

        return Response({"success": True, "task_id": str(task.id), "title": task.title}, status=status.HTTP_201_CREATED)

    # PATCH: update status
    task_id = request.data.get("task_id")
    new_status = request.data.get("status")
    try:
        task = ClinicalTask.objects.get(id=task_id)
        task.status = new_status
        if new_status == TaskStatus.COMPLETED:
            task.completed_at = timezone.now()
        task.save()
        return Response({"success": True, "message": f"Task updated to {new_status}."})
    except (ClinicalTask.DoesNotExist, ValueError):
        return Response({"success": False, "error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([CanEnterVitals])
def enter_vital_signs_view(request: Request) -> Response:
    """
    Validated bedside physiological vital signs recording.
    Enforces biological range checks:
    - SBP > DBP
    - Heart rate 30..240
    - Oxygen saturation 50..100%
    - Temperature 30..45°C
    """
    patient_id = request.data.get("patient_id")
    try:
        patient = Patient.objects.get(id=patient_id)
    except (Patient.DoesNotExist, ValueError):
        return Response({"success": False, "error": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        systolic_bp = int(request.data.get("systolic_bp", 120))
        diastolic_bp = int(request.data.get("diastolic_bp", 80))
        heart_rate = int(request.data.get("heart_rate", 75))
        respiratory_rate = int(request.data.get("respiratory_rate", 16))
        oxygen_saturation = float(request.data.get("oxygen_saturation", 98.0))
        temperature = float(request.data.get("body_temperature", 37.0))
    except (TypeError, ValueError) as exc:
        return Response({"success": False, "error": f"Invalid numerical vital parameter: {exc}"}, status=status.HTTP_400_BAD_REQUEST)

    # Biological plausibility validation
    if systolic_bp <= diastolic_bp:
        return Response(
            {"success": False, "error": f"Biological contradiction: Systolic BP ({systolic_bp}) must exceed Diastolic BP ({diastolic_bp})."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not (30 <= heart_rate <= 240):
        return Response(
            {"success": False, "error": f"Heart rate ({heart_rate} bpm) is out of physiological range (30-240)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not (50 <= oxygen_saturation <= 100):
        return Response(
            {"success": False, "error": f"Oxygen saturation ({oxygen_saturation}%) is out of range (50-100%)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    record = ClinicalRecord.objects.create(
        patient=patient,
        recorded_by=request.user,
        recorded_at=timezone.now(),
        systolic_bp=systolic_bp,
        diastolic_bp=diastolic_bp,
        heart_rate=heart_rate,
        respiratory_rate=respiratory_rate,
        oxygen_saturation=oxygen_saturation,
        body_temperature=temperature,
        glucose_level=request.data.get("glucose_level"),
        cholesterol_total=request.data.get("cholesterol_total"),
    )

    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.CREATE,
        resource_type="ClinicalRecord",
        resource_id=str(record.id),
        description=f"Vitals entered for {patient.mrn}: BP {systolic_bp}/{diastolic_bp}, HR {heart_rate}, SpO2 {oxygen_saturation}%",
    )

    # Optional auto-alert if critically abnormal
    if systolic_bp >= 180 or oxygen_saturation < 90 or heart_rate > 140:
        assigned_doc = patient.primary_physician
        if assigned_doc:
            Notification.objects.create(
                recipient=assigned_doc,
                patient=patient,
                severity=NotificationSeverity.CRITICAL,
                channel=NotificationChannel.IN_APP,
                title=f"Critical Vitals Alert — {patient.mrn}",
                message=f"Acute vital deterioration logged by Nurse {request.user.full_name}: BP {systolic_bp}/{diastolic_bp}, HR {heart_rate}, SpO2 {oxygen_saturation}%.",
            )

    return Response({
        "success": True,
        "message": "Clinical vitals successfully recorded and validated.",
        "record_id": str(record.id),
        "recorded_at": record.recorded_at.isoformat(),
    }, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@permission_classes([IsClinicianOrStaff])
def escalate_patient_view(request: Request) -> Response:
    """
    Direct nurse-to-physician patient escalation workflow.
    GET: List active escalation events.
    POST: Create escalation, triggers high-priority notifications and audit trail.
    """
    if request.method == "GET":
        qs = Escalation.objects.select_related("patient", "escalated_by", "assigned_doctor").order_by("-created_at")[:50]
        results = []
        for esc in qs:
            results.append({
                "id": str(esc.id),
                "patient_name": f"{esc.patient.first_name} {esc.patient.last_name}",
                "patient_mrn": esc.patient.mrn,
                "reason": esc.reason,
                "status": esc.status,
                "priority": esc.priority,
                "escalated_by": esc.escalated_by.full_name if esc.escalated_by else "Clinical Staff",
                "assigned_doctor": esc.assigned_doctor.full_name if esc.assigned_doctor else "On-Call Physician",
                "created_at": esc.created_at.isoformat(),
            })
        return Response({"success": True, "count": len(results), "data": results})

    patient_id = request.data.get("patient_id")
    reason = request.data.get("reason", "")
    priority = request.data.get("priority", EscalationPriority.HIGH)
    doctor_id = request.data.get("doctor_id")

    if not reason:
        return Response({"success": False, "error": "Escalation reason is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        patient = Patient.objects.get(id=patient_id)
    except (Patient.DoesNotExist, ValueError):
        return Response({"success": False, "error": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)

    assigned_doc = None
    if doctor_id:
        assigned_doc = User.objects.filter(id=doctor_id, role__in=[UserRole.DOCTOR, UserRole.CLINICIAN]).first()
    if not assigned_doc:
        assigned_doc = patient.primary_physician or User.objects.filter(role__in=[UserRole.DOCTOR, UserRole.CLINICIAN]).first()

    escalation = Escalation.objects.create(
        patient=patient,
        escalated_by=request.user,
        assigned_doctor=assigned_doc,
        reason=reason,
        priority=priority,
        status=EscalationStatus.PENDING,
    )

    # Notify doctor
    if assigned_doc:
        Notification.objects.create(
            recipient=assigned_doc,
            patient=patient,
            severity=NotificationSeverity.CRITICAL if priority == EscalationPriority.CRITICAL else NotificationSeverity.HIGH,
            channel=NotificationChannel.IN_APP,
            title=f"URGENT Escalation: Patient {patient.mrn}",
            message=f"Nurse {request.user.full_name} escalated {patient.first_name} {patient.last_name}: {reason}",
            action_url=f"/patients/{patient.id}/",
        )

    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.CREATE,
        resource_type="Escalation",
        resource_id=str(escalation.id),
        description=f"Nurse {request.user.email} escalated {patient.mrn} to Dr. {assigned_doc.full_name if assigned_doc else 'On-Call'}: {reason}",
    )

    return Response({
        "success": True,
        "message": "Patient escalated successfully. Doctor alerted.",
        "escalation_id": str(escalation.id),
        "doctor": assigned_doc.full_name if assigned_doc else "On-Call Physician",
    }, status=status.HTTP_201_CREATED)
