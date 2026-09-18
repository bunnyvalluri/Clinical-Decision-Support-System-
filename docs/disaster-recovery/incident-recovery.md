# HealthNova AI CDSS — Incident Management & Disaster Recovery Integration

## 1. Unified Incident State Machine

HealthNova AI tracks all disaster recovery events through the deterministic state machine established in Prompt 60:

```
[ DETECTED ] ──(SRE Triage)──> [ ACKNOWLEDGED ] ──(Isolate)──> [ CONTAINED ]
                                                                     │
                                                                 (Recover)
                                                                     ▼
[ POSTMORTEM ] <──(Audit)─── [ RESOLVED ] <──(14 Probes)─── [ RECOVERING ]
```

---

## 2. Severity Classification for Disaster Recovery

- **`SEV1_CRITICAL`**: Complete Neon database unreachable, cluster partition, or active security credential breach. SRE Response SLA: < 15 minutes.
- **`SEV2_HIGH`**: ML model inference outage, Celery queue failure (> 50 queued), or elevated 5xx error rate (> 5%). Response SLA: < 30 minutes.
- **`SEV3_MEDIUM`**: Meilisearch search latency, Redis cache degradation, or non-blocking background task failure. Response SLA: < 4 hours.
- **`SEV4_LOW`**: Minor telemetry discrepancy or delayed non-urgent export. Response SLA: Next business day.

---

## 3. Mandatory Disaster Recovery Audit Actions

Every disaster recovery transition records an immutable, append-only `AuditLog` entry:

| Event Action | Trigger Condition | Mandatory Metadata |
| :--- | :--- | :--- |
| `backup.created` | Completion of Neon branch snapshot or logical export | Backup ID, storage URI, SHA-256 checksum, size bytes |
| `backup.validated` | Verification probe confirms archive readability & hash | Backup ID, validation probe results, timestamp |
| `backup.failed` | Export process terminates with non-zero exit code | Error message, target destination, correlation ID |
| `restore.started` | Operator initiates PITR branch promotion or dump restore | Target timestamp, branch name, authorized actor |
| `restore.completed` | 14-Point restoration checklist passes | Duration seconds, verification status, actor |
| `restore.failed` | Any restoration check fails | Failed criteria list, error trace, correlation ID |
| `rollback.started` | Revert dispatched for app, worker, or model | Current commit/version, target commit/version, reason |
| `rollback.completed` | Rollback confirmed healthy | New active version, compatibility status, actor |
| `rollback.failed` | Revert failed or was aborted by guard | Error description, correlation ID |
| `recovery.started` | Service enters recovering state | Service name, incident ID, target recovery steps |
| `recovery.completed` | Subsystem successfully recovered and verified | Actions taken list, recovery duration |
| `secret.rotated` | Emergency credential rotation executed | Secret name, incident ticket ID, rotation timestamp |
