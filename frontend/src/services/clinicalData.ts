import type { RiskLevel } from "@/types";

export interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: "M" | "F" | "OTHER";
  blood_type: string;
  admission_date: string;
  room_number: string;
  primary_doctor: string;
  department: string;
  status: "INPATIENT" | "OUTPATIENT" | "ICU" | "DISCHARGED";
  latest_risk_level: RiskLevel;
  latest_risk_score: number; // 0 to 1
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  spo2: number;
  blood_glucose: number;
}

export interface PredictionRecord {
  id: string;
  patient_id: string;
  patient_mrn: string;
  patient_name: string;
  timestamp: string;
  risk_level: RiskLevel;
  probability: number; // 0.0 to 1.0
  confidence_interval: [number, number];
  model_name: string;
  model_version: string;
  clinician_name: string;
  chief_complaint: string;
  clinical_factors: {
    age: number;
    sex: string;
    chest_pain_type: string;
    resting_bp: number;
    cholesterol: number;
    fasting_blood_sugar: string;
    resting_ecg: string;
    max_heart_rate: number;
    exercise_angina: string;
    st_depression: number;
    slope: string;
    major_vessels: number;
    thalassemia: string;
  };
  shap_attributions: Array<{
    feature: string;
    attribution: number;
    description: string;
  }>;
  guidelines: string[];
  physician_override?: {
    overridden_by: string;
    new_risk_level: RiskLevel;
    rationale: string;
    timestamp: string;
  } | null;
  age?: number;
  gender?: string;
  created_at?: string;
  review_status?: "PENDING" | "REVIEWED" | "REQUIRES_INFO" | "OVERRIDDEN" | string;
  feature_contributions?: Array<{ feature: string; attribution: number; description?: string }>;
}

export interface ClinicalNotification {
  id: string;
  title: string;
  message: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  timestamp: string;
  patient_mrn?: string;
  patient_id?: string;
  read: boolean;
  action_url?: string;
}

export interface ReportItem {
  id: string;
  title: string;
  report_type: "PATIENT_SUMMARY" | "DEPARTMENT_AUDIT" | "MODEL_PERFORMANCE" | "CLINICAL_RISK_LOG";
  patient_mrn?: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  created_at: string;
  completed_at?: string;
  file_size_mb?: number;
  download_url?: string;
}

export interface MLModelDetail {
  id: string;
  name: string;
  algorithm: "Random Forest" | "AdaBoost" | "Support Vector Machine (SVM)";
  version: string;
  status: "ACTIVE" | "CANDIDATE" | "ARCHIVED";
  accuracy: number;
  roc_auc: number;
  f1_score: number;
  sensitivity: number;
  specificity: number;
  avg_latency_ms: number;
  last_trained: string;
  total_predictions: number;
}

