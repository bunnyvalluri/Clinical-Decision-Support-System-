# Real-Time WebSocket Client Guide

## Overview

The application utilizes Django Channels over WebSockets to support real-time clinical alerts, live telemetry, and instant notifications across all five user roles.

---

## 1. WebSocket Endpoints

| Endpoint | Channel Consumer | Target Role | Primary Events |
| :--- | :--- | :--- | :--- |
| `/ws/user/` | `UserConsumer` | `PATIENT` | Notification alerts, appointment updates, completed risk assessments |
| `/ws/clinical/` | `ClinicalConsumer` | `DOCTOR`, `NURSE` | New critical predictions, telemetry alerts, nurse queue updates |
| `/ws/admin/` | `AdminConsumer` | `IT_ADMIN`, `INFORMATICIST` | Service health telemetry, model drift alerts, pipeline logs |

---

## 2. Client Hook Implementation (`useUserWebSocket.ts`)

```typescript
import { useEffect, useRef, useState } from "react";

export interface UserWebSocketEvent {
  event_type: string;
  payload: Record<string, unknown>;
  timestamp?: string;
}

export function useUserWebSocket(onEvent?: (event: UserWebSocketEvent) => void) {
  const [status, setStatus] = useState<"connecting" | "connected" | "offline">("connecting");
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws"}/user/?token=${token || ""}`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => setStatus("connected");
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as UserWebSocketEvent;
          onEventRef.current?.(parsed);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };
      ws.onclose = () => {
        setStatus("offline");
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  return { status };
}
```

### Key Safety Architectural Patterns:
1. **`onEventRef` Storing**: Prevents WebSocket disconnection and recreation cycles when caller re-renders with inline callback functions.
2. **Backoff Reconnection**: Automatically re-establishes connection on temporary network dropouts without overwhelming backend ASGI workers.
3. **Type-Safe Payload Extraction**: Handlers validate payload properties before consumption.
