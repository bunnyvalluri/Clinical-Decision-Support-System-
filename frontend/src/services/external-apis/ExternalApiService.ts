import apiClient from "@/services/apiClient";
import type {
  ExternalAPIRegistryItem,
  ExternalEnvelope,
  ExternalDrugInformation,
  ExternalProviderInformation,
  ExternalNutritionInformation,
  ExternalAPIHealthCheck,
  ExternalAPIAuditLogItem,
} from "./ExternalApiTypes";

export const ExternalApiService = {
  /**
   * Fetch approved/registered external APIs
   */
  async fetchRegistry(params?: { status?: string; category?: string }): Promise<{ count: number; results: ExternalAPIRegistryItem[] }> {
    const res = await apiClient.get("/external-apis/registry/", { params });
    return res.data;
  },

  /**
   * Search openFDA drug adverse reactions & labels through secure gateway
   */
  async searchDrugs(drugName: string): Promise<ExternalEnvelope<ExternalDrugInformation>> {
    const res = await apiClient.get<ExternalEnvelope<ExternalDrugInformation>>("/external-apis/drugs/search/", {
      params: { drug_name: drugName },
    });
    return res.data;
  },

  /**
   * Lookup healthcare provider in NPPES NPI Registry
   */
  async lookupProvider(params: { npi?: string; first_name?: string; last_name?: string }): Promise<ExternalEnvelope<ExternalProviderInformation>> {
    const res = await apiClient.get<ExternalEnvelope<ExternalProviderInformation>>("/external-apis/providers/lookup/", {
      params,
    });
    return res.data;
  },

  /**
   * Search USDA nutritional profiles
   */
  async searchNutrition(query: string): Promise<ExternalEnvelope<ExternalNutritionInformation>> {
    const res = await apiClient.get<ExternalEnvelope<ExternalNutritionInformation>>("/external-apis/nutrition/search/", {
      params: { query },
    });
    return res.data;
  },

  /**
   * Fetch historical health check telemetry
   */
  async fetchHealthChecks(): Promise<{ count: number; results: ExternalAPIHealthCheck[] }> {
    const res = await apiClient.get("/external-apis/health/");
    return res.data;
  },

  /**
   * Trigger immediate health check probe run
   */
  async triggerHealthProbe(): Promise<{ status: string; probes: any[] }> {
    const res = await apiClient.post("/external-apis/health/");
    return res.data;
  },

  /**
   * Fetch approval history
   */
  async fetchApprovals(): Promise<{ count: number; results: any[] }> {
    const res = await apiClient.get("/external-apis/approvals/");
    return res.data;
  },

  /**
   * Submit human review decision for an external API stage
   */
  async submitApproval(payload: { api_id: string; stage: string; decision: string; notes?: string }): Promise<any> {
    const res = await apiClient.post("/external-apis/approvals/", payload);
    return res.data;
  },

  /**
   * Privileged audit log viewer
   */
  async fetchAuditLogs(): Promise<{ count: number; results: ExternalAPIAuditLogItem[] }> {
    const res = await apiClient.get("/external-apis/audit/");
    return res.data;
  },

  /**
   * Circuit breaker status inspection
   */
  async fetchCircuitBreaker(): Promise<{ circuit_states: Record<string, string> }> {
    const res = await apiClient.get("/external-apis/circuit-breaker/");
    return res.data;
  },

  /**
   * Reset provider circuit breaker
   */
  async resetCircuitBreaker(provider: string): Promise<{ detail: string }> {
    const res = await apiClient.post("/external-apis/circuit-breaker/", { provider });
    return res.data;
  },
};
