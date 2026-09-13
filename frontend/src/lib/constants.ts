/**
 * Application Constants
 */
export const APP_NAME = "Clinical Decision Support System";
export const APP_VERSION = "1.0.0";

export const API_ROUTES = {
  HEALTH: "/health/",
  HEALTH_READY: "/health/ready/",
  AUTH: {
    LOGIN: "/auth/login/",
    REGISTER: "/auth/register/",
    REFRESH: "/auth/token/refresh/",
    LOGOUT: "/auth/logout/",
    ME: "/auth/me/",
    CHANGE_PASSWORD: "/auth/change-password/",
  },
  PATIENTS: "/patients/",
  PREDICTIONS: "/predictions/",
  REPORTS: "/reports/",
  NOTIFICATIONS: "/notifications/",
  AUDIT: "/audit/",
} as const;

export const CLINICAL_ROLES = {
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
  NURSE: "NURSE",
  ANALYST: "ANALYST",
} as const;

export const RISK_LEVELS = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
