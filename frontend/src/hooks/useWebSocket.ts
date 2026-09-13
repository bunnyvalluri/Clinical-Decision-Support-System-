/**
 * useWebSocket — typed React hook for WebSocket connections.
 *
 * Manages connection lifecycle, auto-reconnect with exponential backoff,
 * and dispatches typed events to registered handlers.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WSEvent, WSEventType } from "@/types";
import { tokenStorage } from "@/services/apiClient";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000/ws";

type EventHandler<T = unknown> = (payload: T) => void;
type HandlerMap = Partial<Record<WSEventType, EventHandler>>;

interface UseWebSocketOptions {
  /** WS path relative to WS_BASE_URL e.g. "dashboard/" */
  path: string;
  handlers: HandlerMap;
  /** Auto-reconnect on disconnect? Default: true */
  autoReconnect?: boolean;
  /** Max reconnect attempts. Default: 5 */
  maxRetries?: number;
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
}: UseWebSocketOptions): WebSocketState {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef(handlers);
  const connectRef = useRef<() => void>(() => {});

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    retryCount: 0,
  });

  const connect = useCallback(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      queueMicrotask(() => {
        setState((s) => ({ ...s, error: "No auth token — cannot connect." }));
      });
      return;
    }

    queueMicrotask(() => {
      setState((s) => ({ ...s, isConnecting: true, error: null }));
    });

    // Append token as query param (Channels JWT middleware reads it)
    const url = `${WS_BASE_URL}/${path}?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCountRef.current = 0;
      setState({ isConnected: true, isConnecting: false, error: null, retryCount: 0 });
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WSEvent = JSON.parse(event.data as string);
        const handler = handlersRef.current[message.type];
        if (handler) {
          handler(message.payload);
        }
      } catch {
        console.error("[useWebSocket] Failed to parse message:", event.data);
      }
    };

    ws.onerror = () => {
      setState((s) => ({ ...s, error: "WebSocket connection error.", isConnecting: false }));
    };

    ws.onclose = (event: CloseEvent) => {
      setState((s) => ({
        ...s,
        isConnected: false,
        isConnecting: false,
        error: event.code !== 1000 ? `Connection closed (code ${event.code})` : null,
      }));

      if (autoReconnect && event.code !== 4001 && retryCountRef.current < maxRetries) {
        const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000);
        retryCountRef.current += 1;
        setState((s) => ({ ...s, retryCount: retryCountRef.current }));
        retryTimerRef.current = setTimeout(() => {
          connectRef.current();
        }, delay);
      }
    };
  }, [path, autoReconnect, maxRetries]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      wsRef.current?.close(1000, "Component unmounted");
    };
  }, [connect]);

  return state;
}
