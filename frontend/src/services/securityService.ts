/**
 * Security Service — Strix DevSecOps + Agentic-Bug-Hunter integration API client.
 * Connects to /api/v1/security/ endpoints for targets, scans, findings, reports, tools,
 * health monitoring, and emergency kill-switch operations.
 */
import apiClient from "./apiClient";

export interface SecurityTarget {
  id: string;
  name: string;
  environment: "DEVELOPMENT" | "SECURITY_TEST" | "STAGING" | "PRODUCTION";
  target_type: string;
  hostname: string;
  port: number;
  protocol: string;
  scope: string;
  owner: string;
  approved_by?: string;
  approved_by_name?: string;
  approval_status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "REVOKED";
  approval_expires_at?: string;
  allowed_tests: string[];
  forbidden_tests: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecurityScan {
  id: string;
  target: string;
  target_name?: string;
  target_environment?: string;
  scan_type: string;
  scan_mode?: "QUICK_SECURITY_REVIEW" | "STANDARD_SECURITY_ASSESSMENT" | "DEEP_SECURITY_ASSESSMENT";
  status:
    | "CREATED"
    | "APPROVAL_PENDING"
    | "APPROVED"
    | "QUEUED"
    | "RUNNING"
    | "PAUSED"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "TIMED_OUT"
    | "BLOCKED";
  coverage_status?: "FULL" | "PARTIAL" | "INCONCLUSIVE" | "NOT_STARTED";
  strix_version?: string;
  budget_limit?: number;
  actual_cost?: number;
  sarif_artifact_path?: string;
  initiated_by?: string;
  initiated_by_name?: string;
  approved_by?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  max_requests: number;
  rate_limit_rps: number;
  timeout_seconds: number;
  tools_used: string[];
  findings_count?: number;
  created_at: string;
}

export interface SecurityFinding {
  id: string;
  scan?: string;
  target: string;
  target_name?: string;
  title: string;
  vulnerability_type: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  state:
    | "DISCOVERED"
    | "TRIAGED"
    | "VALIDATION_REQUIRED"
    | "VALIDATED"
    | "FALSE_POSITIVE"
    | "DUPLICATE"
    | "REMEDIATION_REQUIRED"
    | "IN_PROGRESS"
    | "FIXED"
    | "RETEST_REQUIRED"
    | "RESOLVED"
    | "ACCEPTED_RISK"
    | "REJECTED";
  confidence: number;
  fingerprint?: string;
  clinical_impact?: string;
  organizational_risk?: string;
  is_regression?: boolean;
  affected_component: string;
  affected_endpoint: string;
  description: string;
  impact: string;
  root_cause?: string;
  remediation_guidance: string;
  cwe_id?: string;
  cvss_score: number;
  discovered_by: string;
  assigned_to_name?: string;
  validated_at?: string;
  resolved_at?: string;
  created_at: string;
}

export interface SecurityMetrics {
  total_targets: number;
  approved_targets: number;
  total_scans: number;
  completed_scans: number;
  total_findings: number;
  validated_findings: number;
  resolved_findings: number;
  false_positives: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  has_executed_scans: boolean;
}

export interface SecurityHealth {
  kill_switch_active: boolean;
  security_scanning_enabled: boolean;
  strix: {
    available: boolean;
    version: string;
    status: "AVAILABLE" | "USING_FALLBACK_ADAPTER" | "UNAVAILABLE";
  };
  celery: {
    healthy: boolean;
    status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  };
  scans: {
    running: number;
    queued: number;
    last_completed_at: string | null;
    last_failed_at: string | null;
  };
  overall_status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
}

export const securityService = {
  // Targets
  getTargets: async (): Promise<SecurityTarget[]> => {
    const res = await apiClient.get<SecurityTarget[]>("/security/targets/");
    return Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
  },
  createTarget: async (data: Partial<SecurityTarget>): Promise<SecurityTarget> => {
    const res = await apiClient.post<SecurityTarget>("/security/targets/", data);
    return res.data;
  },
  approveTarget: async (id: string): Promise<SecurityTarget> => {
    const res = await apiClient.post<SecurityTarget>(`/security/targets/${id}/approve/`);
    return res.data;
  },

  // Scans
  getScans: async (): Promise<SecurityScan[]> => {
    const res = await apiClient.get<SecurityScan[]>("/security/scans/");
    return Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
  },
  getScan: async (id: string): Promise<SecurityScan> => {
    const res = await apiClient.get<SecurityScan>(`/security/scans/${id}/`);
    return res.data;
  },
  createScan: async (data: Partial<SecurityScan>): Promise<SecurityScan> => {
    const res = await apiClient.post<SecurityScan>("/security/scans/", data);
    return res.data;
  },
  startScan: async (id: string): Promise<SecurityScan> => {
    const res = await apiClient.post<SecurityScan>(`/security/scans/${id}/start/`);
    return res.data;
  },
  emergencyStop: async (id: string, reason: string): Promise<SecurityScan> => {
    const res = await apiClient.post<SecurityScan>(`/security/scans/${id}/emergency_stop/`, { reason });
    return res.data;
  },

  // Findings
  getFindings: async (): Promise<SecurityFinding[]> => {
    const res = await apiClient.get<SecurityFinding[]>("/security/findings/");
    return Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
  },
  getFinding: async (id: string): Promise<SecurityFinding> => {
    const res = await apiClient.get<SecurityFinding>(`/security/findings/${id}/`);
    return res.data;
  },
  validateGate: async (id: string, notes?: string): Promise<any> => {
    const res = await apiClient.post(`/security/findings/${id}/validate_gate/`, { notes });
    return res.data;
  },
  retestFinding: async (id: string): Promise<any> => {
    const res = await apiClient.post(`/security/findings/${id}/retest/`);
    return res.data;
  },

  // Tools
  getTools: async (): Promise<any> => {
    const res = await apiClient.get("/security/tools/");
    return res.data;
  },

  // Audit
  getAuditLogs: async (): Promise<any[]> => {
    const res = await apiClient.get<any[]>("/security/audit/");
    return Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
  },

  // Metrics — derived purely from authoritative DB records
  getMetrics: async (): Promise<SecurityMetrics> => {
    const res = await apiClient.get<SecurityMetrics>("/security/metrics/");
    return res.data;
  },

  // Platform health (Strix adapter, Celery, Redis, kill-switch)
  getHealth: async (): Promise<SecurityHealth> => {
    const res = await apiClient.get<SecurityHealth>("/security/health/");
    return res.data;
  },

  // Emergency kill-switch
  getKillSwitch: async (): Promise<{ kill_switch_active: boolean }> => {
    const res = await apiClient.get("/security/kill-switch/");
    return res.data;
  },
  toggleKillSwitch: async (action: "activate" | "deactivate", reason: string): Promise<any> => {
    const res = await apiClient.post("/security/kill-switch/", { action, reason });
    return res.data;
  },

  // Export artifacts (SARIF and Markdown)
  downloadSarif: async (scanId: string): Promise<Blob> => {
    const res = await apiClient.get(`/security/scans/${scanId}/sarif/`, {
      responseType: "blob",
    });
    return res.data;
  },
  downloadReport: async (scanId: string, format: "markdown" | "json" = "markdown"): Promise<Blob> => {
    const res = await apiClient.get(`/security/scans/${scanId}/export/?format=${format}`, {
      responseType: "blob",
    });
    return res.data;
  },
};
