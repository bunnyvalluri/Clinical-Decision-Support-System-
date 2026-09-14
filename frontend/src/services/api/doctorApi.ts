import apiClient from "@/services/apiClient";

export interface DoctorSummaryData {
  assigned_patients_count: number;
  high_risk_alerts_count: number;
  pending_reviews_count: number;
  unread_notifications_count: number;
  escalations: Array<{
    id: string;
    patient_mrn: string;
    patient_name: string;
    reason: string;
    priority: string;
    escalated_by: string;
    created_at: string;
  }>;
  recent_predictions: Array<Record<string, unknown>>;
}

export interface PendingReviewCase {
  prediction_id: string;
  patient_mrn: string;
  patient_name: string;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  probability: number;
  model_name: string;
  model_version: string;
  prediction_timestamp: string;
  top_risk_factors?: Array<{ feature: string; impact: number; label: string; positive: boolean }>;
  features_snapshot?: Record<string, unknown>;
}

export const doctorApi = {
  getDoctorSummary: async (): Promise<DoctorSummaryData | null> => {
    const res = await apiClient.get("/predictions/doctor-summary/");
    return res.data?.data || null;
  },

  getPendingReviews: async (): Promise<PendingReviewCase[]> => {
    const res = await apiClient.get("/predictions/reviews/pending/");
    return res.data?.data || [];
  },

  submitReviewDecision: async (
    predictionId: string,
    payload: {
      decision: "CONCUR" | "OVERRIDE" | "MONITOR" | "TRANSFER" | string;
      status: "REVIEWED" | "REQUIRES_MORE_INFORMATION" | "ESCALATED" | string;
      rationale: string;
      override_risk_level?: string;
    }
  ): Promise<Record<string, unknown>> => {
    const res = await apiClient.post(`/predictions/reviews/${predictionId}/decision/`, payload);
    return res.data?.data || res.data;
  },

  queryAIAssistant: async (query: string, patientId?: string): Promise<{ response: string; guideline_reference?: string }> => {
    const res = await apiClient.post("/predictions/ai-assistant/", { query, patient_id: patientId });
    return res.data || { response: "AI service response unavailable." };
  },

  getPatients: async (params?: { search?: string; page?: number }): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/patients/", { params });
    return res.data?.results || res.data?.data || res.data || [];
  },

  getPatientDetail: async (patientId: string): Promise<Record<string, unknown> | null> => {
    const res = await apiClient.get(`/patients/${patientId}/`);
    return res.data?.data || res.data || null;
  },

  getPredictions: async (params?: { patient_id?: string }): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/predictions/records/", { params });
    return res.data?.results || res.data?.data || res.data || [];
  },

  getPredictionDetail: async (predictionId: string): Promise<Record<string, unknown> | null> => {
    const res = await apiClient.get(`/predictions/records/${predictionId}/`);
    return res.data?.data || res.data || null;
  },
};
