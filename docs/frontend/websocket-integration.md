# WebSocket Integration

Real-time bidirectional communication is managed by the custom `useWebSocket` hook located in `frontend/src/hooks/useWebSocket.ts`.

---

## 1. WebSocket Hook Lifecycle

```typescript
export function useWebSocket({
  path = "dashboard/",
  handlers = {},
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions)
```

### Connection Strategy
1. **Endpoint Resolution:** Derives WebSocket URL dynamically from `NEXT_PUBLIC_WS_URL` or window location (`ws://` vs `wss://`).
2. **Authentication Handshake:** Passes the active access JWT in the connection query parameters: `?token=<access_token>`.
3. **Heartbeat & Keepalive:** Sends periodic `ping` frames to keep edge proxies and Nginx tunnels alive.
4. **Exponential Backoff Reconnect:** In the event of network disconnection, the hook attempts reconnection with exponential backoff and jitter, transitioning UI state through `CONNECTING` -> `OPEN` -> `CLOSED`.
