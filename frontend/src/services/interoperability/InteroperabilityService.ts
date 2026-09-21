/**
 * Interoperability API Client Service — BPY-CSE-2666.
 * Connects directly to /api/v1/interoperability/ endpoints.
 */
import apiClient from "@/services/apiClient";
import type {
  FHIRImportJobItem,
  FHIRExportJobItem,
  FHIRMappingConflictItem,
  FHIRMappingVersionItem,
  FHIRProvenanceRecordItem,
  FHIRResourceBoundaryItem,
  IntegrationAuditEventItem,
  IntegrationConnectionItem,
  InteroperabilityDashboardMetrics,
  ResolutionAction,
  TerminologyMappingItem,
} from "./InteroperabilityTypes";

export const InteroperabilityService = {
  /**
   * Fetch real informaticist dashboard metrics (Section 21)
   */
  async fetchDashboardMetrics(): Promise<InteroperabilityDashboardMetrics> {
    const res = await apiClient.get<InteroperabilityDashboardMetrics>("/interoperability/dashboard/metrics/");
    return res.data;
  },

  /**
   * Fetch formal FHIR resource boundary matrix
   */
  async fetchBoundaryMatrix(): Promise<{ fhir_version: string; resources: FHIRResourceBoundaryItem[] }> {
    const res = await apiClient.get<{ fhir_version: string; resources: FHIRResourceBoundaryItem[] }>(
      "/interoperability/matrix/"
    );
    return res.data;
  },

  /**
   * Fetch registered integration connections
   */
  async fetchConnections(): Promise<{ count: number; results: IntegrationConnectionItem[] }> {
    const res = await apiClient.get<{ count: number; results: IntegrationConnectionItem[] }>(
      "/interoperability/connections/"
    );
    return res.data;
  },

  /**
   * Run active connectivity test and health check on a connection (Section 22)
   */
  async testConnection(id: string): Promise<{
    status: string;
    latency_ms?: number;
    fhir_version?: string;
    software?: string;
    error?: string;
  }> {
    const res = await apiClient.post(`/interoperability/connections/${id}/test_connection/`);
    return res.data;
  },

  /**
   * Fetch inbound import jobs
   */
  async fetchImportJobs(): Promise<{ count: number; results: FHIRImportJobItem[] }> {
    const res = await apiClient.get<{ count: number; results: FHIRImportJobItem[] }>("/interoperability/imports/");
    return res.data;
  },

  /**
   * Trigger an on-demand inbound sync/import
   */
  async triggerImport(connectionId: string, resources?: string[]): Promise<{ job_id: string; status: string; async: boolean }> {
    const res = await apiClient.post("/interoperability/imports/trigger/", {
      connection_id: connectionId,
      resources: resources || ["Patient", "Observation"],
    });
    return res.data;
  },

  /**
   * Fetch outbound export jobs
   */
  async fetchExportJobs(): Promise<{ count: number; results: FHIRExportJobItem[] }> {
    const res = await apiClient.get<{ count: number; results: FHIRExportJobItem[] }>("/interoperability/exports/");
    return res.data;
  },

  /**
   * Trigger an outbound export job
   */
  async triggerExport(connectionId: string, resourceType: string, patientId?: string): Promise<FHIRExportJobItem> {
    const res = await apiClient.post<FHIRExportJobItem>("/interoperability/exports/trigger/", {
      connection_id: connectionId,
      resource_type: resourceType,
      patient_id: patientId || null,
    });
    return res.data;
  },

  /**
   * Fetch human review queue conflicts (reconciliation)
   */
  async fetchConflicts(params?: { status?: string; conflict_type?: string }): Promise<{
    count: number;
    results: FHIRMappingConflictItem[];
  }> {
    const res = await apiClient.get<{ count: number; results: FHIRMappingConflictItem[] }>(
      "/interoperability/conflicts/",
      { params }
    );
    return res.data;
  },

  /**
   * Resolve a pending conflict with human decision
   */
  async resolveConflict(
    conflictId: string,
    action: ResolutionAction,
    resolutionNotes?: string
  ): Promise<FHIRMappingConflictItem> {
    const res = await apiClient.post<FHIRMappingConflictItem>(
      `/interoperability/conflicts/${conflictId}/resolve/`,
      {
        action,
        resolution_notes: resolutionNotes || "",
      }
    );
    return res.data;
  },

  /**
   * Fetch versioned clinical mappings
   */
  async fetchMappings(): Promise<{ count: number; results: FHIRMappingVersionItem[] }> {
    const res = await apiClient.get<{ count: number; results: FHIRMappingVersionItem[] }>("/interoperability/mappings/");
    return res.data;
  },

  /**
   * Fetch standard terminology mappings
   */
  async fetchTerminology(): Promise<{ count: number; results: TerminologyMappingItem[] }> {
    const res = await apiClient.get<{ count: number; results: TerminologyMappingItem[] }>(
      "/interoperability/terminology/"
    );
    return res.data;
  },

  /**
   * Fetch cryptographic provenance records
   */
  async fetchProvenance(): Promise<{ count: number; results: FHIRProvenanceRecordItem[] }> {
    const res = await apiClient.get<{ count: number; results: FHIRProvenanceRecordItem[] }>(
      "/interoperability/provenance/"
    );
    return res.data;
  },

  /**
   * Fetch immutable audit ledger
   */
  async fetchAuditEvents(params?: { action?: string; resource?: string; result?: string }): Promise<{
    count: number;
    results: IntegrationAuditEventItem[];
  }> {
    const res = await apiClient.get<{ count: number; results: IntegrationAuditEventItem[] }>(
      "/interoperability/audit/",
      { params }
    );
    return res.data;
  },
};
