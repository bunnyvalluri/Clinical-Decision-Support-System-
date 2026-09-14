/**
 * useWebSocket — typed React hook for WebSocket connections.
 *
 * Manages connection lifecycle, JWT authentication, auto-reconnect with exponential
 * backoff, heartbeat ping/pong keep-alive, and dispatches typed events.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WSEvent, WSEventType } from "@/types";
import { tokenStorage } from "@/services/apiClient";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000/ws";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler<T = any> = (payload: T) => void;
type HandlerMap = Partial<Record<WSEventType | string, EventHandler>>;

interface UseWebSocketOptions {
  /** WS path relative to WS_BASE_URL e.g. "dashboard/" */
  path: string;
  handlers: HandlerMap;
  /** Auto-reconnect on network disconnect? Default: true */
  autoReconnect?: boolean;
  /** Max reconnect attempts. Default: 5 */
  maxRetries?: number;
  /** Heartbeat interval in ms. Default: 25000 (25s) */
  heartbeatInterval?: number;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  retryCount: number;
}

export function useWebSocket({
  path,
  handlers,
  autoReconnect = true,
  maxRetries = 5,
  heartbeatInterval = 25000,
}: UseWebSocketOptions): WebSocketState {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    retryCount: 0,
  });

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "ping", type: "ping" }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, stopHeartbeat]);

  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const token = tokenStorage.getAccess();
    if (!token) {
      queueMicrotask(() => {
        if (isMounted) setState((s) => ({ ...s, error: "No auth token — cannot connect." }));
      });
      return;
    }

    queueMicrotask(() => {
      if (isMounted) setState((s) => ({ ...s, isConnecting: true, error: null }));
    });

    // Append token as query parameter (JWTAuthMiddleware validates it)
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    const url = `${WS_BASE_URL}/${normalizedPath}?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted) return;
      retryCountRef.current = 0;
      setState({ isConnected: true, isConnecting: false, error: null, retryCount: 0 });
      startHeartbeat();
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!isMounted) return;
      try {
        const message: WSEvent = JSON.parse(event.data as string);

        // Ignore pong responses in application handlers
        if (message.type === "pong" || message.event === "PONG") {
          return;
        }

        const payload = message.payload !== undefined ? message.payload : message;

        // Dispatch by message.type or message.event
        const handler =
          (message.type && handlersRef.current[message.type]) ||
          (message.event && handlersRef.current[message.event]);

        if (handler) {
          handler(payload);
        }
      } catch {
        console.error("[useWebSocket] Failed to parse message:", event.data);
      }
    };

    ws.onerror = () => {
      if (!isMounted) return;
      setState((s) => ({ ...s, error: "WebSocket connection error.", isConnecting: false }));
    };

    ws.onclose = (event: CloseEvent) => {
      stopHeartbeat();
      if (!isMounted) return;

      let errorMessage: string | null = null;
      let shouldRetry = autoReconnect;

      if (event.code === 4001) {
        errorMessage = "Authentication failed — invalid or expired JWT token.";
        shouldRetry = false;
      } else if (event.code === 4003) {
        errorMessage = "Unauthorized subscription — role permission denied.";
        shouldRetry = false;
      } else if (event.code !== 1000) {
        errorMessage = `Connection closed (code ${event.code})`;
      }

      setState((s) => ({
        ...s,
        isConnected: false,
        isConnecting: false,
        error: errorMessage,
      }));

      if (shouldRetry && retryCountRef.current < maxRetries) {
        // Exponential backoff with small random jitter
        const baseDelay = Math.min(1000 * 2 ** retryCountRef.current, 30000);
        const jitter = Math.random() * 500;
        const delay = baseDelay + jitter;
        retryCountRef.current += 1;
        setState((s) => ({ ...s, retryCount: retryCountRef.current }));

        retryTimerRef.current = setTimeout(() => {
          if (isMounted) {
            setReconnectTrigger((prev) => prev + 1);
          }
        }, delay);
      }
    };

    return () => {
      isMounted = false;
      stopHeartbeat();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      ws.close(1000, "Component unmounted");
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [path, autoReconnect, maxRetries, startHeartbeat, stopHeartbeat, reconnectTrigger]);

  return state;
}
