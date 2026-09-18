"use client";

import { create } from "zustand";
import apiClient from "@/services/apiClient";
import {
  Patient,
  PredictionRecord,
  ClinicalNotification,
  ReportItem,
  MLModelDetail,
  INITIAL_PATIENTS,
  INITIAL_PREDICTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_REPORTS,
  INITIAL_MODELS,
} from "@/services/clinicalData";
import type { RiskLevel } from "@/types";

export interface DashboardStats {
  totalPatients: number;
  recentPredictionsCount: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  activeModelName: string;
  activeModelVersion: string;
  activeModelAccuracy: number;
  activeModelLatencyMs: number;
}

export interface ActivityTimelinePoint {
  time: string;
  predictions: number;
  criticalAlerts: number;
}

export interface DataQualityMetric {
  id: string;
  metric_name: string;
  score: number;
  status: string;
}

const INITIAL_DATA_QUALITY_METRICS: DataQualityMetric[] = [
  { id: "dq-1", metric_name: "Systolic Blood Pressure Completeness", score: 0.998, status: "PASSED" },
  { id: "dq-2", metric_name: "Diastolic Blood Pressure Completeness", score: 0.996, status: "PASSED" },
  { id: "dq-3", metric_name: "Heart Rate Conformance (30-220 bpm)", score: 0.994, status: "PASSED" },
  { id: "dq-4", metric_name: "Serum Creatinine Lab Accuracy", score: 0.989, status: "PASSED" },
  { id: "dq-5", metric_name: "Oxygen Saturation (SpO2 > 60%)", score: 0.997, status: "PASSED" },
  { id: "dq-6", metric_name: "Blood Glucose Distribution (<3σ)", score: 0.982, status: "WARNING" },
];

const INITIAL_DRIFT_MONITORS = [
  { id: "drift-1", feature_name: "Systolic Blood Pressure", drift_type: "Covariate Shift", drift_score: 0.038, detection_method: "PSI", drift_detected: false },
  { id: "drift-2", feature_name: "Serum Creatinine", drift_type: "Covariate Shift", drift_score: 0.052, detection_method: "PSI", drift_detected: false },
  { id: "drift-3", feature_name: "ST Depression", drift_type: "Concept Drift", drift_score: 0.045, detection_method: "KS-Test", drift_detected: false },
  { id: "drift-4", feature_name: "Heart Rate Resting", drift_type: "Covariate Shift", drift_score: 0.027, detection_method: "PSI", drift_detected: false },
  { id: "drift-5", feature_name: "Blood Glucose Level", drift_type: "Covariate Shift", drift_score: 0.041, detection_method: "PSI", drift_detected: false },
];

const INITIAL_MODEL_EVALUATIONS = [
  { id: "ev-1", model_name: "RandomForestClassifier v1.0.0", roc_auc: 0.985, f1_score: 0.978, evaluation_date: "2026-09-12T14:30:00Z" },
  { id: "ev-2", model_name: "SupportVectorMachine v0.9.4", roc_auc: 0.957, f1_score: 0.941, evaluation_date: "2026-09-10T10:15:00Z" },
  { id: "ev-3", model_name: "AdaBoostClassifier v0.8.2", roc_auc: 0.949, f1_score: 0.932, evaluation_date: "2026-09-08T09:00:00Z" },
];

const INITIAL_LLM_EVALUATIONS = [
  { id: "llm-1", evaluation_type: "SSC-2021 Sepsis Guideline Grounding", model_name: "ClinicalLlama-70B-Med", evaluation_date: "2026-09-13T16:00:00Z", overall_score: 0.984 },
  { id: "llm-2", evaluation_type: "SaMD Advisory Boundary Defense", model_name: "ClinicalLlama-70B-Med", evaluation_date: "2026-09-13T12:20:00Z", overall_score: 1.0 },
  { id: "llm-3", evaluation_type: "Prompt Injection & Jailbreak Hardening", model_name: "ClinicalLlama-70B-Med", evaluation_date: "2026-09-12T18:45:00Z", overall_score: 1.0 },
  { id: "llm-4", evaluation_type: "KDIGO AKI Stage Recommendations", model_name: "ClinicalLlama-70B-Med", evaluation_date: "2026-09-11T11:10:00Z", overall_score: 0.976 },
];

