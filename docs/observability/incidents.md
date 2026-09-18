# Incident Management System

## 1. Incident Lifecycle States
HealthNova AI tracks real incidents through a deterministic state machine:
```
[ DETECTED ] ──(Triage)──> [ ACKNOWLEDGED ] ──(Assign)──> [ INVESTIGATING ]
                                                                   │
                                                               (Mitigate)
                                                                   ▼
[ POSTMORTEM ] <──(Review)── [ RESOLVED ] <──(Deploy fix)── [ MITIGATING ]
```

## 2. Severity Definitions
- **`SEV1_CRITICAL`**: Complete clinical service outage, Neon DB partition, or active security breach. Response SLA: < 15 minutes.
- **`SEV2_HIGH`**: Degraded clinical inference, Celery worker stall, or elevated 5xx error rate (> 5%). Response SLA: < 30 minutes.
- **`SEV3_MEDIUM`**: Non-critical background task failure, search index latency, or minor UI degradation. Response SLA: < 4 hours.
- **`SEV4_LOW`**: Minor telemetry anomaly, non-blocking cosmetic issue. Response SLA: Next business day.

## 3. Incident Audit & Resolution
Every transition records:
- Transition timestamp (UTC).
- Actor identifier and role.
- State change message.
- Root cause notes and resolution summary upon entering `RESOLVED` and `POSTMORTEM`.
