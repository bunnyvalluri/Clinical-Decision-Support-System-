import apiClient from "@/services/apiClient";

export interface InfrastructureServiceItem {
  name: string;
  type: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN" | string;
  latency_ms: number;
  endpoint: string;
  ssl: string;
}

export interface AdminHealthOverviewData {
  status: string;
  services: InfrastructureServiceItem[];
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  is_active: boolean;
  last_login?: string | null;
  created_at: string;
}

export interface AuditLogItem {
  id: string | number;
  user_email: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  description: string;
  timestamp: string;
}

export interface CeleryTelemetryData {
  worker_status: string;
  broker: string;
  active_tasks_count: number;
  processed_tasks_count: number;
  failed_tasks_count: number;
  queues: Array<{
    name: string;
    depth: number;
    routing_key: string;
  }>;
  recent_tasks: Array<{
    task_name: string;
    status: string;
    runtime: string;
    timestamp: string;
  }>;
}

export const adminApi = {
  getHealthOverview: async (): Promise<AdminHealthOverviewData | null> => {
    const res = await apiClient.get("/admin/health/");
    return res.data || null;
  },

  getUsers: async (): Promise<AdminUserItem[]> => {
    const res = await apiClient.get("/admin/users/");
    return res.data?.data || [];
  },

  getUserDetail: async (userId: string): Promise<AdminUserItem | null> => {
    const res = await apiClient.get(`/admin/users/${userId}/`);
    return res.data?.data || res.data || null;
  },

  toggleUserActive: async (userId: string): Promise<{ is_active: boolean; message: string }> => {
    const res = await apiClient.post(`/admin/users/${userId}/toggle-active/`);
    return res.data;
  },

  assignUserRole: async (userId: string, role: string): Promise<{ role: string; message: string }> => {
    const res = await apiClient.post(`/admin/users/${userId}/assign-role/`, { role });
    return res.data;
  },

  getAuditLogs: async (params?: { action?: string }): Promise<AuditLogItem[]> => {
    const res = await apiClient.get("/admin/audit-logs/", { params });
    return res.data?.data || [];
  },

  getCeleryStatus: async (): Promise<CeleryTelemetryData | null> => {
    const res = await apiClient.get("/admin/celery/");
    return res.data?.data || null;
  },
};
