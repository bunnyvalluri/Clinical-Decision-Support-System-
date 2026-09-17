# Security Testing Architecture & Boundaries

## Architectural Isolation

### 1. Process Separation
The security engine executes exclusively via dedicated Celery workers attached to the `security_scans` queue. Scans are bounded by:
- Maximum execution time: 300 seconds (soft limit: 270s).
- Maximum request rate: 5 requests per second (default).
- Maximum request volume: 100 requests per scan.
- Immediate kill-switch via `SecurityOrchestrator.trigger_emergency_stop()`.

### 2. Network & Target Boundary
- Targets are registered in `SecurityTarget` with specific hostname, port, and regex scope.
- Scans are restricted to `SECURITY_TEST`, `DEVELOPMENT`, and authorized `STAGING` environments.
- `PRODUCTION` is disabled by default and requires physical dual-authorization.
- External internet scanning is completely forbidden by system-level invariants.

### 3. Data Separation
Security data models are strictly quarantined in the `apps.security_testing` schema:
- `SecurityTarget`: Registry of authorized attack surfaces.
- `SecurityScan`: Lifecycle tracking of audit executions.
- `SecurityFinding`: Validated vulnerability entries.
- `SecurityEvidence`: Sanitized payloads with SHA-256 integrity verification.
- `SecurityValidation`: 7-question audit ledger.
- `SecurityReport`: Human-signed compliance artifacts.
- `SecurityAuditEvent`: Immutable audit trails.