// Initial realistic clinical seed data
export const INITIAL_PATIENTS: Patient[] = [
  {
    id: "p-01",
    mrn: "MRN-90241",
    first_name: "Eleanor",
    last_name: "Ward",
    age: 68,
    gender: "F",
    blood_type: "A+",
    admission_date: "2026-09-11 08:30",
    room_number: "ICU-Bed-04",
    primary_doctor: "Dr. Elena Vance, MD",
    department: "Cardiology",
    status: "ICU",
    latest_risk_level: "CRITICAL",
    latest_risk_score: 0.89,
    systolic_bp: 172,
    diastolic_bp: 104,
    heart_rate: 118,
    spo2: 91,
    blood_glucose: 184,
  },
  {
    id: "p-02",
    mrn: "MRN-78192",
    first_name: "Marcus",
    last_name: "Chen",
    age: 54,
    gender: "M",
    blood_type: "O+",
    admission_date: "2026-09-12 14:15",
    room_number: "Telemetry-210",
    primary_doctor: "Dr. Elena Vance, MD",
    department: "Cardiology",
    status: "INPATIENT",
    latest_risk_level: "HIGH",
    latest_risk_score: 0.74,
    systolic_bp: 154,
    diastolic_bp: 92,
    heart_rate: 96,
    spo2: 94,
    blood_glucose: 142,
  },
  {
    id: "p-03",
    mrn: "MRN-64510",
    first_name: "Amina",
    last_name: "Al-Mansoor",
    age: 49,
    gender: "F",
    blood_type: "B+",
    admission_date: "2026-09-13 09:00",
    room_number: "Cardio-312",
    primary_doctor: "Dr. Marcus Brody, MD",
    department: "General Medicine",
    status: "INPATIENT",
    latest_risk_level: "MEDIUM",
    latest_risk_score: 0.46,
    systolic_bp: 132,
    diastolic_bp: 82,
    heart_rate: 76,
    spo2: 98,
    blood_glucose: 110,
  },
  {
    id: "p-04",
    mrn: "MRN-51209",
    first_name: "David",
    last_name: "Kowalski",
    age: 41,
    gender: "M",
    blood_type: "O-",
    admission_date: "2026-09-13 11:20",
    room_number: "Day-Observation-08",
    primary_doctor: "Dr. Elena Vance, MD",
    department: "Emergency",
    status: "OUTPATIENT",
    latest_risk_level: "LOW",
    latest_risk_score: 0.18,
    systolic_bp: 118,
    diastolic_bp: 74,
    heart_rate: 68,
    spo2: 99,
    blood_glucose: 92,
  },
  {
    id: "p-05",
    mrn: "MRN-33984",
    first_name: "Sarah",
    last_name: "Thornton",
    age: 72,
    gender: "F",
    blood_type: "AB+",
    admission_date: "2026-09-10 19:45",
    room_number: "ICU-Bed-02",
    primary_doctor: "Dr. Elena Vance, MD",
    department: "Cardiology",
    status: "ICU",
    latest_risk_level: "HIGH",
    latest_risk_score: 0.78,
    systolic_bp: 160,
    diastolic_bp: 98,
    heart_rate: 104,
    spo2: 93,
    blood_glucose: 165,
  },
  {
    id: "p-06",
    mrn: "MRN-44120",
    first_name: "Robert",
    last_name: "Taylor",
    age: 59,
    gender: "M",
    blood_type: "A-",
    admission_date: "2026-09-12 10:10",
    room_number: "Cardio-314",
    primary_doctor: "Dr. Marcus Brody, MD",
    department: "Cardiology",
    status: "INPATIENT",
    latest_risk_level: "MEDIUM",
    latest_risk_score: 0.52,
    systolic_bp: 138,
    diastolic_bp: 86,
    heart_rate: 82,
    spo2: 97,
    blood_glucose: 128,
  },
];

