/**
 * Google Jules API Service (Frontend Client)
 * Strictly communicates with HealthNova AI's authenticated Django backend endpoints.
 * Never connects directly to jules.googleapis.com from the browser.
 */

import {
  JulesSource,
  JulesSession,
  JulesActivity,
  JulesRemediationJob,
  JulesApproval,
  JulesHealthResponse,
  JulesSettings,
  CreateRemediationPayload,
} from "@/types/jules";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Jules API request failed with status ${res.status}`;
    try {
      const data = await res.json();
      errorMsg = data.message || data.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const julesApi = {
  // Health & Settings
  async getHealth(): Promise<JulesHealthResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/health/`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return handleResponse<JulesHealthResponse>(res);
  },

  async getSettings(): Promise<JulesSettings> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/settings/`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return handleResponse<JulesSettings>(res);
  },

  // Sources
  async listSources(): Promise<JulesSource[]> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/sources/`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return handleResponse<JulesSource[]>(res);
  },

  async syncSources(): Promise<JulesSource[]> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/sources/sync/`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<JulesSource[]>(res);
  },

  // Remediations
  async listRemediations(): Promise<JulesRemediationJob[]> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/remediations/`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return handleResponse<JulesRemediationJob[]>(res);
  },

  async getRemediation(id: string): Promise<JulesRemediationJob> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/remediations/${id}/`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return handleResponse<JulesRemediationJob>(res);
  },

  async createRemediation(payload: CreateRemediationPayload): Promise<JulesRemediationJob> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/remediations/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<JulesRemediationJob>(res);
  },

  async approveRemediation(id: string, reason?: string): Promise<JulesApproval> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/remediations/${id}/approve/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason: reason || "Approved via IT Admin Dashboard" }),
    });
    return handleResponse<JulesApproval>(res);
  },

  async cancelRemediation(id: string): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/remediations/${id}/cancel/`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<{ status: string }>(res);
  },

  async decideApproval(id: string, approved: boolean, reason?: string): Promise<JulesApproval> {
    if (approved) {
      return this.approveRemediation(id, reason);
    } else {
      await this.cancelRemediation(id);
      return {
        id: "",
        remediation_job: id,
        approval_type: "PLAN_APPROVAL",
        requested_by: null,
        approved_by: null,
        status: "REJECTED",
        reason: reason || "Rejected",
        expires_at: null,
        created_at: new Date().toISOString(),
      };
    }
  },

  // Sessions
  async listSessions(): Promise<JulesSession[]> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/sessions/`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return handleResponse<JulesSession[]>(res);
  },

  async createSession(sourceId: string, prompt: string, title?: string): Promise<JulesSession> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/sessions/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ source_id: sourceId, prompt, title }),
    });
    return handleResponse<JulesSession>(res);
  },

  async getSession(id: string): Promise<JulesSession> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/sessions/${id}/`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return handleResponse<JulesSession>(res);
  },

  async sendMessage(sessionId: string, message: string): Promise<JulesActivity> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/sessions/${sessionId}/message/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    return handleResponse<JulesActivity>(res);
  },

  async getSessionActivities(sessionId: string): Promise<JulesActivity[]> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/sessions/${sessionId}/activities/`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return handleResponse<JulesActivity[]>(res);
  },

  // Activity stream
  async listGlobalActivity(limit = 50): Promise<JulesActivity[]> {
    const res = await fetch(`${BASE_URL}/api/v1/automation/jules/activity/?limit=${limit}`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return handleResponse<JulesActivity[]>(res);
  },

  // WebSocket Live Updates
  createJulesWebSocket(
    onMessage: (data: any) => void,
    onError?: (err: Event) => void
  ): WebSocket | null {
    if (typeof window === "undefined") return null;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws/automation/jules/`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("Failed to parse Jules WS message", err);
      }
    };
    if (onError) ws.onerror = onError;
    return ws;
  },
};

