/**
 * Global TypeScript type definitions for BPY-CSE-2666.
 *
 * These types mirror the Django serializer output exactly, ensuring
 * type safety across the entire frontend codebase.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------
export type UUID = string;
export type ISODateString = string;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    pagination?: Pagination;
  };
}

export interface Pagination {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// User & Auth
// ---------------------------------------------------------------------------
export type UserRole = "ADMIN" | "DOCTOR" | "NURSE" | "ANALYST";

export interface User {
  id: UUID;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  department: string;
  phone_number: string;
  profile_picture: string | null;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Risk levels
// ---------------------------------------------------------------------------
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "text-emerald-400",
  MEDIUM: "text-amber-400",
  HIGH: "text-orange-500",
  CRITICAL: "text-red-600",
};

export const RISK_LEVEL_BG: Record<RiskLevel, string> = {
  LOW: "bg-emerald-500/10 border-emerald-500/30",
  MEDIUM: "bg-amber-500/10 border-amber-500/30",
  HIGH: "bg-orange-500/10 border-orange-500/30",
  CRITICAL: "bg-red-500/20 border-red-500/40",
};

// ---------------------------------------------------------------------------
// ML Models
// ---------------------------------------------------------------------------
export type ModelType = "SVM" | "RANDOM_FOREST" | "ADABOOST";
export type ModelStatus =
  | "TRAINING"
  | "TRAINED"
  | "EVALUATING"
  | "ACTIVE"
  | "ARCHIVED"
  | "FAILED";

export interface MLModel {
  id: UUID;
  name: string;
  model_type: ModelType;
  dataset_name: string;
  version: string;
  status: ModelStatus;
  metrics: ModelMetrics;
  created_at: ISODateString;
}

export interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  roc_auc?: number;
}

// ---------------------------------------------------------------------------
// WebSocket event types & schemas
// ---------------------------------------------------------------------------
export type WSEventType =
  | "dashboard_update"
  | "dashboard_stats_updated"
  | "prediction_created"
  | "risk_alert"
  | "patient_update"
  | "notification"
  | "pong"
  | "task_status_updated"
  | "PREDICTION_CREATED"
  | "RISK_ALERT"
  | "DASHBOARD_STATS_UPDATED"
  | "NOTIFICATION"
  | "PONG"
  | "TASK_STATUS_UPDATED";

export interface WSEvent<T = unknown> {
  event?: string;
  type: WSEventType;
  payload?: T;
  [key: string]: unknown;
}

export interface PredictionCreatedPayload {
  prediction_id: UUID;
  patient_id: UUID;
  risk_level: RiskLevel;
  probability: number;
  model_name: string;
  model_version: string;
  timestamp: ISODateString;
}

export interface RiskAlertPayload {
  prediction_id: UUID;
  patient_id: UUID;
  risk_level: RiskLevel;
  probability: number;
  message?: string;
  patient_mrn?: string;
  timestamp: ISODateString;
}

export interface DashboardStatsPayload {
  total_patients: number;
  high_risk_cases: number;
  critical_risk_cases: number;
  predictions_today: number;
  avg_latency_ms: number;
  active_model: string;
}

export interface DashboardUpdatePayload {
  total_patients?: number;
  predictions_today?: number;
  critical_alerts?: number;
  risk_distribution?: Record<RiskLevel, number>;
  stats?: DashboardStatsPayload;
}

export interface NotificationPayload {
  notification_id: UUID;
  title: string;
  severity: string;
  message: string;
  action_url?: string;
  timestamp: ISODateString;
}

export type TaskState = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING";

export interface TaskStatusPayload {
  task_id: string;
  task_name: string;
  status: TaskState;
  progress: number;
  result?: Record<string, unknown> | null;
  error?: string | null;
  timestamp?: ISODateString;
}

