"use client";

import * as React from "react";
import { useAuthStore } from "@/features/auth/authStore";

export interface UserRealtimeEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  payload: any;
}

export type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "offline";

export function useUserWebSocket(onEvent?: (event: UserRealtimeEvent) => void) {
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const [status, setStatus] = React.useState<ConnectionStatus>("offline");
  const [lastEvent, setLastEvent] = React.useState<UserRealtimeEvent | null>(null);
  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      setStatus("offline");
      return;
    }

    let isMounted = true;

    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname;
        const port = "8000"; // Django ASGI backend
        const url = `${protocol}//${host}:${port}/ws/user/?token=${accessToken || ""}`;

        setStatus("connecting");
        const socket = new WebSocket(url);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          setStatus("connected");
        };

        socket.onmessage = (msgEvent) => {
          if (!isMounted) return;
          try {
            const data: UserRealtimeEvent = JSON.parse(msgEvent.data);
            setLastEvent(data);
            if (onEvent) {
              onEvent(data);
            }
          } catch (e) {
            console.error("Failed to parse WebSocket event:", e);
          }
        };

        socket.onerror = () => {
          if (!isMounted) return;
          setStatus("reconnecting");
        };

        socket.onclose = (e) => {
          if (!isMounted) return;
          setStatus("reconnecting");
          // Reconnect with 3s backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, 3000);
        };
      } catch (err) {
        setStatus("offline");
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, user, accessToken]);

  return { status, lastEvent };
}
