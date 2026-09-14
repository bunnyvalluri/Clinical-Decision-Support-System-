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
  payload: Record<string, unknown>;
}

export type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "offline";

export function useUserWebSocket(onEvent?: (event: UserRealtimeEvent) => void) {
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const [status, setStatus] = React.useState<ConnectionStatus>("offline");
  const [lastEvent, setLastEvent] = React.useState<UserRealtimeEvent | null>(null);
  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const onEventRef = React.useRef(onEvent);

  React.useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    let isMounted = true;

    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname;
        const port = "8000"; // Django ASGI backend
        const url = `${protocol}//${host}:${port}/ws/user/?token=${accessToken || ""}`;

        queueMicrotask(() => {
          if (isMounted) setStatus("connecting");
        });

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
            if (onEventRef.current) {
              onEventRef.current(data);
            }
          } catch (e) {
            console.error("Failed to parse WebSocket event:", e);
          }
        };

        socket.onerror = () => {
          if (!isMounted) return;
          setStatus("reconnecting");
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setStatus("reconnecting");
          // Reconnect with 3s backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, 3000);
        };
      } catch {
        if (isMounted) setStatus("offline");
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
