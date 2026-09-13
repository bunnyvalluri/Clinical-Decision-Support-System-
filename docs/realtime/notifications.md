# Emergency Alert Distribution

When a patient is evaluated as `HIGH` or `CRITICAL` risk:
1. `PredictionService` automatically constructs a `Notification` record with severity `CRITICAL`.
2. Event is broadcast to the global `risk_alerts` channel group.
3. Frontends render an audio-visual alert banner and increment the unread triage counter.
