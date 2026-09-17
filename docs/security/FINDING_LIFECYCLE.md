# Finding Lifecycle & 7-Question Validation Gate

## Vulnerability State Machine
A security finding progresses through the following deterministic states:

```
[DISCOVERED] ──► [TRIAGED] ──► [VALIDATION_REQUIRED]
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
                 [FALSE_POSITIVE]              [VALIDATED]
                        or                           │
                    [REJECTED]                       ▼
                                           [REMEDIATION_REQUIRED]
                                                     │
                                                     ▼
                                               [IN_PROGRESS]
                                                     │
                                                     ▼
                                                  [FIXED]
                                                     │
                                                     ▼
                                             [RETEST_REQUIRED]
                                                     │
                                      ┌──────────────┴──────────────┐
                                      ▼                             ▼
                                 [RESOLVED]             [REMEDIATION_REQUIRED]
                               (Retest Passed)             (Retest Failed)
```

## The 7-Question Validation Gate
Preserving Agentic-Bug-Hunter's core principle, weak or theoretical findings are killed before reporting:

1. **Is the target authorized?** Target must exist in allowlist with active approval.
2. **Is the affected component actually vulnerable?** Verifies deterministic behavior rather than missing passive headers.
3. **Can the behavior be reproduced?** Requires concrete reproduction steps or automated PoC.
4. **Is the issue exploitable?** Evaluates if access controls or boundaries are genuinely bypassed.
5. **Is there meaningful security impact?** Impact to clinical data confidentiality, patient safety, or triage availability.
6. **Is the evidence sufficient?** Evidence traces must be captured and sanitized of PHI/secrets.
7. **Is the finding reportable?** Maps to valid CWE/CVE taxonomy under healthcare standards.
