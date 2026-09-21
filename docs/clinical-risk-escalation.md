# Clinical Risk Escalation & Rule-Triggered Workflows

## Escalation Triggers
HealthNova AI couples deterministic clinical rules with ML risk transitions to trigger proactive clinical alerts and escalations.

### 1. Risk Transition Triggers
- **Tier Elevation**: Any transition from `LOW` or `MEDIUM` to `HIGH` or `CRITICAL`.
- **Velocity Threshold**: An increase in predicted risk probability $> 0.35$ within a 24-hour window.

### 2. Deterministic Rule Triggers
- **qSOFA $\ge 2$**: Respiratory rate $\ge 22$, altered mentation (GCS $< 15$), systolic BP $\le 100$ mmHg.
- **Hypertensive Crisis**: Systolic BP $\ge 180$ mmHg or Diastolic BP $\ge 120$ mmHg.
- **Hypoxemic Respiratory Distress**: SpO2 $< 90\%$ on ambient air.

---

## Escalation Cascade & Notification

```
[RISK ESCALATION DETECTED]
           │
           ├──────────────────────────────┐
           ▼                              ▼
  [ClinicalAlert Created]       [Escalation Created]
  Status: ACTIVE                Target Role: DOCTOR / ICU
  Severity: CRITICAL            Status: PENDING
           │                              │
           ├──────────────────────────────┘
           ▼
[WebSocket Broadcast] ──► Nurse Station Alert + Attending Pager Notification
           │
           ▼
[PatientTimelineEvent] ──► Event Type: ESCALATION (Logged immutably)
```

---

## Escalation Actions & Resolution

Attending physicians or charge nurses resolve escalations via:
- `POST /api/v1/clinical/escalations/{id}/acknowledge/`
- `POST /api/v1/clinical/escalations/{id}/resolve/` (with mandatory clinical intervention notes)
