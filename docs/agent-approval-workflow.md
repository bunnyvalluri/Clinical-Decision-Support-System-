# Human-in-the-Loop Browser Agent Approval Workflow

## Overview
High-risk and critical browser operations must NEVER execute autonomously without human review.

```
Agent Proposes Action
        │
        ▼
Safety Gateway Classifies Risk (MEDIUM / HIGH / CRITICAL)
        │
   [HIGH / CRITICAL]
        │
        ▼
Task Enters AWAITING_APPROVAL State
        │
        ▼
Human Clinician / Admin Inspects in /admin/ai-agents:
  - Destination domain & URL
  - Natural language goal
  - Data classification & PHI status
  - Expected actions & verification rules
        │
   ┌────┴────────────────────────┐
   ▼                             ▼
[APPROVE]                    [REJECT]
   │                             │
Task execution launches      Task marked BLOCKED with
in Celery background         mandatory documented reason;
                             audited in Neon AuditLog.
```

### Reviewer Requirements
1. Reviewer must have `ADMIN` or `CLINICIAN` role privileges.
2. Rejection requires a mandatory documented reason.
3. Once approved or rejected, approval records are permanently immutably logged in Neon PostgreSQL.
