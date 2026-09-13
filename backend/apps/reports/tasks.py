"""
Report generation Celery tasks using ReportLab.
Compiles patient demographics, clinical vitals, AI predictions, and attributions into PDF.
"""
from datetime import datetime, timezone
import logging
import os
from pathlib import Path
from typing import Any

from billiard.exceptions import SoftTimeLimitExceeded
from celery import shared_task
from django.conf import settings
from django.utils import timezone as django_timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from apps.reports.models import Report, ReportFormat, ReportStatus
from config.celery import BaseCDSSAsyncJob, broadcast_task_status

logger = logging.getLogger("celery.tasks.reports")


def _build_clinical_pdf(report: Report, output_path: Path) -> None:
    """Compile styled clinical summary PDF using ReportLab flowables."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
    )
    bold_body = ParagraphStyle(
        "ReportBodyBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
    )

    story = []

    # 1. Header & Hospital Branding
    story.append(Paragraph("CLINICAL DECISION SUPPORT SYSTEM", title_style))
    story.append(Paragraph("Automated Clinical Risk Assessment & Encounter Summary", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(
        Paragraph(
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | Report ID: {report.id}",
            subtitle_style,
        )
    )
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#3b82f6"), spaceAfter=14))

    # 2. Patient Demographics
    story.append(Paragraph("1. Patient Identification & Demographics", section_heading))
    patient = report.patient
    dob_str = str(patient.date_of_birth) if patient.date_of_birth else "Unknown"
    patient_data = [
        [
            Paragraph("<b>Full Name:</b>", body_style),
            Paragraph(f"{patient.first_name} {patient.last_name}", bold_body),
            Paragraph("<b>Medical Record Number (MRN):</b>", body_style),
            Paragraph(patient.mrn, bold_body),
        ],
        [
            Paragraph("<b>Date of Birth:</b>", body_style),
            Paragraph(dob_str, body_style),
            Paragraph("<b>Gender:</b>", body_style),
            Paragraph(str(patient.gender), body_style),
        ],
        [
            Paragraph("<b>Blood Group:</b>", body_style),
            Paragraph(str(patient.blood_group or "N/A"), body_style),
            Paragraph("<b>Attending Physician:</b>", body_style),
            Paragraph(str(patient.primary_physician or "Unassigned"), body_style),
        ],
    ]
    t_patient = Table(patient_data, colWidths=[110, 150, 140, 130])
    t_patient.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(t_patient)
    story.append(Spacer(1, 12))

    # 3. AI Risk Stratification & Prediction
    story.append(Paragraph("2. AI Risk Evaluation & Clinical Classification", section_heading))
    prediction = report.prediction

    if prediction:
        risk_level = prediction.prediction_result
        prob = float(prediction.probability) if prediction.probability is not None else 0.0
        confidence = float(prediction.confidence_score) if prediction.confidence_score is not None else (1.0 - prob if prob < 0.5 else prob)
        latency = float(prediction.inference_latency_ms) if prediction.inference_latency_ms is not None else 0.0

        # Risk badge color
        if risk_level == "CRITICAL":
            badge_bg = colors.HexColor("#fee2e2")
            badge_text_color = colors.HexColor("#991b1b")
        elif risk_level == "HIGH":
            badge_bg = colors.HexColor("#ffedd5")
            badge_text_color = colors.HexColor("#9a3412")
        elif risk_level == "MODERATE":
            badge_bg = colors.HexColor("#fef9c3")
            badge_text_color = colors.HexColor("#854d0e")
        else:
            badge_bg = colors.HexColor("#dcfce7")
            badge_text_color = colors.HexColor("#166534")

        risk_style = ParagraphStyle(
            "RiskBadge",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=badge_text_color,
        )

        pred_data = [
            [
                Paragraph("<b>Stratified Risk Level:</b>", body_style),
                Paragraph(f"<b>{risk_level}</b>", risk_style),
                Paragraph("<b>Risk Probability:</b>", body_style),
                Paragraph(f"<b>{prob:.1%}</b>", bold_body),
            ],
            [
                Paragraph("<b>Model Name:</b>", body_style),
                Paragraph(prediction.model_name or "Standard Ensemble", body_style),
                Paragraph("<b>Model Version:</b>", body_style),
                Paragraph(str(prediction.model_version_str or "1.0.0"), body_style),
            ],
            [
                Paragraph("<b>Confidence Score:</b>", body_style),
                Paragraph(f"{confidence:.2%}", body_style),
                Paragraph("<b>Inference Latency:</b>", body_style),
                Paragraph(f"{latency:.2f} ms", body_style),
            ],
        ]
        t_pred = Table(pred_data, colWidths=[130, 130, 130, 140])
        t_pred.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                    ("BACKGROUND", (1, 0), (1, 0), badge_bg),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(t_pred)

        # 4. Explainability Factors / Top Contributing Features
        explanation = getattr(prediction, "explanation", None)
        if explanation and getattr(explanation, "top_features", None):
            story.append(Spacer(1, 10))
            story.append(Paragraph("<b>Top Contributing Clinical Features (SHAP Attributions):</b>", section_heading))
            features = explanation.top_features if isinstance(explanation.top_features, list) else []
            feat_rows = [["Feature", "Attribution Weight", "Directional Impact"]]
            for f in features[:6]:
                fname = f.get("feature", "N/A")
                fweight = f.get("weight", f.get("attribution", 0.0))
                fimpact = "Elevates Risk" if fweight > 0 else "Protective"
                feat_rows.append([fname, f"{float(fweight):.4f}", fimpact])

            t_feat = Table(feat_rows, colWidths=[200, 150, 180])
            t_feat.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ]
                )
            )
            story.append(t_feat)
    else:
        story.append(Paragraph("<i>No specific prediction linked. General encounter summary.</i>", body_style))

    story.append(Spacer(1, 14))

    # 5. Clinical Encounter Vitals
    story.append(Paragraph("3. Most Recent Clinical Encounter Observations", section_heading))
    records = patient.clinical_records.order_by("-recorded_at")[:1]
    if records.exists():
        rec = records.first()
        vitals_data = [
            ["Observation", "Measured Value", "Standard Range", "Assessment"],
            ["Heart Rate", f"{rec.heart_rate or '--'} bpm", "60 – 100 bpm", "Normal" if rec.heart_rate and 60 <= rec.heart_rate <= 100 else "Flagged"],
            ["Systolic Blood Pressure", f"{rec.systolic_bp or '--'} mmHg", "90 – 120 mmHg", "Normal" if rec.systolic_bp and 90 <= rec.systolic_bp <= 120 else "Elevated"],
            ["Diastolic Blood Pressure", f"{rec.diastolic_bp or '--'} mmHg", "60 – 80 mmHg", "Normal" if rec.diastolic_bp and 60 <= rec.diastolic_bp <= 80 else "Elevated"],
            ["Respiratory Rate", f"{rec.respiratory_rate or '--'} /min", "12 – 20 /min", "Normal" if rec.respiratory_rate and 12 <= rec.respiratory_rate <= 20 else "Flagged"],
            ["Body Temperature", f"{rec.body_temperature or '--'} °C", "36.5 – 37.5 °C", "Normal" if rec.body_temperature and 36.5 <= rec.body_temperature <= 37.5 else "Febrile"],
            ["Oxygen Saturation (SpO2)", f"{rec.oxygen_saturation or '--'} %", "95 – 100 %", "Normal" if rec.oxygen_saturation and rec.oxygen_saturation >= 95 else "Hypoxic"],
        ]
        t_vitals = Table(vitals_data, colWidths=[160, 120, 130, 120])
        t_vitals.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(t_vitals)
    else:
        story.append(Paragraph("<i>No physiological observations recorded for this patient.</i>", body_style))

    story.append(Spacer(1, 20))

    # 6. Clinician Attestation & Review Block
    story.append(Paragraph("4. Clinician Review & Attestation", section_heading))
    story.append(
        Paragraph(
            "I hereby verify that I have reviewed the AI-assisted risk prediction alongside all relevant clinical findings. "
            "This decision support output is complementary and does not supersede independent physician clinical judgment.",
            body_style,
        )
    )
    story.append(Spacer(1, 18))
    sig_data = [
        [
            Paragraph("<b>Reviewing Clinician:</b> ___________________________", body_style),
            Paragraph("<b>Signature:</b> ___________________________", body_style),
            Paragraph("<b>Date:</b> _______________", body_style),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[180, 200, 150])
    t_sig.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(t_sig)

    doc.build(story)


@shared_task(
    bind=True,
    base=BaseCDSSAsyncJob,
    name="apps.reports.tasks.generate_pdf_report_task",
    time_limit=150,
    soft_time_limit=120,
    max_retries=2,
    default_retry_delay=5,
)
def generate_pdf_report_task(self, report_id: str, requested_by_id: str | None = None) -> dict[str, Any]:
    """
    Asynchronously compile and persist clinical PDF report for a patient.
    Enforces idempotency, handles soft time limits, and updates Report status.
    """
    logger.info("generate_pdf_report_task triggered: report_id=%s requested_by=%s", report_id, requested_by_id)

    # 1. Check idempotency lock
    lock_key = f"report_gen:{report_id}"
    if not self.acquire_idempotency_lock(lock_key, ttl_seconds=300):
        logger.warning("Report generation %s is already locked by another worker.", report_id)
        report = Report.objects.filter(id=report_id).first()
        if report and report.status == ReportStatus.COMPLETED:
            return {
                "status": "COMPLETED",
                "report_id": report_id,
                "file_path": report.file_path,
                "message": "Report already completed.",
            }

    try:
        report = Report.objects.select_related(
            "patient", "prediction", "prediction__explanation"
        ).get(id=report_id)

        # 2. Mark PROCESSING
        report.status = ReportStatus.PROCESSING
        report.save(update_fields=["status", "updated_at"])

        broadcast_task_status(
            task_id=self.request.id or str(report.id),
            task_name="generate_pdf_report",
            status="PROCESSING",
            progress=20,
            recipient_user_id=requested_by_id,
        )

        # 3. Compile PDF document
        media_root = Path(settings.MEDIA_ROOT)
        relative_path = Path("reports") / str(report.patient_id) / f"clinical_report_{report.id}.pdf"
        full_path = media_root / relative_path

        broadcast_task_status(
            task_id=self.request.id or str(report.id),
            task_name="generate_pdf_report",
            status="PROCESSING",
            progress=60,
            recipient_user_id=requested_by_id,
        )

        _build_clinical_pdf(report, full_path)

        file_size = full_path.stat().st_size

        # 4. Mark COMPLETED
        report.status = ReportStatus.COMPLETED
        report.file_path = str(full_path)
        report.file_size_bytes = file_size
        report.generated_at = django_timezone.now()
        report.save(update_fields=["status", "file_path", "file_size_bytes", "generated_at", "updated_at"])

        result_data = {
            "status": "COMPLETED",
            "report_id": str(report.id),
            "patient_id": str(report.patient_id),
            "file_path": str(full_path),
            "file_size_bytes": file_size,
            "download_url": f"/api/v1/reports/{report.id}/download/",
        }

        broadcast_task_status(
            task_id=self.request.id or str(report.id),
            task_name="generate_pdf_report",
            status="COMPLETED",
            progress=100,
            result=result_data,
            recipient_user_id=requested_by_id,
        )

        return result_data

    except SoftTimeLimitExceeded:
        logger.warning("Soft time limit exceeded while generating report %s", report_id)
        Report.objects.filter(id=report_id).update(status=ReportStatus.FAILED, updated_at=django_timezone.now())
        broadcast_task_status(
            task_id=self.request.id or str(report_id),
            task_name="generate_pdf_report",
            status="FAILED",
            error="Report generation exceeded time limit (120s).",
            recipient_user_id=requested_by_id,
        )
        raise

    except Exception as exc:
        logger.error("Failed to generate report %s: %s", report_id, exc, exc_info=True)
        Report.objects.filter(id=report_id).update(status=ReportStatus.FAILED, updated_at=django_timezone.now())
        broadcast_task_status(
            task_id=self.request.id or str(report_id),
            task_name="generate_pdf_report",
            status="FAILED",
            error=str(exc),
            recipient_user_id=requested_by_id,
        )
        raise self.retry(exc=exc)

    finally:
        self.release_idempotency_lock(lock_key)
