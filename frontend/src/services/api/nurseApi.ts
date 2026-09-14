import apiClient from "@/services/apiClient";

export interface TriageQueueItem {
  id: string;
  patient_id?: string;
  mrn: string;
  patient_name: string;
  state: string;
  acuity_level: number;
  chief_complaint: string;
  bed_assignment?: string;
  arrival_time: string;
  nurse_name?: string;
  triage_notes?: string;
}

export interface BedsideTaskItem {
  id: string;
  patient_name: string;
  patient_mrn: string;
  title: string;
  due_at?: string;
  priority: string;
  status: string;
}

export interface EscalationItem {
  id: string;
  patient_name: string;
  patient_mrn: string;
  reason: string;
  status: string;
  priority: string;
  escalated_by: string;
  assigned_doctor?: string;
  created_at: string;
}

export const nurseApi = {
  getTriageQueue: async (params?: { state?: string }): Promise<TriageQueueItem[]> => {
    const res = await apiClient.get("/clinical/triage/queue/", { params });
    return res.data?.data || [];
  },

  admitTriagePatient: async (data: {
    patient_id: string;
    chief_complaint: string;
    acuity_level?: number;
    bed_assignment?: string;
  }): Promise<Record<string, unknown>> => {
    const res = await apiClient.post("/clinical/triage/queue/", data);
    return res.data?.data || res.data;
  },

  updateTriageState: async (id: string, state: string, notes?: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.patch(`/clinical/triage/queue/${id}/state/`, { state, triage_notes: notes });
    return res.data?.data || res.data;
  },

  getBedsideTasks: async (params?: { status?: string }): Promise<BedsideTaskItem[]> => {
    const res = await apiClient.get("/clinical/triage/tasks/", { params });
    return res.data?.data || [];
  },

  updateBedsideTask: async (taskId: string, status: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.patch("/clinical/triage/tasks/", { task_id: taskId, status });
    return res.data?.data || res.data;
  },

  recordVitals: async (data: {
    patient_id: string;
    systolic_bp: number;
    diastolic_bp: number;
    heart_rate: number;
    respiratory_rate: number;
    oxygen_saturation: number;
    body_temperature: number;
  }): Promise<Record<string, unknown>> => {
    const res = await apiClient.post("/clinical/vitals/", data);
    return res.data?.data || res.data;
  },

  getEscalations: async (): Promise<EscalationItem[]> => {
    const res = await apiClient.get("/clinical/triage/escalate/");
    return res.data?.data || [];
  },

  createEscalation: async (data: {
    patient_id: string;
    reason: string;
    priority?: "HIGH" | "CRITICAL" | string;
    doctor_id?: string;
  }): Promise<Record<string, unknown>> => {
    const res = await apiClient.post("/clinical/triage/escalate/", data);
    return res.data?.data || res.data;
  },

  getPatientVitalsHistory: async (patientId: string): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get("/clinical/records/", { params: { patient: patientId } });
    return res.data?.results || res.data?.data || res.data || [];
  },
};
