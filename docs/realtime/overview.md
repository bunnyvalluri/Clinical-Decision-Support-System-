# Real-Time Subsystem Overview

The real-time subsystem bridges the backend event bus with hospital browser workstations, pushing critical patient alerts with zero latency.

---

## 1. Technology Backbone

- **Engine:** Django Channels 4.1 running on Daphne ASGI.
- **Message Broker:** Redis 7 Channel Layer (`channels-redis`).
- **Client:** Native WebSockets managed by `useWebSocket` hook in Next.js.
