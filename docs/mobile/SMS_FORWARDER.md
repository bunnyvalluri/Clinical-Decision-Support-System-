# SmsForwarder Integration Guide

## 1. Overview & Upstream Reference
This module integrates the core event listening and rule matching capabilities of **pppscn/SmsForwarder** (v3.x Kotlin branch) into the **HealthNova AI Clinical Decision Support System** (Project: BPY-CSE-2666).

- **Upstream Repository**: https://github.com/pppscn/SmsForwarder.git
- **Upstream License**: BSD 3-Clause License with specific usage and disclaimer terms.
- **License Compliance**: Original copyright notices and BSD disclaimer are preserved. The software is used exclusively as an authorized healthcare gateway.

## 2. Transformation into a Healthcare Gateway
In SmsForwarder's standalone mode, users configure unrestricted webhooks and email forwarders. In HealthNova AI:
- **No Direct Arbitrary Webhooks**: All external calls route through Django and Celery after multi-stage zero-trust security checks.
- **Default-Deny Policy**: Rules, destinations, and devices default to disabled.
- **Strict Data Classification**: Events are categorized (PUBLIC, LOW_SENSITIVITY, SENSITIVE, PHI, OTP, AUTHENTICATION_SECRET, FINANCIAL, UNKNOWN).
- **Tamper-Evident Auditing**: Original raw contents are hashed via SHA-256 for audit verification, while stored texts are sanitized and redacted.

## 3. High-Level Flow
```
Android Device (SmsReceiver / CallReceiver / NotificationListenerService)
      │
      ▼
Local Normalization (EventNormalizer)
      │
      ▼
Local Privacy Classifier (PrivacyClassifier: OTP block, PHI redaction, Secret filter)
      │
      ▼
Local Rule Engine (LocalRuleEngine: Declarative policy evaluation)
      │
      ▼
Hardware Keystore Signing (RequestSigner: HMAC-SHA256, Nonce, Timestamp)
      │
      ▼
Django Mobile Gateway API (/api/v1/mobile/events/ingest/)
      │
      ├── Neon PostgreSQL (Authoritative Store)
      ├── Redis (Rate-Limiter, Nonce Cache, Channels)
      └── Celery Async Delivery ──► Verified Destinations
```
