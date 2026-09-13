# Frontend Architecture

The frontend is built using **Next.js 16 App Router** and **React 19**, designed to deliver an institutional-grade, zero-latency clinical user experience.

---

## 1. Architectural Strategy

- **Server-Side Rendering (SSR) for Static Assets:** Public landing pages, sign-in screens, and legal documentation are statically prerendered at build time for instant loading.
- **Client-Side Hydration (CSR) for Active Telemetry:** Authenticated clinician portals run as reactive Single Page Applications (SPAs), maintaining persistent WebSocket connections to the ASGI backend.
- **Strict State Management with Zustand:** State is partitioned into domain-specific stores:
  - `authStore`: Manages user credentials, JWT rotation, and role switching.
  - `clinicalStore`: Manages live patient vitals, stream predictions, task progress, and unread emergency alerts.

---

## 2. Real-Time Telemetry Flow

```
[WebSocket Message Received]
            │
            ▼
   [useWebSocket Hook]
            │
            ▼
  [Event Router Callback]
            │
            ▼
[clinicalStore.handleWebSocketPrediction()]
            │
    ┌───────┴────────┐
    ▼                ▼
[Update Dashboard] [Update Activity Stream]  (No Page Reload)
```

When a prediction is generated anywhere in the hospital, the ASGI consumer pushes the event over WebSockets. The `useWebSocket` hook catches the message and triggers an optimistic state update in `clinicalStore`, immediately updating the dashboard metrics, risk distribution counters, and activity feed without requiring a page reload.
