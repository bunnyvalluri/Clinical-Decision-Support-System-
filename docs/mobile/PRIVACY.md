# Privacy & PHI Protection Specification

## 1. Healthcare Data Taxonomy
Every mobile event is classified locally on Android and verified on Django:
- **`PUBLIC`**: System-wide announcements, non-sensitive public broadcasts.
- **`LOW_SENSITIVITY`**: Battery level, Wi-Fi connectivity, sync timestamps, heartbeat pings.
- **`SENSITIVE`**: Calendar reminders, operational notices.
- **`PHI`**: Protected Health Information (MRNs, diagnosis codes, prescription details, vitals).
- **`OTP`**: One-Time Passwords, 2FA verification codes, login tokens. Default: **BLOCK**.
- **`AUTHENTICATION_SECRET`**: API keys, private keys, bearer tokens, JWTs, passwords. Default: **BLOCK**.
- **`FINANCIAL`**: Credit card numbers, CVVs, IBANs. Default: **BLOCK**.
- **`UNKNOWN`**: Any payload not meeting positive allowlist rules. Default: **DO NOT FORWARD**.

## 2. Default-Deny Architecture
If an incoming event cannot be positively classified into an approved category, or if no approved active forwarding rule matches it, the event is immediately assigned `ProcessingStatus.BLOCKED`.

## 3. Redaction & In-Place Sanitization
Before any event record is committed to PostgreSQL or transmitted via Celery, redactors replace sensitive sub-strings with token markers:
- `Your code is 492015` ➔ `Your code is [REDACTED_OTP]`
- `Patient MRN-88412 admitted for chemotherapy` ➔ `Patient [REDACTED_PHI] admitted for [REDACTED_PHI]`
- `api_key=sk-9f8a7b6c5d4e3f2a` ➔ `api_key=[REDACTED_SECRET]`

## 4. Zero Cloud SMS Database
The healthcare server does not maintain an offsite clone of the patient's SMS inbox. Only approved events meeting deterministic criteria are ingested.
