# ADR-004: SmsForwarder Healthcare Mobile Event Gateway Integration

## Context & Problem Statement
The clinical decision support system (**BPY-CSE-2666**) requires secure ingestion of mobile telephony events, two-factor alerts, and ambient system notifications from patient and clinical Android devices. The open-source project **pppscn/SmsForwarder** provides an Android listener architecture (`BroadcastReceiver`, `NotificationListenerService`, and forwarding workers). However, in its default form, SmsForwarder acts as an unconstrained message broadcaster with arbitrary webhook targets and no data-classification boundaries. In a HIPAA/GDPR-regulated healthcare environment, unrestricted forwarding of Protected Health Information (PHI), One-Time Passwords (OTPs), or authentication credentials represents an unacceptable compliance and security risk.

## Decision
We integrate the core listener and normalization architecture of **pppscn/SmsForwarder** by re-architecting it as a **Zero-Trust, Policy-Governed Healthcare Mobile Event Gateway**:

1. **Authoritative Backend**: **Neon PostgreSQL** remains the sole authoritative source of truth. Redis acts as a high-speed cache, token-bucket rate limiter, and anti-replay nonce store. Celery handles asynchronous destination dispatch.
2. **Local-First Zero-Trust Pipeline**: Android devices execute local privacy classification (`PrivacyClassifier`), OTP blocking (`OtpBlocker`), credential masking (`SecretDetector`), and PHI redaction prior to network transmission.
3. **Default-Deny Forwarding**: No forwarding destination or rule is active by default. New destinations require cryptographic validation (HTTPS, certificate verification, HMAC request signing, SSRF IP blocking) and explicit IT Administrator sign-off.
4. **Five-Role Separation of Duties**:
   - **Patients**: Can view, register, and revoke only their own devices.
   - **Doctors & Nurses**: Strictly forbidden from personal device surveillance (no access to raw patient SMS, call logs, or notifications).
   - **Medical Informaticists**: Restricted to aggregate volume, delivery latency, and data-quality metrics.
   - **IT Administrators**: Manage device inventory, destination allowlists, and the Emergency Kill Switch.
5. **Cryptographic Device Integrity**: Hardware-backed Android Keystore manages device signing keys. Every API request requires an HMAC-SHA256 signature, millisecond timestamp (max ±300s skew), and unique nonce to prevent replay attacks.
6. **Ruflo & Agentic AI Safeguards**: Mobile event text is treated as untrusted data. SMS content cannot override agent instructions (prompt injection mitigation). AI agents cannot autonomously authorize forwarding destinations or exfiltrate PHI.
7. **Emergency Kill Switch**: Admins can immediately halt forwarding across Global, Destination, Device, Rule, or User scopes without purging immutable audit records.

## Consequences
- **Positive**: High reliability of native Android event interception paired with defense-in-depth healthcare data protection.
- **Positive**: Zero raw PHI or credentials stored unredacted in database or agent vector memories.
- **Positive**: Complete compliance with least-privilege principles and separation of duties.
- **Trade-off**: Requires administrative approval workflow before any new mobile notification channel or destination becomes active.
