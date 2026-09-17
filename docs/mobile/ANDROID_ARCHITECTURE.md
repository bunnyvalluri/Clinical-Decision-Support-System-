# Android Architecture: HealthNova Mobile Gateway

## 1. Architectural Layers
The Android module resides in `android/` and is structured into six clean architectural tiers:

```
android/app/src/main/kotlin/com/healthnova/gateway/
├── domain/model/         # Domain entities (MobileEvent, DataClassification, ForwardingRule, ProcessingStatus)
├── receiver/             # Telephony BroadcastReceivers (SmsReceiver, CallReceiver)
├── service/              # NotificationListenerService
├── normalization/        # EventNormalizer
├── privacy/              # PrivacyClassifier, OTP/Secret detection, PHI redaction
├── engine/               # LocalRuleEngine (declarative, priority conflict resolution)
├── security/             # KeystoreManager, RequestSigner (HMAC-SHA256, Nonce generation)
├── queue/                # EncryptedEventQueue (bounded capacity, TTL auto-pruning)
└── network/              # GatewayApiClient (HTTPS with TLS verification)
```

## 2. Telephony & Notification Components
- **`SmsReceiver`**: Subscribed to `android.provider.Telephony.SMS_RECEIVED`. Protected by Android system-level `android.permission.BROADCAST_SMS` permission to prevent unauthorized broadcast injection.
- **`CallReceiver`**: Listens for telephony state changes (`PHONE_STATE`). Captures minimal caller metadata only; strictly prohibits voice recording.
- **`NotificationListenerService`**: Intercepts Android status bar notifications. Uses an approved package allowlist (`APPROVED_PACKAGES`) to ignore unauthorized third-party apps.

## 3. Battery & Background Execution Optimization
- **Event-Driven Execution**: No wake locks, polling loops, or continuous background foreground timers.
- **WorkManager & Coroutines**: Event processing is dispatched onto background I/O coroutines (`Dispatchers.IO`) to avoid any main-thread UI jank.
- **Bounded Local Queue**: High watermark of 500 events and 24-hour TTL prevents persistent storage leaks.
