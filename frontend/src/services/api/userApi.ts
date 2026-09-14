import apiClient from "@/services/apiClient";

export interface PatientProfileData {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  primary_physician_name?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
}

export interface UserDashboardData {
  patient: PatientProfileData;
  latest_vitals?: Record<string, unknown>;
  latest_prediction?: Record<string, unknown>;
  upcoming_appointment?: Record<string, unknown>;
  pending_tasks?: Array<Record<string, unknown>>;
  recent_notifications?: Array<Record<string, unknown>>;
  unread_notifications_count?: number;
}

export const userApi = {
  getDashboard: async (): Promise<UserDashboardData | null> => {
    const res = await apiClient.get("/user/dashboard/");
    return res.data?.data || res.data || null;
  },

  getProfile: async (): Promise<PatientProfileData | null> => {
    const res = await apiClient.get("/user/profile/");
    return res.data?.data || res.data || null;
  },

  updateProfile: async (data: Partial<PatientProfileData>): Promise<PatientProfileData> => {
    const res = await apiClient.put("/user/profile/", data);
    return res.data?.data || res.data;
  },

  getVitals: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/user/vitals/");
    return res.data?.data || res.data || [];
  },

  logVital: async (vital: { systolic_bp: number; diastolic_bp: number; heart_rate: number; oxygen_saturation: number }): Promise<Record<string, unknown>> => {
    const res = await apiClient.post("/user/vitals/", vital);
    return res.data?.data || res.data;
  },

  getMedicalRecords: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/user/medical-records/");
    return res.data?.data || res.data || [];
  },

  getMedicalRecordDetail: async (id: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.get(`/user/medical-records/${id}/`);
    return res.data?.data || res.data;
  },

  getPredictions: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/user/predictions/");
    return res.data?.data || res.data || [];
  },

  getPredictionDetail: async (id: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.get(`/user/predictions/${id}/`);
    return res.data?.data || res.data;
  },

  getAppointments: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/user/appointments/");
    return res.data?.data || res.data || [];
  },

  bookAppointment: async (data: { department: string; scheduled_time: string; reason_for_visit?: string }): Promise<Record<string, unknown>> => {
    const res = await apiClient.post("/user/appointments/", data);
    return res.data?.data || res.data;
  },

  cancelAppointment: async (id: string): Promise<void> => {
    await apiClient.patch(`/user/appointments/${id}/`, { status: "CANCELLED" });
  },

  getMessages: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/user/messages/");
    return res.data?.data || res.data || [];
  },

  getConversationDetail: async (id: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.get(`/user/messages/${id}/`);
    return res.data?.data || res.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.post(`/user/messages/${conversationId}/`, { content });
    return res.data?.data || res.data;
  },

  startConversation: async (subject: string, message: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.post("/user/messages/", { subject, message });
    return res.data?.data || res.data;
  },

  getTasks: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/user/tasks/");
    return res.data?.data || res.data || [];
  },

  completeTask: async (id: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.post(`/user/tasks/${id}/complete/`);
    return res.data?.data || res.data;
  },

  getReports: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/user/reports/");
    return res.data?.data || res.data || [];
  },

  getReportDetail: async (id: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.get(`/user/reports/${id}/`);
    return res.data?.data || res.data;
  },

  getSecurity: async (): Promise<Record<string, unknown>> => {
    const res = await apiClient.get("/user/security/");
    return res.data?.data || res.data;
  },

  getRiskAssessments: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/user/risk-assessments/");
    return res.data?.data || res.data || [];
  },

  getRiskAssessmentDetail: async (id: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.get(`/user/risk-assessments/${id}/`);
    return res.data?.data || res.data;
  },
};