export const INITIAL_PREDICTIONS: PredictionRecord[] = [
  {
    id: "pred-901",
    patient_id: "p-01",
    patient_mrn: "MRN-90241",
    patient_name: "Eleanor Ward",
    timestamp: "2026-09-13 14:48:22",
    risk_level: "CRITICAL",
    probability: 0.892,
    confidence_interval: [0.84, 0.94],
    model_name: "CardioEnsemble-RF",
    model_version: "v1.4.2",
    clinician_name: "Dr. Elena Vance, MD",
    chief_complaint: "Acute retrosternal chest pain radiating to left jaw, diaphoresis",
    clinical_factors: {
      age: 68,
      sex: "Female",
      chest_pain_type: "Typical Angina (Type 1)",
      resting_bp: 172,
      cholesterol: 284,
      fasting_blood_sugar: "> 120 mg/dl",
      resting_ecg: "ST-T wave abnormality",
      max_heart_rate: 148,
      exercise_angina: "Yes",
      st_depression: 2.8,
      slope: "Flat",
      major_vessels: 3,
      thalassemia: "Reversible defect",
    },
    shap_attributions: [
      { feature: "ST Depression (2.8 mm)", attribution: 0.28, description: "Strong indicator of severe subendocardial ischemia" },
      { feature: "3 Major Vessels Colored", attribution: 0.24, description: "Multi-vessel coronary artery calcification" },
      { feature: "Resting BP (172 mmHg)", attribution: 0.16, description: "Stage 2 hypertensive emergency pressure" },
      { feature: "Serum Cholesterol (284)", attribution: 0.12, description: "Hyperlipidemia contributing to plaque instability" },
      { feature: "Fasting Glucose > 120", attribution: 0.09, description: "Diabetic vascular endothelial stress" },
      { feature: "Max HR Response", attribution: -0.04, description: "Heart rate remained below ischemic threshold" },
    ],
    guidelines: [
      "Immediate STAT Cardiology consultation & Catheterization Lab activation.",
      "Dual antiplatelet therapy (Aspirin 325 mg + Ticagrelor 180 mg) if no contraindications.",
      "Continuous 12-lead telemetry and serial high-sensitivity troponin at 1h, 2h intervals.",
      "Initiate IV Nitroglycerin titration for ischemic chest discomfort if SBP > 100 mmHg.",
    ],
    physician_override: null,
  },
  {
    id: "pred-902",
    patient_id: "p-02",
    patient_mrn: "MRN-78192",
    patient_name: "Marcus Chen",
    timestamp: "2026-09-13 12:30:10",
    risk_level: "HIGH",
    probability: 0.741,
    confidence_interval: [0.68, 0.81],
    model_name: "CardioEnsemble-RF",
    model_version: "v1.4.2",
    clinician_name: "Dr. Elena Vance, MD",
    chief_complaint: "Exertional dyspnea and tightness during moderate walking",
    clinical_factors: {
      age: 54,
      sex: "Male",
      chest_pain_type: "Atypical Angina (Type 2)",
      resting_bp: 154,
      cholesterol: 242,
      fasting_blood_sugar: "< 120 mg/dl",
      resting_ecg: "Normal",
      max_heart_rate: 135,
      exercise_angina: "Yes",
      st_depression: 1.6,
      slope: "Upsloping",
      major_vessels: 1,
      thalassemia: "Normal",
    },
    shap_attributions: [
      { feature: "Exercise Angina", attribution: 0.22, description: "Reversible ischemia elicited during exertion" },
      { feature: "ST Depression (1.6 mm)", attribution: 0.18, description: "Moderate myocardial ischemic stress" },
      { feature: "Resting BP (154 mmHg)", attribution: 0.14, description: "Uncontrolled hypertension" },
      { feature: "Age (54 Male)", attribution: 0.11, description: "Demographic risk profile" },
      { feature: "Normal Resting ECG", attribution: -0.09, description: "Baseline electrical conduction preserved" },
    ],
    guidelines: [
      "Schedule non-invasive coronary CTA or stress echocardiography within 24 hours.",
      "Optimize beta-blocker therapy (Metoprolol succinate 25mg daily).",
      "Monitor resting hemodynamics and log any nighttime angina episodes.",
    ],
    physician_override: null,
  },
  {
    id: "pred-903",
    patient_id: "p-03",
    patient_mrn: "MRN-64510",
    patient_name: "Amina Al-Mansoor",
    timestamp: "2026-09-13 09:15:40",
    risk_level: "MEDIUM",
    probability: 0.463,
    confidence_interval: [0.41, 0.52],
    model_name: "CardioEnsemble-RF",
    model_version: "v1.4.2",
    clinician_name: "Dr. Marcus Brody, MD",
    chief_complaint: "Palpitations and atypical chest fluttering",
    clinical_factors: {
      age: 49,
      sex: "Female",
      chest_pain_type: "Non-anginal pain (Type 3)",
      resting_bp: 132,
      cholesterol: 215,
      fasting_blood_sugar: "< 120 mg/dl",
      resting_ecg: "Normal",
      max_heart_rate: 160,
      exercise_angina: "No",
      st_depression: 0.6,
      slope: "Upsloping",
      major_vessels: 0,
      thalassemia: "Normal",
    },
    shap_attributions: [
      { feature: "Resting BP (132 mmHg)", attribution: 0.12, description: "Mild pre-hypertension" },
      { feature: "Cholesterol (215)", attribution: 0.08, description: "Borderline high lipid markers" },
      { feature: "Zero Major Vessels", attribution: -0.19, description: "Clear coronary arteries on prior imaging" },
      { feature: "No Exercise Angina", attribution: -0.15, description: "Absence of inducible exertional angina" },
    ],
    guidelines: [
      "Outpatient 48-hour Holter monitoring for arrhythmia evaluation.",
      "Lifestyle modifications (low-sodium DASH diet, 150 min aerobic exercise/week).",
      "Re-evaluate lipid panel and HbA1c in 3 months.",
    ],
    physician_override: null,
  },
  {
    id: "pred-904",
    patient_id: "p-04",
    patient_mrn: "MRN-51209",
    patient_name: "David Kowalski",
    timestamp: "2026-09-13 11:42:05",
    risk_level: "LOW",
    probability: 0.178,
    confidence_interval: [0.12, 0.23],
    model_name: "CardioEnsemble-RF",
    model_version: "v1.4.2",
    clinician_name: "Dr. Elena Vance, MD",
    chief_complaint: "Routine pre-operative clearance",
    clinical_factors: {
      age: 41,
      sex: "Male",
      chest_pain_type: "Asymptomatic (Type 4)",
      resting_bp: 118,
      cholesterol: 182,
      fasting_blood_sugar: "< 120 mg/dl",
      resting_ecg: "Normal",
      max_heart_rate: 172,
      exercise_angina: "No",
      st_depression: 0.1,
      slope: "Upsloping",
      major_vessels: 0,
      thalassemia: "Normal",
    },
    shap_attributions: [
      { feature: "Optimal Blood Pressure (118)", attribution: -0.22, description: "Excellent resting hemodynamic status" },
      { feature: "Normal ECG & No ST Depression", attribution: -0.18, description: "Zero electrophysiological compromise" },
      { feature: "Good Aerobic Capacity (Max HR 172)", attribution: -0.14, description: "Healthy chronotropic reserve" },
    ],
    guidelines: [
      "Cleared for elective general surgery.",
      "Routine annual physical examination follow-up.",
    ],
    physician_override: null,
  },
];

