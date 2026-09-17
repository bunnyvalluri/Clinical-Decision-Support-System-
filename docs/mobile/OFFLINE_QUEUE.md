# Offline Queue & Resilience Architecture

## 1. Local-First Offline Buffering
When an Android device experiences temporary network unavailability:
- Events passing local privacy classification enter `EncryptedEventQueue`.
- The queue is encrypted using Android Keystore keys and encrypted shared storage.
- Raw unredacted PHI or credentials are never enqueued.

## 2. Queue Limits & Auto-Pruning
To prevent unbounded storage or memory consumption:
- **Max Capacity**: 500 events. If exceeded, the oldest low-priority events are pruned.
- **TTL (Time-To-Live)**: 24 hours. Stale events exceeding the TTL are dropped automatically.
- **Deduplication**: Monitored via local `idempotencyKey` cache.

## 3. Online Reconnection Sync
Upon network restoration:
- Events are dispatched sequentially to `/api/v1/mobile/events/ingest/`.
- Django handles idempotent deduplication if an event was previously received.
