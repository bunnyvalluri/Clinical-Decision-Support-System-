/**
 * HealthNova AI — Centralized Frontend Brand Configuration
 *
 * Single source of truth for application branding, display text,
 * subtitles, disclaimers, and version information.
 */

export const BRAND_CONFIG = {
  /** Official brand name */
  brandName: "HealthNova AI",

  /** Official display name */
  displayName: "HealthNova AI",

  /** Compact brand mark / acronym */
  shortName: "HN",

  /** Official product subtitle */
  tagline: "AI-Powered Clinical Decision Support & Patient Risk Intelligence",

  /** Official short description */
  description:
    "HealthNova AI is an intelligent clinical decision-support platform that uses machine learning, AI, real-time patient information, explainable risk prediction and clinical intelligence to assist healthcare professionals in making informed decisions.",

  /** Application software version */
  productVersion: "1.0.0",

  /** Role-specific workspace subtitles */
  roleSubtitles: {
    DOCTOR: "Clinical Decision Support",
    NURSE: "Triage & Patient Risk Monitoring",
    MEDICAL_INFORMATICIST: "Clinical Data & Model Intelligence",
    ANALYST: "Clinical Data & Model Intelligence",
    IT_ADMIN: "Platform & Security Administration",
    ADMIN: "Platform & Security Administration",
    PATIENT: "Personal Health Intelligence",
    USER: "Personal Health Intelligence",
  },

  /** Role-scoped AI Assistant names */
  aiAssistants: {
    DOCTOR: "HealthNova AI Clinical Assistant",
    NURSE: "HealthNova AI Triage Assistant",
    MEDICAL_INFORMATICIST: "HealthNova AI Analytics Assistant",
    ANALYST: "HealthNova AI Analytics Assistant",
    IT_ADMIN: "HealthNova AI Platform Assistant",
    ADMIN: "HealthNova AI Platform Assistant",
    PATIENT: "HealthNova AI Health Assistant",
    USER: "HealthNova AI Health Assistant",
  },

  /** Clinical & legal disclaimers */
  disclaimers: {
    clinicalSafety:
      "HealthNova AI provides clinical decision support and risk insights. It does not replace professional medical judgment.",
    reportDisclaimer:
      "This report is generated for clinical decision support and should be interpreted by an appropriately qualified healthcare professional.",
    humanInTheLoop:
      "HealthNova AI is strictly an assistive clinical decision support tool. It does not independently diagnose, treat, or prescribe.",
  },

  /** Academic project lineage and identifiers */
  academic: {
    primaryTitle:
      "Enhancing Clinical Decision Support Systems Through Patient Risk Level Prediction Using Machine Learning Techniques",
    secondaryTitle:
      "Patient Risk Level Prediction Using Machine Learning for Intelligent Clinical Decision Support",
    projectCode: "BPY-CSE-2666",
  },

  /** Institutional contact channels */
  supportEmail: "support@healthnova.ai",
  privacyEmail: "privacy@healthnova.ai",
} as const;

export type BrandConfig = typeof BRAND_CONFIG;
