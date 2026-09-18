# Google Jules API Security & Compliance Architecture

## Security Boundary & Threat Model

The Google Jules integration into HealthNova AI adheres to the strict security controls of HIPAA, SOC 2, and high-assurance healthcare operations.

### Threat Model Matrix

| Threat | Mitigation Mechanism | Verification |
|---|---|---|
| **PHI / PII Exfiltration to Cloud LLM** | `SensitiveDataSanitizer` redacts MRNs, names, SSNs, and clinical patterns before any payload is sent to `jules.googleapis.com`. | Tested in `test_sensitive_data_sanitizer_removes_keys` |
| **API Key Leakage in Client Bundles** | `JULES_API_KEY` is loaded only in Django settings (`JulesSettings`). Frontend never touches the key or calls Google directly. | Tested in `tests/julesAutomation.test.mjs` |
| **Unauthorized Branch Destruction** | `JulesPolicyEngine` blocks protected branches (`main`, `master`, `production`, `release/*`). Work must target `jules/*` or feature branches. | Tested in `test_protected_branch_rejection` |
| **Autonomous Model / Diagnostic Logic Tampering** | Path policies strictly block Jules from modifying `ml/`, `models/clinical_*`, `apps/risk_scoring/`. | Tested in `test_path_policy_enforcement` |
| **Adversarial Webhook Forgery** | Webhook endpoint requires SHA256 HMAC signature verification (`X-Hub-Signature-256` or `X-Jules-Signature`). | Tested in `test_webhook_hmac_verification` |
| **Runaway API Execution / Denial of Wallet** | Rate limiting (max 10 concurrent sessions), budget caps, and `JulesCircuitBreaker` (opens after 5 failures). | Tested in `test_circuit_breaker_transition` |
| **Privilege Escalation via Automation UI** | DRF viewsets enforce `IsAuthenticated` and `IsJulesAdmin` (user must have role `IT_ADMIN` or `ADMIN`). | Tested in `test_role_guard_rejection` |

---

## Sanitization Rules

The `SensitiveDataSanitizer` in `backend/integrations/jules/sanitizer.py` implements regex scanners and string replacements for:
1. **API Keys & Passwords**:
   - Matches standard AWS, GitHub, Google API keys (`AIza[0-9A-Za-z-_]{35}`), Stripe, JWTs.
2. **Healthcare Identifiers (Synthetic & Real)**:
   - Matches MRN patterns (`MRN-[0-9]{6,10}`), SSNs (`\d{3}-\d{2}-\d{4}`), and email addresses.
3. **Internal Network Infrastructure**:
   - Redacts internal PostgreSQL connection strings and passwords.

---

## Dual-Custody Approval Protocol

For any remediation job that modifies sensitive subsystems:
1. When Jules finishes creating a plan, the job status changes to `PLAN_PENDING_APPROVAL`.
2. A WebSocket event is broadcast to the IT Admin dashboard.
3. The IT Admin reviews the proposed patch diff, impacted files, and audit notes in the UI.
4. Only upon explicit button click with optional rationale does the backend issue the execute instruction to Jules.
5. All approvals are logged with approver ID, email, IP address, and timestamp in Neon PostgreSQL.
