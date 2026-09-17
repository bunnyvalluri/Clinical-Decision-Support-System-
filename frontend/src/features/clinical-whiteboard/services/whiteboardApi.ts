import axios from "axios";
import {
  ClinicalWhiteboard,
  WhiteboardDocument,
  WhiteboardShare,
  WhiteboardComment,
  AIDiagramResponse,
} from "../types/whiteboard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const client = axios.create({
  baseURL: `${API_BASE}/api/v1/whiteboards`,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const headers = getAuthHeaders();
  if (headers.Authorization) {
    config.headers.Authorization = headers.Authorization;
  }
  return config;
});

export const whiteboardApi = {
  async list(params?: {
    type?: string;
    classification?: string;
    status?: string;
    patient_id?: string;
    search?: string;
  }): Promise<ClinicalWhiteboard[]> {
    const res = await client.get<ClinicalWhiteboard[]>("/", { params });
    // Handle paginated responses or direct array
    return Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
  },

  async get(id: string): Promise<ClinicalWhiteboard> {
    const res = await client.get<ClinicalWhiteboard>(`/${id}/`);
    return res.data;
  },

  async create(data: {
    title: string;
    description?: string;
    type?: string;
    classification?: string;
    patient_id?: string | null;
    tags?: string[];
    metadata?: Record<string, any>;
    initial_elements?: any[];
  }): Promise<ClinicalWhiteboard> {
    const res = await client.post<ClinicalWhiteboard>("/", data);
    return res.data;
  },

  async update(id: string, data: Partial<ClinicalWhiteboard>): Promise<ClinicalWhiteboard> {
    const res = await client.patch<ClinicalWhiteboard>(`/${id}/`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await client.delete(`/${id}/`);
  },

  async getDocument(id: string): Promise<WhiteboardDocument> {
    const res = await client.get<WhiteboardDocument>(`/${id}/document/`);
    return res.data;
  },

  async saveDocument(
    id: string,
    payload: {
      elements: any[];
      appState?: Record<string, any>;
      files?: Record<string, any>;
      is_checkpoint?: boolean;
      checkpoint_summary?: string;
      thumbnail_data?: string;
    }
  ): Promise<{ saved: boolean; version_number: number; content_hash: string; updated_at: string }> {
    const res = await client.put(`/${id}/document/`, payload);
    return res.data;
  },

  async getVersions(id: string): Promise<WhiteboardDocument[]> {
    const res = await client.get<WhiteboardDocument[]>(`/${id}/versions/`);
    return Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
  },

  async restoreVersion(
    id: string,
    target_version: number,
    reason?: string
  ): Promise<{ restored: boolean; current_version: number; document: WhiteboardDocument }> {
    const res = await client.post(`/${id}/restore/`, { target_version, reason });
    return res.data;
  },

  async review(
    id: string,
    action: "SUBMIT" | "APPROVE" | "REQUEST_CHANGES" | "ARCHIVE",
    notes?: string
  ): Promise<ClinicalWhiteboard> {
    const res = await client.post<ClinicalWhiteboard>(`/${id}/review/`, { action, notes });
    return res.data;
  },

  async generateAIDiagram(
    id: string,
    prompt: string,
    category: "SEPSIS" | "CARDIAC" | "TRIAGE" | "GENERAL" = "GENERAL"
  ): Promise<AIDiagramResponse> {
    const res = await client.post<AIDiagramResponse>(`/${id}/ai_generate/`, { prompt, category });
    return res.data;
  },

  async getShares(id: string): Promise<WhiteboardShare[]> {
    const res = await client.get<WhiteboardShare[]>(`/${id}/shares/`);
    return Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
  },

  async createShare(
    id: string,
    payload: {
      target_role?: string;
      target_user_id?: string | null;
      allow_edit?: boolean;
      expires_in_hours?: number;
    }
  ): Promise<WhiteboardShare> {
    const res = await client.post<WhiteboardShare>(`/${id}/shares/`, payload);
    return res.data;
  },

  async revokeShare(id: string, share_id: string): Promise<void> {
    await client.post(`/${id}/revoke-share/`, { share_id });
  },

  async getComments(id: string): Promise<WhiteboardComment[]> {
    const res = await client.get<WhiteboardComment[]>(`/${id}/comments/`);
    return Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
  },

  async addComment(id: string, text: string, element_id?: string): Promise<WhiteboardComment> {
    const res = await client.post<WhiteboardComment>(`/${id}/comments/`, { text, element_id });
    return res.data;
  },

  async auditExport(id: string, format: "JSON" | "SVG" | "PNG"): Promise<void> {
    await client.post(`/${id}/export-audit/`, { format });
  },
};
