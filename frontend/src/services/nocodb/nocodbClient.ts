/**
 * HTTP Client for NocoDB Healthcare Analytics & Workspace Integration.
 */
import apiClient from "@/services/apiClient";
import type {
  NocoDBDataset,
  NocoDBRowsResponse,
  NocoDBViewPreference,
  NocoDBAuditEvent,
  NocoDBHealthTelemetry,
  NocoDBMCPTool,
  NocoDBMCPExecutionResponse,
} from "./types";

export const nocodbClient = {
  /**
   * Fetch health status and telemetry of NocoDB auxiliary engine.
   */
  async getHealth(): Promise<NocoDBHealthTelemetry> {
    const res = await apiClient.get<NocoDBHealthTelemetry>("/nocodb/health/");
    return res.data;
  },

  /**
   * List all governed datasets accessible to the current user.
   */
  async listDatasets(): Promise<NocoDBDataset[]> {
    const res = await apiClient.get<NocoDBDataset[]>("/nocodb/datasets/");
    return res.data;
  },

  /**
   * Get detailed dataset metadata including schema columns.
   */
  async getDataset(slug: string): Promise<NocoDBDataset> {
    const res = await apiClient.get<NocoDBDataset>(`/nocodb/datasets/${slug}/`);
    return res.data;
  },

  /**
   * Query paginated, filtered rows from a dataset.
   */
  async getRows(
    slug: string,
    params: {
      page?: number;
      page_size?: number;
      sort?: string;
      search?: string;
      filters?: Record<string, string>;
    } = {}
  ): Promise<NocoDBRowsResponse> {
    const queryParams: Record<string, any> = {
      page: params.page || 1,
      page_size: params.page_size || 25,
    };
    if (params.sort) queryParams.sort = params.sort;
    if (params.search) queryParams.search = params.search;

    if (params.filters) {
      Object.entries(params.filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") {
          queryParams[`filter[${k}]`] = v;
        }
      });
    }

    const res = await apiClient.get<NocoDBRowsResponse>(`/nocodb/datasets/${slug}/rows/`, {
      params: queryParams,
    });
    return res.data;
  },

  /**
   * Insert a new record into an analytical dataset.
   */
  async insertRow(slug: string, data: Record<string, any>): Promise<{ success: boolean; record_id: string; data: any }> {
    const res = await apiClient.post(`/nocodb/datasets/${slug}/rows/`, data);
    return res.data;
  },

  /**
   * Mutate/update an existing row in a dataset.
   */
  async updateRow(
    slug: string,
    rowId: string,
    data: Record<string, any>
  ): Promise<{ success: boolean; record_id: string; data: any }> {
    const res = await apiClient.patch(`/nocodb/datasets/${slug}/rows/${rowId}/`, data);
    return res.data;
  },

  /**
   * Archive a row from a dataset.
   */
  async archiveRow(slug: string, rowId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete(`/nocodb/datasets/${slug}/rows/${rowId}/`);
    return res.data;
  },

  /**
   * Trigger on-demand projection sync from Neon PostgreSQL.
   */
  async triggerSync(): Promise<{ success: boolean; results: Record<string, number> }> {
    const res = await apiClient.post("/nocodb/sync/trigger/");
    return res.data;
  },

  /**
   * Download CSV export of a dataset with spreadsheet formula injection protection.
   */
  async exportCsv(slug: string): Promise<Blob> {
    const res = await apiClient.get(`/nocodb/datasets/${slug}/export/`, {
      responseType: "blob",
    });
    return res.data;
  },

  /**
   * Fetch immutable audit logs.
   */
  async getAuditLogs(limit: number = 50): Promise<NocoDBAuditEvent[]> {
    const res = await apiClient.get<NocoDBAuditEvent[]>("/nocodb/audit-logs/", {
      params: { limit },
    });
    return res.data;
  },

  /**
   * List available MCP tools.
   */
  async getMCPTools(): Promise<NocoDBMCPTool[]> {
    const res = await apiClient.get<{ tools: NocoDBMCPTool[] }>("/nocodb/mcp/execute/");
    return res.data.tools;
  },

  /**
   * Execute an allowlisted MCP tool call.
   */
  async executeMCPTool(
    tool: string,
    args: Record<string, any> = {},
    agent: string = "web_ui_agent"
  ): Promise<NocoDBMCPExecutionResponse> {
    const res = await apiClient.post<NocoDBMCPExecutionResponse>("/nocodb/mcp/execute/", {
      tool,
      arguments: args,
      agent,
    });
    return res.data;
  },

  /**
   * Get saved view preferences for a dataset.
   */
  async getViews(slug: string): Promise<NocoDBViewPreference[]> {
    const res = await apiClient.get<NocoDBViewPreference[]>(`/nocodb/datasets/${slug}/views/`);
    return res.data;
  },

  /**
   * Save a custom view preference for a dataset.
   */
  async saveView(slug: string, view: NocoDBViewPreference): Promise<NocoDBViewPreference> {
    const res = await apiClient.post<NocoDBViewPreference>(`/nocodb/datasets/${slug}/views/`, view);
    return res.data;
  },
};