const INITIAL_AUDIT_LOGS = [
  { id: "aud-1", action_type: "MODEL_PROMOTION", action: "Promoted RandomForestClassifier v1.0.0 to Active Champion", user_email: "alex.rivera@hospital.org", user: "Alex Rivera, MSc", resource_type: "ModelRegistry", created_at: "2026-09-14T09:12:00Z" },
  { id: "aud-2", action_type: "DRIFT_SWEEP", action: "Executed automated PSI & Kolmogorov-Smirnov drift scan", user_email: "system.mlops@hospital.org", user: "MLOps Worker #2", resource_type: "DriftMonitor", created_at: "2026-09-14T06:00:00Z" },
  { id: "aud-3", action_type: "DATA_QUALITY_CHECK", action: "Feature Store ingestion integrity validated: 99.9% completeness", user_email: "system.mlops@hospital.org", user: "ETL Pipeline", resource_type: "FeatureStore", created_at: "2026-09-13T23:59:00Z" },
  { id: "aud-4", action_type: "SAFETY_EVALUATION", action: "Ran Prompt 18 LLM adversarial jailbreak & grounding audit", user_email: "alex.rivera@hospital.org", user: "Alex Rivera, MSc", resource_type: "AIEvaluation", created_at: "2026-09-13T16:30:00Z" },
  { id: "aud-5", action_type: "REPORT_EXPORT", action: "Exported Quarterly SaMD Regulatory Compliance Dossier (PDF)", user_email: "alex.rivera@hospital.org", user: "Alex Rivera, MSc", resource_type: "ReportingService", created_at: "2026-09-13T10:05:00Z" },
];

interface ClinicalStoreState {
  patients: Patient[];
  predictions: PredictionRecord[];
  notifications: ClinicalNotification[];
  reports: ReportItem[];
  models: MLModelDetail[];
  activityTimeline: ActivityTimelinePoint[];
  stats: DashboardStats;
  unreadAlertsCount: number;
  llmEvaluations?: Record<string, unknown>[];
  auditLogs?: Record<string, unknown>[];
  dataQualityMetrics?: DataQualityMetric[];
  driftMonitors?: Record<string, unknown>[];
  modelEvaluations?: Record<string, unknown>[];
  mlModels?: MLModelDetail[];

  // Actions
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  
  setPredictions: (predictions: PredictionRecord[]) => void;
  addPrediction: (prediction: PredictionRecord) => void;
  overridePrediction: (
    id: string,
    override: { new_risk_level: RiskLevel; rationale: string; overridden_by: string }
  ) => void;

  setNotifications: (notifications: ClinicalNotification[]) => void;
  addNotification: (notification: ClinicalNotification) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  setReports: (reports: ReportItem[]) => void;
  addReport: (report: ReportItem) => void;
  updateReportStatus: (id: string, status: ReportItem["status"], progress: number) => void;

  setModels: (models: MLModelDetail[]) => void;
  promoteModel: (id: string) => void;
  fetchClinicalData: () => Promise<void>;

  // Real-time WebSocket Ingestion
  handleWebSocketPrediction: (payload: {
    prediction_id: string;
    patient_id?: string;
    patient_mrn?: string;
    patient_name?: string;
    risk_level: RiskLevel;
    probability: number;
    model_name?: string;
    timestamp?: string;
    chief_complaint?: string;
  }) => void;
  handleWebSocketAlert: (alert: {
    prediction_id: string;
    patient_id?: string;
    patient_mrn?: string;
    risk_level: RiskLevel;
    message?: string;
    timestamp?: string;
  }) => void;
  handleWebSocketTask: (task: {
    task_id: string;
    task_name: string;
    status: ReportItem["status"];
    progress: number;
  }) => void;
}

const INITIAL_TIMELINE: ActivityTimelinePoint[] = [];

function calculateStats(patients: Patient[], predictions: PredictionRecord[], models: MLModelDetail[]): DashboardStats {
  const activeModel = models.find((m) => m.status === "ACTIVE") || models[0];

  let low = 0;
  let med = 0;
  let high = 0;
  let crit = 0;

  patients.forEach((p) => {
    if (p.latest_risk_level === "LOW") low++;
    else if (p.latest_risk_level === "MEDIUM") med++;
    else if (p.latest_risk_level === "HIGH") high++;
    else if (p.latest_risk_level === "CRITICAL") crit++;
  });

  return {
    totalPatients: patients.length,
    recentPredictionsCount: predictions.length,
    lowRiskCount: low,
    mediumRiskCount: med,
    highRiskCount: high,
    criticalRiskCount: crit,
    activeModelName: activeModel ? activeModel.name : "None",
    activeModelVersion: activeModel ? activeModel.version : "N/A",
    activeModelAccuracy: activeModel ? activeModel.accuracy : 0,
    activeModelLatencyMs: activeModel ? activeModel.avg_latency_ms : 0,
  };
}

