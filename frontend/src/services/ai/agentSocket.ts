import { tokenStorage } from "@/services/apiClient";

export type AgentSocketEventType =
  | "step"
  | "plan"
  | "tool_call_started"
  | "tool_call_completed"
  | "tool_call_failed"
  | "approval_required"
  | "approval_resolved"
  | "completed"
  | "error";

export interface AgentSocketEvent {
  type: AgentSocketEventType;
  session_id: string;
  execution_id?: string;
  correlation_id?: string;
  data: Record<string, any>;
  timestamp: string;
}

export type AgentSocketListener = (event: AgentSocketEvent) => void;

export class AgentSocketClient {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private listeners: Set<AgentSocketListener> = new Set();
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  public connect(): void {
    if (typeof window === "undefined") return;
    this.isExplicitlyClosed = false;

    const token = tokenStorage.getAccess();
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    const url = `${wsProto}//${host}/ws/ai/agent/${this.sessionId}/${token ? `?token=${token}` : ""}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        // Connected to session channel
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed: AgentSocketEvent = JSON.parse(event.data);
          this.listeners.forEach((listener) => {
            try {
              listener(parsed);
            } catch (err) {
              console.error("[AgentSocket] listener error:", err);
            }
          });
        } catch (e) {
          // Non-JSON or raw message
        }
      };

      this.ws.onerror = (error) => {
        console.warn("[AgentSocket] WebSocket connection error:", error);
      };

      this.ws.onclose = () => {
        if (!this.isExplicitlyClosed) {
          // Reconnect with backoff
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.error("[AgentSocket] Failed to create WebSocket connection:", err);
    }
  }

  public subscribe(listener: AgentSocketListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public sendPing(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "ping", timestamp: new Date().toISOString() }));
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

export default AgentSocketClient;