export const INITIAL_NOTIFICATIONS: ClinicalNotification[] = [
  {
    id: "notif-1",
    title: "Critical Patient Risk Spike (MRN-90241)",
    message: "Ensemble model generated 89.2% probability of acute cardiac event for Eleanor Ward in ICU-Bed-04.",
    severity: "CRITICAL",
    timestamp: "12 mins ago",
    patient_mrn: "MRN-90241",
    patient_id: "p-01",
    read: false,
    action_url: "/predictions/pred-901",
  },
  {
    id: "notif-2",
    title: "High Risk Alert (MRN-78192)",
    message: "Marcus Chen reassessed at 74.1% risk following exercise treadmill test ST changes.",
    severity: "WARNING",
    timestamp: "2 hours ago",
    patient_mrn: "MRN-78192",
    patient_id: "p-02",
    read: false,
    action_url: "/predictions/pred-902",
  },
  {
    id: "notif-3",
    title: "Celery PDF Report Completed",
    message: "Inpatient Cardiology Monthly Audit PDF has been compiled and is ready for download.",
    severity: "INFO",
    timestamp: "3 hours ago",
    read: true,
    action_url: "/reports",
  },
  {
    id: "notif-4",
    title: "ML Model Retraining Scheduled",
    message: "Periodic ensemble model performance evaluation completed: ROC-AUC maintained at 0.942.",
    severity: "INFO",
    timestamp: "Yesterday",
    read: true,
    action_url: "/admin/models",
  },
];

export const INITIAL_REPORTS: ReportItem[] = [
  {
    id: "rep-001",
    title: "Executive Cardiology Risk Stratification",
    report_type: "DEPARTMENT_AUDIT",
    status: "COMPLETED",
    progress: 100,
    created_at: "2026-09-13 10:00",
    completed_at: "2026-09-13 10:02",
    file_size_mb: 2.8,
    download_url: "/api/v1/reports/rep-001/download/",
  },
  {
    id: "rep-002",
    title: "Patient Longitudinal Summary (MRN-90241)",
    report_type: "PATIENT_SUMMARY",
    patient_mrn: "MRN-90241",
    status: "COMPLETED",
    progress: 100,
    created_at: "2026-09-13 11:30",
    completed_at: "2026-09-13 11:31",
    file_size_mb: 1.4,
    download_url: "/api/v1/reports/rep-002/download/",
  },
  {
    id: "rep-003",
    title: "Weekly ML Ensemble Drift & Calibration",
    report_type: "MODEL_PERFORMANCE",
    status: "PROCESSING",
    progress: 68,
    created_at: "2026-09-13 15:45",
  },
];

export const INITIAL_MODELS: MLModelDetail[] = [
  {
    id: "mod-01",
    name: "CardioEnsemble-RF (Primary)",
    algorithm: "Random Forest",
    version: "v1.4.2",
    status: "ACTIVE",
    accuracy: 0.924,
    roc_auc: 0.942,
    f1_score: 0.918,
    sensitivity: 0.931,
    specificity: 0.916,
    avg_latency_ms: 22,
    last_trained: "2026-09-08 04:00",
    total_predictions: 12480,
  },
  {
    id: "mod-02",
    name: "AdaBoost-Cardio-V2 (Shadow)",
    algorithm: "AdaBoost",
    version: "v2.0.1",
    status: "CANDIDATE",
    accuracy: 0.911,
    roc_auc: 0.935,
    f1_score: 0.904,
    sensitivity: 0.918,
    specificity: 0.902,
    avg_latency_ms: 18,
    last_trained: "2026-09-10 02:30",
    total_predictions: 1420,
  },
  {
    id: "mod-03",
    name: "SVM-RBF-Classifier (Legacy)",
    algorithm: "Support Vector Machine (SVM)",
    version: "v1.0.8",
    status: "ARCHIVED",
    accuracy: 0.884,
    roc_auc: 0.898,
    f1_score: 0.875,
    sensitivity: 0.882,
    specificity: 0.886,
    avg_latency_ms: 35,
    last_trained: "2026-08-15 01:00",
    total_predictions: 34100,
  },
];

// Helper to safely execute API calls with fallback to cached/mock data
export async function fetchWithFallback<T>(
  apiCall: () => Promise<T>,
  fallbackData: T
): Promise<T> {
  try {
    const result = await apiCall();
    return result;
  } catch {
    // Gracefully return realistic clinical fallback
    return fallbackData;
  }
}
