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
  const retryCountRef = React.useRef(0);
  const onEventRef = React.useRef(onEvent);

  React.useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  React.useEffect(() => {
    if (!isAuthenticated || !user || !accessToken) {
      setStatus("offline");
      return () => {};
    }

    let isMounted = true;
    let retryTimer: NodeJS.Timeout | null = null;
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const port = "8000"; // Django ASGI backend
    const url = `${protocol}//${host}:${port}/ws/user/?token=${accessToken || ""}`;

    const connect = () => {
      if (!isMounted) return;
      if (retryCountRef.current >= 3) {
        setStatus("offline");
        return;
      }

      try {
        const socket = new WebSocket(url);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          retryCountRef.current = 0;
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
          setStatus("offline");
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setStatus("offline");
          if (retryCountRef.current < 3) {
            retryCountRef.current += 1;
            retryTimer = setTimeout(connect, 10000);
          }
        };
      } catch {
        if (isMounted) setStatus("offline");
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, accessToken]);

  return { status, lastEvent };
}

