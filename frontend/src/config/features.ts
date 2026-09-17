import {
  Brain,
  Radio,
  Eye,
  ShieldCheck,
  UserCheck,
  Workflow,
  Heart,
  FileSpreadsheet,
  Stethoscope,
  TrendingUp,
  Bell,
  Cpu,
  FileText,
  CheckCheck,
  Bot,
  Activity,
  Sliders,
  Database,
  Lock,
  Search,
  Users,
} from "lucide-react";

export interface TrustStripItem {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TRUST_STRIP_ITEMS: TrustStripItem[] = [
  {
    title: "AI-Powered",
    subtitle: "Clinical Intelligence",
    icon: Brain,
  },
  {
    title: "Real-Time",
    subtitle: "Patient Data",
    icon: Radio,
  },
  {
    title: "Explainable",
    subtitle: "ML Predictions",
    icon: Eye,
  },
  {
    title: "Secure & Compliant",
    subtitle: "Privacy-Focused",
    icon: ShieldCheck,
  },
  {
    title: "Human-in-the-Loop",
    subtitle: "Clinician Authority",
    icon: UserCheck,
  },
  {
    title: "Designed for Teams",
    subtitle: "Responsive Workflows",
    icon: Workflow,
  },
];

export interface PowerfulFeatureItem {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

export const POWERFUL_FEATURES: PowerfulFeatureItem[] = [
  {
    id: "risk-prediction",
    category: "PATIENT INTELLIGENCE",
    title: "Patient Risk Prediction",
    description:
      "Machine-learning models analyze approved patient features to estimate risk levels and support structured clinical review.",
    icon: Heart,
    badge: "Ensemble ML",
  },
  {
    id: "realtime-data",
    category: "TELEMETRY & STREAMS",
    title: "Real-Time Health Data",
    description:
      "Receive authorized healthcare data and workflow updates through secure real-time WebSocket services.",
    icon: Radio,
    badge: "Channels & Redis",
  },
  {
    id: "vitals-records",
    category: "CLINICAL OBSERVATION",
    title: "Vitals & Health Records",
    description:
      "Organize authorized patient health information, ECG ST depression, and lab assays into a unified clinical view.",
    icon: FileSpreadsheet,
    badge: "Unified Care",
  },
  {
    id: "explainable-ai",
    category: "INTERPRETABILITY",
    title: "Explainable AI",
    description:
      "Provide interpretable model insights and TreeSHAP feature contributions rather than unverified black-box predictions.",
    icon: Eye,
    badge: "TreeSHAP",
  },
  {
    id: "decision-support",
    category: "CLINICIAN DECISIONING",
    title: "Clinical Decision Support",
    description:
      "Support healthcare professionals with evidence-aware patient risk information while keeping physicians in the decision loop.",
    icon: Stethoscope,
    badge: "Human-in-the-Loop",
  },
  {
    id: "trend-analysis",
    category: "LONGITUDINAL INSIGHTS",
    title: "Risk Trend Analysis",
    description:
      "Analyze changes in patient physiological risk and relevant clinical indicators over time across care admissions.",
    icon: TrendingUp,
    badge: "Longitudinal",
  },
  {
    id: "secure-data",
    category: "GOVERNANCE & TRUST",
    title: "Secure Clinical Data",
    description:
      "Protect healthcare information through role-based access, object-level authorization, audit logging, and encryption.",
    icon: ShieldCheck,
    badge: "HIPAA-Aligned",
  },
  {
    id: "realtime-alerts",
    category: "WARD SURVEILLANCE",
    title: "Real-Time Alerts",
    description:
      "Surface authorized clinical workflow events, telemetry escalations, and critical vitals shifts instantly.",
    icon: Bell,
    badge: "Sub-20ms",
  },
  {
    id: "model-monitoring",
    category: "MLOPS & RELIABILITY",
    title: "Model Monitoring",
    description:
      "Support continuous model evaluation, performance tracking, drift detection (PSI, KS-tests), and registry governance.",
    icon: Cpu,
    badge: "MLOps",
  },
  {
    id: "clinical-reports",
    category: "DOCUMENTATION",
    title: "Clinical Reports",
    description:
      "Present authorized patient vitals and model prediction evidence in structured, audit-ready clinical summaries.",
    icon: FileText,
    badge: "Audit-Ready",
  },
  {
    id: "data-quality",
    category: "DATA INTEGRITY",
    title: "Data Quality",
    description:
      "Detect incomplete vitals, biological plausibility violations, and out-of-distribution inputs before inference.",
    icon: CheckCheck,
    badge: "Plausibility Check",
  },
  {
    id: "ai-assistant",
    category: "WORKFLOW ASSISTANCE",
    title: "AI Health Assistant",
    description:
      "Provide controlled AI assistance for clinical summaries and protocol queries within strict safety boundaries.",
    icon: Bot,
    badge: "AI Gateway",
  },
];

export interface AIIntelligenceItem {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AI_INTELLIGENCE_CAPABILITIES: AIIntelligenceItem[] = [
  { title: "Risk Prediction", subtitle: "Calibrated Risk Scoring", icon: Brain },
  { title: "Vitals Analysis", subtitle: "Physiological Trends", icon: Activity },
  { title: "Clinical Data Insights", subtitle: "Structured Aggregation", icon: FileSpreadsheet },
  { title: "Trend Analysis", subtitle: "Temporal Trajectories", icon: TrendingUp },
  { title: "Explainable AI", subtitle: "TreeSHAP Attributions", icon: Eye },
  { title: "Clinical Assistant", subtitle: "Governed Protocol Aid", icon: Bot },
  { title: "Health Reports", subtitle: "Structured Summaries", icon: FileText },
  { title: "Data Quality Analysis", subtitle: "Plausibility Screening", icon: CheckCheck },
  { title: "Model Monitoring", subtitle: "Drift & Calibration Audit", icon: Cpu },
  { title: "Patient Risk Review", subtitle: "Clinician Validation Gate", icon: UserCheck },
  { title: "Workflow Intelligence", subtitle: "Triage Task Prioritization", icon: Workflow },
  { title: "Evidence Retrieval", subtitle: "Institutional RAG Search", icon: Search },
];

export interface RoleFeatureCard {
  role: string;
  title: string;
  badge: string;
  route: string;
  description: string;
  capabilities: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export const ROLE_FEATURE_CARDS: RoleFeatureCard[] = [
  {
    role: "PATIENT",
    title: "Patient / User Portal",
    badge: "Personal Health",
    route: "/user/dashboard",
    description:
      "Personal health intelligence to monitor health records, review risk assessments, and access notifications.",
    capabilities: [
      "Health summary overview",
      "Personal risk assessment tracking",
      "Health records & timeline view",
      "Real-time notifications",
      "Authorized health assistance",
    ],
    icon: Users,
  },
  {
    role: "DOCTOR",
    title: "Physician & Specialist Portal",
    badge: "Clinical Decision Support",
    route: "/doctor/dashboard",
    description:
      "Comprehensive bedside clinical decision support for patient management, calibrated predictions, and reviews.",
    capabilities: [
      "Patient cohort management",
      "Calibrated risk predictions",
      "Clinician override & review workflow",
      "Longitudinal clinical timelines",
      "Audit-ready clinical reports",
      "Clinical AI Assistant",
    ],
    icon: Stethoscope,
  },
  {
    role: "NURSE",
    title: "Triage & Nursing Ward Portal",
    badge: "Ward Triage & Monitoring",
    route: "/nurse/dashboard",
    description:
      "High-efficiency triage interface for vitals recording, deterioration screening, and rapid escalations.",
    capabilities: [
      "Bedside vitals capture",
      "Rapid triage risk screening",
      "Continuous patient monitoring",
      "Critical escalation protocols",
      "Ward-level visual alerts",
    ],
    icon: Activity,
  },
  {
    role: "MEDICAL INFORMATICIST",
    title: "Clinical Informatics & MLOps",
    badge: "Data Quality & Evaluation",
    route: "/informaticist/dashboard",
    description:
      "Deep model evaluation, feature drift analytics, Brier calibration audits, and data governance.",
    capabilities: [
      "Data quality assessment",
      "Model registry & champion management",
      "Model evaluation & Brier calibration",
      "Population Stability Index (PSI) drift",
      "Clinical analytics & cohort exploration",
      "AI evaluation & safety governance",
    ],
    icon: Cpu,
  },
  {
    role: "IT ADMINISTRATOR",
    title: "Platform & Security Admin",
    badge: "Infrastructure & Security",
    route: "/admin/dashboard",
    description:
      "Full administrative oversight of user permissions, system health, audit logs, and security controls.",
    capabilities: [
      "User directory & role assignments",
      "Granular RBAC permission matrices",
      "Service & WebSocket telemetry monitoring",
      "Immutable security audit logs",
      "Infrastructure & database health checks",
    ],
    icon: ShieldCheck,
  },
];

export interface FeatureFAQItem {
  question: string;
  answer: string;
}

export const FEATURES_FAQS: FeatureFAQItem[] = [
  {
    question: "What features does the platform provide?",
    answer:
      "The platform provides machine-learning-assisted patient risk prediction, real-time vital signs monitoring, TreeSHAP explainability, clinical decision support, trend analysis, role-based workflows for clinicians and patients, and continuous model drift evaluation.",
  },
  {
    question: "How does patient risk prediction work?",
    answer:
      "Validated physiological inputs (such as blood pressure, ECG ST depression, heart rate, and cholesterol) pass through biological plausibility gates before being processed by evaluated ensemble models (Random Forest, SVM, AdaBoost) to generate calibrated risk probabilities and tier classifications.",
  },
  {
    question: "Is the AI a replacement for healthcare professionals?",
    answer:
      "No. The platform is designed strictly as assistive clinical decision support. Predictions and AI-generated insights are intended to support qualified healthcare professionals and do not replace professional medical judgment, diagnosis, or prescription.",
  },
  {
    question: "Can patients see their risk information?",
    answer:
      "Yes, authorized patients can securely view their personal health summary, historical risk trends, and educational explanations through the dedicated patient portal (/user/dashboard) under strict privacy controls.",
  },
  {
    question: "How is healthcare data protected?",
    answer:
      "The platform utilizes role-based access control (RBAC), object-level authorization, least-privilege scoping, TLS 1.3 encrypted transport, and AES-256 database storage in Neon PostgreSQL with immutable audit logging for every clinical interaction.",
  },
  {
    question: "Does the platform provide real-time updates?",
    answer:
      "Yes. The architecture integrates Django Channels and Redis to deliver bi-directional WebSocket event updates under 20ms for vitals ingestion, triage escalations, and prediction completion events.",
  },
  {
    question: "Which machine-learning models are supported?",
    answer:
      "The ML Engine actively benchmarks Random Forest, Support Vector Machine (RBF kernel), and AdaBoost on partitioned clinical cohorts with calibration wrappers (Platt Sigmoid / Isotonic) to ensure accurate probabilities.",
  },
  {
    question: "Can AI explain predictions?",
    answer:
      "Yes. The system utilizes TreeSHAP to decompose model predictions into individual positive and protective feature attribution weights, accompanied by Shannon entropy metrics to flag uncertain or out-of-distribution cases.",
  },
];
