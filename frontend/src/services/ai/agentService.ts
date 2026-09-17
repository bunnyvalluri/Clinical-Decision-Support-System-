import apiClient from "@/services/apiClient";

export interface AgentDefinitionDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  allowed_roles: string[];
  allowed_tools: string[];
  security_level: string;
  max_iterations: number;
  max_tool_calls: number;
  timeout_seconds: number;
  enabled: boolean;
}

export interface AgentSessionDTO {
  id: string;
  agent_type: string;
  user: string;
  user_email?: string;
  role: string;
  patient?: string | null;
  patient_mrn?: string | null;
  status: string;
  provider: string;
  model: string;
  safety_status: string;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
}

export interface ToolTraceStep {
  tool_name: string;
  status: "AUTHORIZED" | "DENIED" | "COMPLETED" | "FAILED" | "REQUESTED";
  arguments?: Record<string, any>;
  output?: Record<string, any>;
  latency_ms?: number;
  error?: string;
  timestamp?: string;
}

export interface AgentExecutionDTO {
  id: string;
  session: string;
  request_id: string;
  correlation_id: string;
  user_query: string;
  status: "STARTED" | "PLANNING" | "ACTING" | "WAITING_APPROVAL" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMEOUT";
  iteration_count: number;
  tool_call_count: number;
  provider: string;
  model: string;
  error_code?: string;
  error_message?: string;
  latency_ms: number;
  started_at: string;
  completed_at?: string | null;
  final_output?: string;
  execution_trace?: ToolTraceStep[];
}

export interface AgentRunResponseDTO {
  session_id: string;
  execution_id: string;
  correlation_id: string;
  status: string;
  final_response: string;
  tool_calls_executed: number;
  iterations: number;
  latency_ms: number;
  provider: string;
  model: string;
  citations: Array<{
    title: string;
    organization?: string;
    doi_or_url?: string;
    evidence_level?: string;
    passage?: string;
  }>;
  safety_flags: string[];
  approval_required: boolean;
  approval_id?: string;
  pending_action?: string;
}

export interface AgentToolDefinitionDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  risk_level: string;
  allowed_roles: string[];
  patient_data_access: boolean;
  external_network_access: boolean;
  approval_required: boolean;
  enabled: boolean;
  timeout_seconds: number;
  rate_limit_per_minute: number;
}

export interface AgentEvaluationDTO {
  id: string;
  dataset_name: string;
  model_name: string;
  tool_selection_accuracy: number;
  safety_refusal_accuracy: number;
  hallucination_rate: number;
  citation_accuracy: number;
  latency_p95_ms: number;
  total_test_cases: number;
  passed_test_cases: number;
  created_at: string;
}

export const agentService = {
  async listDefinitions(): Promise<AgentDefinitionDTO[]> {
    const res = await apiClient.get<AgentDefinitionDTO[]>("/ai/agents/definitions/");
    return res.data;
  },

  async listTools(): Promise<AgentToolDefinitionDTO[]> {
    const res = await apiClient.get<AgentToolDefinitionDTO[]>("/ai/agents/tools/");
    return res.data;
  },

  async listSessions(patientId?: string): Promise<AgentSessionDTO[]> {
    const params = patientId ? { patient: patientId } : {};
    const res = await apiClient.get<AgentSessionDTO[]>("/ai/agents/sessions/", { params });
    return res.data;
  },

  async getSession(sessionId: string): Promise<AgentSessionDTO> {
    const res = await apiClient.get<AgentSessionDTO>(`/ai/agents/sessions/${sessionId}/`);
    return res.data;
  },

  async createSession(
    agentType: "DOCTOR" | "NURSE" | "PATIENT" | "INFORMATICIST" | "ADMIN" = "DOCTOR",
    patientId?: string,
    title?: string
  ): Promise<AgentSessionDTO> {
    const res = await apiClient.post<AgentSessionDTO>("/ai/agents/sessions/", {
      agent_type: agentType,
      patient: patientId || null,
      title: title || `${agentType} Consultation`,
    });
    return res.data;
  },

  async runAgent(
    sessionId: string,
    query: string,
    patientId?: string
  ): Promise<AgentRunResponseDTO> {
    const res = await apiClient.post<AgentRunResponseDTO>(
      `/ai/agents/sessions/${sessionId}/run/`,
      {
        query,
        patient_id: patientId || null,
      }
    );
    return res.data;
  },

  async getExecution(executionId: string): Promise<AgentExecutionDTO> {
    const res = await apiClient.get<AgentExecutionDTO>(`/ai/agents/executions/${executionId}/`);
    return res.data;
  },

  async cancelExecution(executionId: string): Promise<{ status: string }> {
    const res = await apiClient.post<{ status: string }>(
      `/ai/agents/executions/${executionId}/cancel/`
    );
    return res.data;
  },

  async submitFeedback(
    executionId: string,
    rating: "HELPFUL" | "INCORRECT" | "UNSAFE" | "IRRELEVANT" | "TOO_SLOW",
    comments?: string,
    score?: number
  ): Promise<{ status: string }> {
    const res = await apiClient.post<{ status: string }>("/ai/agents/feedback/", {
      execution: executionId,
      rating,
      comments: comments || "",
      score: score || 5,
    });
    return res.data;
  },

  async listEvaluations(): Promise<AgentEvaluationDTO[]> {
    const res = await apiClient.get<AgentEvaluationDTO[]>("/ai/agents/evaluations/");
    return res.data;
  },
};

export default agentService;
