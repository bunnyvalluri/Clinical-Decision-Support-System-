# User / Patient Portal Architecture & Integration Guide

## 1. Overview
The **User / Patient Portal** (`/user/...`) is the patient-facing workspace of the **PatientRisk Clinical Decision Support System (CDSS)**. It provides a secure, intuitive, and HIPAA-compliant environment for patients to monitor personal vitals telemetry, request AI-assisted non-autonomous risk assessments, review diagnostic predictions with explainability cards, manage clinical appointments, and communicate directly with their care team.

---

## 2. Design System & Aesthetics
- **Theme**: **100% Pure White / Light Theme Only**. Dark mode is explicitly forbidden to adhere to medical UI readability standards.
- **Palette**: Clean clinical slate background (`#f8fafc`), crisp white containers (`#ffffff`), subtle borders (`#e2e8f0`), and accessible teal/emerald accents for clinical stability (`#0d9488`, `#059669`).
- **Typography**: Clear tabular numerals for telemetry, high-contrast labels, and comprehensive ARIA accessibility tags.

---

## 3. Server-Side Identity Resolution & Zero-Trust RBAC
Arbitrary `patient_id` parameter passing from the client is strictly disallowed. The server-side identity resolver (`get_patient_from_request` in `apps/patient_portal/permissions.py`) authoritatively anchors the session to `request.user.patient_profile`:

```python
def get_patient_from_request(request):
    if hasattr(request.user, "patient_profile") and request.user.patient_profile is not None:
        return request.user.patient_profile
    return Patient.objects.filter(user=request.user).first()
```

### Security & Cross-Patient Isolation
1. Every query is filtered against `patient=get_patient_from_request(request)`.
2. Cross-patient resource requests return **HTTP 404 Not Found** (rather than 403) to prevent unauthorized enumeration of medical records.
3. Patients attempting to query clinician routes (e.g., `/api/v1/reviews/pending/` or `/api/v1/admin/`) are strictly denied with **HTTP 403 Forbidden**.

---

## 4. Frontend Route Architecture (`/user/...`)

| Route | Purpose | Features |
|---|---|---|
| `/user/dashboard` | Primary patient overview | Live vitals, latest ML prediction, upcoming appointment, task checklist |
| `/user/profile` | Patient demographics | Primary care physician, emergency contacts, insurance & MRN |
| `/user/medical-records` | Clinical records list | Lab reports, diagnostic evaluations, physician encounter summaries |
| `/user/medical-records/[recordId]` | Individual record viewer | Verified clinical summary, request correction workflow |
| `/user/medical-records/timeline` | Longitudinal history | Chronological filterable clinical history timeline |
| `/user/vitals` | Telemetry tracker | Current vital metrics, systolic vs diastolic validation modal |
| `/user/vitals/history` | Vital history log | Paginated historical vital observations |
| `/user/vitals/[vitalId]` | Individual vital detail | Physiological range validation status and source audit |
| `/user/risk-assessment` | Assessment history | List of completed patient symptom assessments |
| `/user/risk-assessment/new` | Multi-step assessment wizard | Live Celery/WebSocket progress tracker (Preparing -> Inference -> Complete) |
| `/user/risk-assessment/[assessmentId]` | Assessment inspection | Parameter inputs, triage score, physician review status |
| `/user/predictions` | ML predictions list | Patient-friendly risk explanations, SaMD clinical disclaimers |
| `/user/predictions/[predictionId]` | Prediction detail | 95% Confidence Interval, TreeSHAP feature influence cards |
| `/user/appointments` | Appointment management | Booking modal, upcoming & past clinical visits, cancellation |
| `/user/appointments/[appointmentId]` | Appointment detail | Care team provider details, preparation instructions, telehealth link |
| `/user/reports` | Clinical documents | Diagnostic summaries, discharge summaries, laboratory reports |
| `/user/reports/[reportId]` | Document viewer | PDF preview, download, verified physician signature |
| `/user/notifications` | Notifications stream | Real-time clinical alerts, appointment reminders, mark-as-read |
| `/user/messages` | Care team messaging | Active conversation threads with primary clinicians |
| `/user/messages/[conversationId]` | Interactive chat thread | Direct messaging with doctors and triage nurses |
| `/user/tasks` | Health care checklist | Interactive check-off tasks (medication adherence, vital logging) |
| `/user/health-summary` | Longitudinal summary | Verified active conditions, medications, allergies, baseline risk |
| `/user/consent` | Legal authorizations | HIPAA data exchange, AI risk scoring consent, revoke toggles |
| `/user/privacy` | HIPAA Right of Access | One-click Electronic Health Information (EHI) data export package |
| `/user/settings` | Portal preferences | Notification channels, font size accessibility, medical language |
| `/user/security` | Account credentials | 2FA multi-factor toggle, active session management, password updates |

---

## 5. Real-Time Telemetry & WebSocket Protocol
- **Endpoint**: `/ws/user/`
- **Consumer**: `channels_app.consumers.UserConsumer`
- **Security**: Authenticated users are bound strictly to their private channel groups:
  - `user_{user_id}`
  - `patient_{patient_id}`
- **Events**:
  - `user.risk_assessment.progress`: Real-time stage updates during async inference.
  - `user.risk_assessment.completed`: Notification when ensemble ML prediction is ready.
  - `user.message.received`: Real-time incoming clinical messages from care team.
  - `user.vital.verified`: Clinician validation of home-logged telemetry.

---

## 6. Software as a Medical Device (SaMD) Safety Controls
1. **Non-Autonomous CDSS**: Predictions generated through the patient portal are labeled as assistive and non-diagnostic. Every prediction card clearly displays:
   > *"This AI risk evaluation is for informational and clinical monitoring purposes and does not constitute an independent medical diagnosis. Please consult your physician regarding any changes to your care plan."*
2. **High-Risk Guardrails**: If an assessment evaluates to High Risk or Critical Risk, the backend automatically flags `requires_clinician_review = True` and dispatches an emergency triage task to the attending physician's clinical queue.
