import apiClient from "@/services/apiClient";

export interface AgentApprovalDTO {
  id: string;
  execution: string;
  session?: string | null;
  requested_action: string;
  reason: string;
  affected_patient?: string | null;
  patient_mrn?: string | null;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "STANDARD" | "LOW";
  evidence_summary: Record<string, any>;
  action_payload: Record<string, any>;
  approving_role: string;
  status: "REQUESTED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  clinician_rationale?: string;
  created_at: string;
  expires_at: string;
}

export const approvalService = {
  async listApprovals(status: string = "REQUESTED"): Promise<AgentApprovalDTO[]> {
    const res = await apiClient.get<AgentApprovalDTO[]>("/ai/agents/approvals/", {
      params: { status },
    });
    return res.data;
  },

  async getApproval(approvalId: string): Promise<AgentApprovalDTO> {
    const res = await apiClient.get<AgentApprovalDTO>(`/ai/agents/approvals/${approvalId}/`);
    return res.data;
  },

  async decideApproval(
    approvalId: string,
    decision: "APPROVED" | "REJECTED",
    rationale?: string
  ): Promise<AgentApprovalDTO> {
    const res = await apiClient.post<AgentApprovalDTO>(
      `/ai/agents/approvals/${approvalId}/decide/`,
      {
        decision,
        rationale: rationale || "",
      }
    );
    return res.data;
  },
};

export default approvalService;
