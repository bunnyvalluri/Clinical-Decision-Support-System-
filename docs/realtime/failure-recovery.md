# Real-Time Failure & Recovery Strategies

If a WebSocket connection is interrupted:
1. The frontend `useWebSocket` hook catches the `close` event.
2. Enters reconnect state with randomized exponential backoff ($interval \times 1.5^n$).
3. Upon successful reconnection, issues a REST query to `/api/v1/health/metrics/` and `/api/v1/predictions/` to synchronize any missed predictions.
