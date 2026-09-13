# Real-Time Architecture

The real-time infrastructure enables instantaneous bidirectional communication between hospital workstations and the backend decision-support engine.

---

## 1. Components & Communication Flow

1. **Protocol:** Standard WebSockets (`ws://` in local development, `wss://` in production via TLS termination).
2. **ASGI Server:** Daphne manages concurrent async event loops, terminating WebSocket connections without blocking HTTP threads.
3. **Channel Layer (Redis):** Operates as a distributed publish/subscribe message bus. When a worker on one container generates a prediction, it publishes to the `dashboard` group in Redis, and Daphne distributes the payload to all connected sockets.
4. **Multiplexed Topics:**
   - `dashboard`: High-level aggregate risk counters, telemetry, and system announcements.
   - `risk_alerts`: Emergency alerts for patients categorized as `HIGH` or `CRITICAL` risk.
   - `patient_{id}`: Targeted patient vitals and prediction telemetry stream.
   - `tasks_{user_id}`: Private channel for tracking long-running Celery background task progress.
