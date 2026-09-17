# Production Release Gates & Governance — HealthNova AI CDSS

## 1. Automated Release Gate Checklist

Before any production deployment is triggered via Coolify, all 5 mandatory gates must pass:

```
[ GATE 1: CI BUILD & UNIT TESTS ]
├── Backend pytest suite passes (100% pass, zero regressions)
└── Frontend tests pass (npm test, tsc --noEmit)
        ↓
[ GATE 2: API CONTRACT VERIFICATION ]
├── Bruno contract test suite passes (bru run --env Test --sandbox=safe)
└── 5-Role RBAC & IDOR matrices validated
        ↓
[ GATE 3: FRONTEND QUALITY AUDIT ]
└── React Doctor audit passes without blocking issues
        ↓
[ GATE 4: SECURITY & SECRET SCANNING ]
├── Zero hardcoded secrets, JWTs, or private keys in repository
└── Container vulnerability scan (Trivy / Snyk) reports no critical CVEs
        ↓
[ GATE 5: CLINICIAN / IT ADMIN HUMAN SIGN-OFF ]
└── Authenticated IT Admin confirms production release in dashboard
```

---

## 2. Release Auditing & Traceability

Every production release record stores:
- **`commit_sha`**: Exact Git commit SHA being deployed.
- **`coolify_deployment_id`**: Upstream deployment identifier.
- **`actor`**: Authenticated IT Admin user triggering the release.
- **`correlation_id`**: Unique tracing token linking build logs, deployment events, and audit records.
