import apiClient from "@/services/apiClient";

export interface InformaticsOverviewData {
  total_patients: number;
  total_predictions: number;
  total_clinical_records: number;
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  model_benchmarks: Array<{
    name: string;
    type: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    brier_score: number;
    latency_ms: number;
    status: string;
    calibration: string;
  }>;
}

export interface DataQualityData {
  total_records_analyzed: number;
  overall_integrity_score: number;
  duplicate_records: number;
  features: Array<{
    feature: string;
    complete_rate: number;
    missing_rate: number;
    valid_range: string;
    anomalies: number;
  }>;
}

export interface DriftData {
  overall_drift_status: string;
  last_evaluated_at: string;
  reference_dataset: string;
  production_window: string;
  thresholds: {
    warning_psi: number;
    critical_psi: number;
  };
  features: Array<{
    feature: string;
    psi: number;
    ks_pvalue: number;
    drift_status: string;
    description: string;
  }>;
}

export interface AIEvaluationData {
  grounding_rate: number;
  hallucination_rate: number;
  safety_guardrail_pass_rate: number;
  prompt_injection_defense_rate: number;
  tool_authorization_accuracy: number;
  avg_response_latency_ms: number;
  approved_knowledge_citations: string[];
  test_suite_status: string;
}

export const informaticistApi = {
  getOverview: async (): Promise<InformaticsOverviewData | null> => {
    const res = await apiClient.get("/models/informatics/overview/");
    return res.data?.data || null;
  },

  getDataQuality: async (): Promise<DataQualityData | null> => {
    const res = await apiClient.get("/models/informatics/data-quality/");
    return res.data?.data || null;
  },

  getDriftMetrics: async (): Promise<DriftData | null> => {
    const res = await apiClient.get("/models/informatics/drift/");
    return res.data?.data || null;
  },

  getAIEvaluation: async (): Promise<AIEvaluationData | null> => {
    const res = await apiClient.get("/models/informatics/ai-eval/");
    return res.data?.data || null;
  },

  getModelVersions: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/models/versions/");
    return res.data?.results || res.data?.data || res.data || [];
  },
};
