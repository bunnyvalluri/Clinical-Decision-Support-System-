# PocketBase Real-time vs Django Channels

## Distinction Between Real-time Channels

| Attribute | Primary Clinical Real-time | PocketBase Real-time |
| :--- | :--- | :--- |
| **Protocol** | WebSockets (`ws://`, `wss://`) | Server-Sent Events (SSE) (`http://`, `https://`) |
| **Backend Engine**| Django Channels + Redis | PocketBase Go SSE Hub |
| **Data Scope** | Patient vitals, code alerts, ML outputs | UI announcements, system alerts |
| **Security** | JWT-authenticated WebSocket connection | PocketBase collection API rules |
| **Failure Impact**| Failover to HTTP polling for vitals | Graceful silence / fallback banner |

## Lifecycle Management
All PocketBase SSE subscriptions in Next.js must strictly adhere to the subscription lifecycle:
1. `subscribe()` on component mount or feature activation.
2. `receive()` event payload with schema validation.
3. `update()` local React state.
4. `unsubscribe()` in the React `useEffect` cleanup return callback to prevent memory leaks and dangling SSE connections.
