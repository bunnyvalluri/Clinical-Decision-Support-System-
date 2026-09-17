# Security Incident Handling & Emergency Halting

## Trigger Conditions
A security scan must halt immediately and trigger a `SECURITY_INCIDENT` alert under the following conditions:
1. Accidental discovery of unredacted production patient records or real PHI.
2. Discovery of active production credentials, private keys, or master tokens.
3. Unexpected connection to a live production database or unauthorized external system.
4. Detection of target instability, high error rates (> 50% 5xx errors), or denial-of-service symptoms.

## Escalation Workflow
1. **Immediate Halt**: Scan worker executes `SecurityOrchestrator.trigger_emergency_stop()`.
2. **Channel Broadcast**: Real-time high-priority alert emitted via Django Channels to security operations.
3. **Audit Immutability**: Incident details and environmental snapshots are permanently committed to `SecurityAuditEvent`.
4. **Zero Exploitation**: Automated tools do not proceed with lateral movement or deeper probing.
