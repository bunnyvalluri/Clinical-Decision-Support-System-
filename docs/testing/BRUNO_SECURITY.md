# Bruno Security & Privacy Architecture — HealthNova AI CDSS

> **Compliance**: HIPAA Security Rule § 164.312, GDPR Art. 32, SOC 2 Type II  
> **Classification**: Security Standard

---

## 1. Safe Mode Sandboxing Default

Beginning with Bruno CLI v3.0.0 and continuing in v4.x, **Safe Mode** is the default execution sandbox (`--sandbox=safe`).

Under Safe Mode:
1. **No Filesystem Access**: Scripts cannot read or write to arbitrary host disk paths.
2. **No Child Processes**: Scripts cannot spawn shell commands or external binaries.
3. **No External NPM Packages**: Collections cannot load unreviewed third-party npm modules dynamically.
4. **Isolated Memory**: JavaScript executes inside a restricted V8 context.

Developer mode (`--sandbox=developer`) is strictly forbidden in automated CI runners.

---

## 2. Zero PHI (Protected Health Information) Policy

All Bruno collection files committed to Git must use synthetic identifiers:
- **Synthetic MRNs**: Prefixed with `SYNTH-` or `TEST-` (e.g. `TEST-MRN-001`).
- **Synthetic Names**: Demonstrative placeholder names (e.g., `Alex Demo`, `Jordan Test`).
- **Synthetic Contact Info**: RFC 2606 reserved domains (`@example.com`, `@healthnova.test`) and reserved telephone prefixes (`555-0100` to `555-0199`).
- **Synthetic Clinical Data**: Plausible but fictional physiological readings clearly demarcated with metadata flag `"is_synthetic": true`.

Automated pre-commit hooks and CI scanners scan `.bru` files for real SSNs, credit cards, and unredacted phone patterns.

---

## 3. Secret Management & Redaction

1. **No Committed Credentials**: `.bru` files use variable interpolations (`{{doctor_access_token}}`) rather than literal keys or hashes.
2. **Environment Secrets**: Sensitive files named `*.secret.bru` and `.env*` are explicitly excluded in `.gitignore`.
3. **Report Redaction**: The CI runner script (`scripts/run_bruno_tests.py`) scrubs `Authorization`, `Cookie`, `X-Master-Key`, and JWT tokens from output traces before persisting reports.

---

## 4. 5-Role RBAC & IDOR Matrix

The Bruno security suite executes automated authorization matrices across all 5 personas:

| Domain / Action | Doctor | Nurse | Informaticist | IT Admin | Patient |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Patient Demographics (All)** | ✅ Authorized | ✅ Authorized | ⚠️ De-identified | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **Own Medical Records** | N/A | N/A | N/A | N/A | ✅ Authorized (Own Only) |
| **Other Patient Records (IDOR)** | ❌ Blocked (403) | ❌ Blocked (403) | ❌ Blocked (403) | ❌ Blocked (403) | ❌ Blocked (403/404) |
| **Enter Vital Signs** | ✅ Authorized | ✅ Authorized | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **Execute ML Risk Prediction** | ✅ Authorized | ⚠️ Triage Only | ✅ Test Sandbox | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **Model Registry Governance** | 👁️ View Only | ❌ Forbidden (403) | ✅ Authorized | ✅ Config Only | ❌ Forbidden (403) |
| **Search (Meilisearch)** | ✅ Clinical Scope | ✅ Triage Scope | ✅ Models/Analytics | ⚠️ System/Audit Only | ✅ Self Scope Only |
| **NocoDB Datasets** | 👁️ Read Export | ❌ Forbidden (403) | ✅ Full Analytics | ✅ Admin Config | ❌ Forbidden (403) |
| **IT System Audit Logs** | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) | ✅ Full Access | ❌ Forbidden (403) |