export const useClinicalStore = create<ClinicalStoreState>((set, get) => ({
  patients: INITIAL_PATIENTS,
  predictions: INITIAL_PREDICTIONS,
  notifications: INITIAL_NOTIFICATIONS,
  reports: INITIAL_REPORTS,
  models: INITIAL_MODELS,
  activityTimeline: INITIAL_TIMELINE,
  stats: calculateStats(INITIAL_PATIENTS, INITIAL_PREDICTIONS, INITIAL_MODELS),
  unreadAlertsCount: INITIAL_NOTIFICATIONS.filter((n) => !n.read).length,
  llmEvaluations: INITIAL_LLM_EVALUATIONS,
  auditLogs: INITIAL_AUDIT_LOGS,
  dataQualityMetrics: INITIAL_DATA_QUALITY_METRICS,
  driftMonitors: INITIAL_DRIFT_MONITORS,
  modelEvaluations: INITIAL_MODEL_EVALUATIONS,
  mlModels: INITIAL_MODELS,

  setPatients: (patients) =>
    set((state) => ({
      patients,
      stats: calculateStats(patients, state.predictions, state.models),
    })),

  addPatient: (patient) =>
    set((state) => {
      const updated = [patient, ...state.patients];
      return {
        patients: updated,
        stats: calculateStats(updated, state.predictions, state.models),
      };
    }),

  updatePatient: (id, updates) =>
    set((state) => {
      const updated = state.patients.map((p) => (p.id === id ? { ...p, ...updates } : p));
      return {
        patients: updated,
        stats: calculateStats(updated, state.predictions, state.models),
      };
    }),

  setPredictions: (predictions) =>
    set((state) => ({
      predictions,
      stats: calculateStats(state.patients, predictions, state.models),
    })),

  addPrediction: (prediction) =>
    set((state) => {
      const updatedPredictions = [prediction, ...state.predictions];
      // Also update the patient's latest risk if matching
      const updatedPatients = state.patients.map((p) =>
        p.id === prediction.patient_id || p.mrn === prediction.patient_mrn
          ? {
              ...p,
              latest_risk_level: prediction.risk_level,
              latest_risk_score: prediction.probability,
            }
          : p
      );
      return {
        predictions: updatedPredictions,
        patients: updatedPatients,
        stats: calculateStats(updatedPatients, updatedPredictions, state.models),
      };
    }),

  overridePrediction: (id, override) =>
    set((state) => {
      const updated = state.predictions.map((p) =>
        p.id === id
          ? {
              ...p,
              physician_override: {
                ...override,
                timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
              },
            }
          : p
      );
      return { predictions: updated };
    }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadAlertsCount: notifications.filter((n) => !n.read).length,
    }),

  addNotification: (notification) =>
    set((state) => {
      const updated = [notification, ...state.notifications];
      return {
        notifications: updated,
        unreadAlertsCount: updated.filter((n) => !n.read).length,
      };
    }),

  markNotificationAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return {
        notifications: updated,
        unreadAlertsCount: updated.filter((n) => !n.read).length,
      };
    }),

  markAllNotificationsAsRead: () =>
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      return {
        notifications: updated,
        unreadAlertsCount: 0,
      };
    }),

  setReports: (reports) => set({ reports }),

  addReport: (report) =>
    set((state) => ({
      reports: [report, ...state.reports],
    })),

  updateReportStatus: (id, status, progress) =>
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              progress,
              completed_at: status === "COMPLETED" ? new Date().toLocaleTimeString() : r.completed_at,
            }
          : r
      ),
    })),

  setModels: (models) =>
    set((state) => ({
      models,
      stats: calculateStats(state.patients, state.predictions, models),
    })),

  promoteModel: (id) =>
    set((state) => {
      const updated = state.models.map((m) => ({
        ...m,
        status: (m.id === id ? "ACTIVE" : m.status === "ACTIVE" ? "CANDIDATE" : m.status) as MLModelDetail["status"],
      }));
      return {
        models: updated,
        stats: calculateStats(state.patients, state.predictions, updated),
      };
    }),

  fetchClinicalData: async () => {
    try {
      const [patientsRes, predsRes, modelsRes] = await Promise.allSettled([
        apiClient.get("/patients/"),
        apiClient.get("/predictions/records/"),
        apiClient.get("/models/versions/"),
      ]);

      const patients: Patient[] =
        patientsRes.status === "fulfilled"
          ? (patientsRes.value.data?.results || patientsRes.value.data?.data || patientsRes.value.data || [])
          : [];

      const predictions: PredictionRecord[] =
        predsRes.status === "fulfilled"
          ? (predsRes.value.data?.results || predsRes.value.data?.data || predsRes.value.data || [])
          : [];

      const models: MLModelDetail[] =
        modelsRes.status === "fulfilled"
          ? (modelsRes.value.data?.results || modelsRes.value.data?.data || modelsRes.value.data || [])
          : [];

      set((state) => ({
        patients,
        predictions,
        models,
        mlModels: models,
        stats: calculateStats(patients, predictions, models),
      }));
    } catch (err) {
      console.warn("Could not fetch clinical data from backend:", err);
    }
  },

  // Real-time WebSocket Ingestion WITHOUT page refresh
  handleWebSocketPrediction: (payload) => {
    const timestamp = payload.timestamp || new Date().toLocaleTimeString();
    const existingPatient = get().patients.find(
      (p) => p.id === payload.patient_id || p.mrn === payload.patient_mrn
    );

    const newRecord: PredictionRecord = {
      id: payload.prediction_id || `pred-ws-${Date.now()}`,
      patient_id: payload.patient_id || existingPatient?.id || "p-01",
      patient_mrn: payload.patient_mrn || existingPatient?.mrn || "MRN-WS-LIVE",
      patient_name: payload.patient_name || (existingPatient ? `${existingPatient.first_name} ${existingPatient.last_name}` : "Telemetry Patient"),
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      risk_level: payload.risk_level,
      probability: payload.probability,
      confidence_interval: [
        Math.max(0, payload.probability - 0.05),
        Math.min(1, payload.probability + 0.05),
      ],
      model_name: payload.model_name || "CardioEnsemble-RF",
      model_version: "v1.4.2",
      clinician_name: "Dr. Vadla Abhinay, MD",
      chief_complaint: payload.chief_complaint || "Live Telemetry Cardiac Assessment",
      clinical_factors: {
        age: existingPatient ? existingPatient.age : 58,
        sex: existingPatient ? (existingPatient.gender === "M" ? "Male" : "Female") : "Female",
        chest_pain_type: "Atypical Angina",
        resting_bp: existingPatient ? existingPatient.systolic_bp : 145,
        cholesterol: 230,
        fasting_blood_sugar: "< 120 mg/dl",
        resting_ecg: "Normal",
        max_heart_rate: 140,
        exercise_angina: "No",
        st_depression: payload.probability > 0.7 ? 2.4 : 0.8,
        slope: "Upsloping",
        major_vessels: payload.probability > 0.7 ? 2 : 0,
        thalassemia: "Normal",
      },
      shap_attributions: [
        {
          feature: "Telemetry Risk Probability",
          attribution: payload.probability - 0.5,
          description: "Real-time streaming model inference",
        },
        {
          feature: "Resting Vitals",
          attribution: 0.12,
          description: "Systolic blood pressure and heart rate trend",
        },
      ],
      guidelines: [
        payload.risk_level === "CRITICAL"
          ? "CRITICAL: Immediate stat bedside review and telemetry monitoring required."
          : "Review patient telemetry trend and schedule follow-up encounter.",
      ],
      physician_override: null,
    };

    // Update timeline
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const updatedTimeline = [...get().activityTimeline];
    const lastItem = updatedTimeline[updatedTimeline.length - 1];
    if (lastItem) {
      lastItem.predictions += 1;
      if (payload.risk_level === "CRITICAL") {
        lastItem.criticalAlerts += 1;
      }
    }

    get().addPrediction(newRecord);

    if (payload.risk_level === "CRITICAL" || payload.risk_level === "HIGH") {
      get().addNotification({
        id: `notif-ws-${Date.now()}`,
        title: `Real-time ${payload.risk_level} Risk Detected`,
        message: `Patient ${newRecord.patient_name} (${newRecord.patient_mrn}) assessed at ${(payload.probability * 100).toFixed(1)}% risk level.`,
        severity: payload.risk_level === "CRITICAL" ? "CRITICAL" : "WARNING",
        timestamp: "Just now",
        patient_mrn: newRecord.patient_mrn,
        patient_id: newRecord.patient_id,
        read: false,
        action_url: `/predictions/${newRecord.id}`,
      });
    }
  },

  handleWebSocketAlert: (alert) => {
    get().addNotification({
      id: `alert-ws-${Date.now()}`,
      title: `Critical Alert: ${alert.risk_level} Risk`,
      message: alert.message || `Telemetry alert on patient ${alert.patient_mrn || "Unknown"}.`,
      severity: "CRITICAL",
      timestamp: "Just now",
      patient_mrn: alert.patient_mrn,
      patient_id: alert.patient_id,
      read: false,
      action_url: alert.prediction_id ? `/predictions/${alert.prediction_id}` : "/notifications",
    });
  },

  handleWebSocketTask: (task) => {
    get().updateReportStatus(task.task_id, task.status, task.progress);
  },
}));

