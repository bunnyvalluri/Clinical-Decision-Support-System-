/**
 * Typed API Client for Patient Risk Prediction & Clinical Decision Support (CDSS).
 * Connects to /api/v1/risk/ and /api/v1/patients/{id}/risk/ endpoints.
 */
import apiClient from "@/services/apiClient";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DeterministicAlert {
  rule_name: string;
  severity: "ROUTINE" | "MONITOR" | "URGENT" | "CRITICAL" | "CRITICAL_EMERGENCY";
  trigger_criteria: string;
  recommended_action: string;
}

export interface ContributingFactor {
  feature?: string;
  feature_name?: string;
  value?: number | string;
  contribution?: number;
  direction?: string;
  impact?: string;
  description?: string;
}

export interface CDSSGuidance {
  prediction_id: string | null;
  patient_id: string;
  risk_level: RiskLevel;
  probability: number;
  confidence: number;
  confidence_level: "HIGH" | "MODERATE" | "LOW";
  should_abstain: boolean;
  abstention_reason: string | null;
  ood_status: "IN_DISTRIBUTION" | "WARNING" | "OUT_OF_DISTRIBUTION" | string;
  data_quality_status: string;
  data_quality_issues: Array<{
    feature?: string;
    issue?: string;
    severity?: string;
    message?: string;
  }>;
  key_contributing_factors: ContributingFactor[];
  deterministic_alerts: DeterministicAlert[];
  suggested_clinical_review: "MANDATORY_STAT" | "REQUIRED" | "ROUTINE" | "ABSTAINED";
  clinical_summary: string;
  safety_disclaimer: string;
  generated_at: string;
}

export interface PredictionExplanation {
  id: string;
  method: string;
  feature_importances: Record<string, number>;
  top_risk_factors: ContributingFactor[];
  baseline_value: number | null;
  generated_at: string;
}

export interface RiskPrediction {
  id: string;
  prediction_id: string;
  patient: string;
  patient_id: string;
  patient_mrn?: string;
  clinical_record?: string | null;
  model_name: string;
  model_version: string;
  model_version_str: string;
  prediction_result: RiskLevel;
  risk_level: RiskLevel;
  probability: number;
  confidence_score?: number | null;
  uncertainty_score?: number | null;
  is_abstaining: boolean;
  ood_status: string;
  inference_latency: number;
  inference_latency_ms: number;
  feature_schema_version: string;
  features_snapshot: Record<string, any>;
  timestamp: string;
  prediction_timestamp: string;
  clinician_override?: RiskLevel | null;
  override_reason?: string;
  overridden_by?: string | null;
  overridden_by_name?: string | null;
  explanation?: PredictionExplanation | null;
  cdss_guidance?: CDSSGuidance | null;
  created_at: string;
}

export interface ClinicalFeatureDefinition {
  id: string;
  name: string;
  display_name: string;
  data_type: "NUMERICAL" | "CATEGORICAL" | "BOOLEAN";
  unit: string;
  required: boolean;
  min_value: number | null;
  max_value: number | null;
  allowed_values: string[];
  preprocessing_strategy: string;
  clinical_category: string;
  is_active: boolean;
  version: string;
}

export interface ClinicalRule {
  id: string;
  rule_name: string;
  description: string;
  condition_expression: Record<string, any>;
  severity: "ROUTINE" | "MONITOR" | "URGENT" | "CRITICAL";
  action_type: string;
  version: string;
  effective_from: string;
  approval_status: string;
}

export interface RiskModel {
  id: string;
  model_name: string;
  algorithm: string;
  version: string;
  status: string;
  is_active: boolean;
  is_champion?: boolean;
  artifact_location: string;
  checksum: string;
  training_dataset_identifier: string;
  feature_schema_version: string;
  preprocessing_version: string;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  roc_auc: number | null;
  hyperparameters: Record<string, any>;
  metrics: Record<string, any>;
  created_at: string;
  activated_at?: string | null;
}

export interface ModelEvaluationBenchmark {
  evaluation_id: string;
  model_id: string;
  model_name: string;
  algorithm: string;
  version: string;
  status: string;
  dataset: string;
  metrics: {
    accuracy?: number;
    precision_macro?: number;
    recall_macro?: number;
    f1_macro?: number;
    roc_auc?: number;
    brier_score?: number;
    confusion_matrix?: number[][];
  };
  brier_score: number | null;
  passed_safety_gates: boolean;
  created_at: string;
}

export interface PatientRiskSummary {
  patient_id: string;
  patient_mrn: string;
  latest_risk: RiskPrediction | null;
  has_prediction: boolean;
  risk_trajectory: Array<{
    prediction_id: string;
    timestamp: string;
    risk_level: RiskLevel;
    probability: number;
    model_name: string;
    is_abstaining: boolean;
    clinician_override?: RiskLevel | null;
  }>;
  total_predictions: number;
}

export interface CreateRiskPredictionPayload {
  patient_id: string;
  clinical_record_id?: string;
  model_name?: string;
  vitals?: Record<string, any>;
}

export interface ClinicalReviewPayload {
  clinician_override: RiskLevel;
  override_reason: string;
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

export const riskApi = {
  /**
   * Run real-time clinical risk inference and CDSS guidance for patient.
   */
  async createPrediction(payload: CreateRiskPredictionPayload): Promise<RiskPrediction> {
    const res = await apiClient.post<RiskPrediction>("/risk/predictions/", payload);
    return res.data;
  },

  /**
   * Retrieve full details of a specific prediction including TreeSHAP explanation and CDSS.
   */
  async getPrediction(predictionId: string): Promise<RiskPrediction> {
    const res = await apiClient.get<RiskPrediction>(`/risk/predictions/${predictionId}/`);
    return res.data;
  },

  /**
   * Retrieve latest risk evaluation and trajectory for a patient.
   */
  async getPatientRisk(patientId: string): Promise<PatientRiskSummary> {
    const res = await apiClient.get<PatientRiskSummary>(`/risk/patients/${patientId}/`);
    return res.data;
  },

  /**
   * List paginated historical predictions with optional filters.
   */
  async listPredictions(params?: {
    patient_id?: string;
    risk_level?: string;
    model_name?: string;
    page?: number;
  }): Promise<{ results: RiskPrediction[]; count: number }> {
    const res = await apiClient.get<{ results: RiskPrediction[]; count: number }>("/risk/predictions/", {
      params,
    });
    return res.data;
  },

  /**
   * Retrieve registered ML models (Random Forest, SVM, AdaBoost) with real metrics.
   */
  async listModels(): Promise<RiskModel[]> {
    const res = await apiClient.get<{ models: RiskModel[]; count: number }>("/risk/models/");
    return res.data.models;
  },

  /**
   * Retrieve comparative model evaluation benchmarks.
   */
  async listEvaluations(): Promise<ModelEvaluationBenchmark[]> {
    const res = await apiClient.get<{ evaluations: ModelEvaluationBenchmark[]; count: number }>(
      "/risk/evaluations/"
    );
    return res.data.evaluations;
  },

  /**
   * Retrieve active clinical feature definitions and physiological validation bounds.
   */
  async listFeatures(): Promise<ClinicalFeatureDefinition[]> {
    const res = await apiClient.get<{ features: ClinicalFeatureDefinition[]; count: number }>(
      "/risk/features/"
    );
    return res.data.features;
  },

  /**
   * Retrieve active deterministic clinical safety rules.
   */
  async listRules(): Promise<ClinicalRule[]> {
    const res = await apiClient.get<{ rules: ClinicalRule[]; count: number }>("/risk/rules/");
    return res.data.rules;
  },

  /**
   * Record human clinician review / concurrence / override on prediction.
   */
  async recordReview(predictionId: string, payload: ClinicalReviewPayload): Promise<RiskPrediction> {
    const res = await apiClient.post<RiskPrediction>(
      `/risk/predictions/${predictionId}/reviews/`,
      payload
    );
    return res.data;
  },

  /**
   * Retrieve model and data drift telemetry.
   */
  async getDriftTelemetry(): Promise<any> {
    const res = await apiClient.get("/risk/drift/");
    return res.data;
  },

  /**
   * Compare a specific prediction against its antecedent baseline.
   */
  async getPredictionComparison(predictionId: string): Promise<PredictionComparisonResult> {
    const res = await apiClient.get<{ success: boolean; data: PredictionComparisonResult }>(
      `/predictions/${predictionId}/comparison/`
    );
    return res.data.data;
  },

  /**
   * Compare patient's current active prediction against their prior valid baseline.
   */
  async getPatientPredictionComparison(patientId: string): Promise<PredictionComparisonResult | null> {
    const res = await apiClient.get<{
      success: boolean;
      has_prediction: boolean;
      data: PredictionComparisonResult | null;
    }>(`/patients/${patientId}/predictions/comparison/`);
    return res.data.data;
  },

  /**
   * Submit structured clinician feedback for a prediction.
   */
  async submitPredictionFeedback(
    predictionId: string,
    payload: { feedback_category: string; comments: string }
  ): Promise<any> {
    const res = await apiClient.post(`/predictions/${predictionId}/feedback/`, payload);
    return res.data;
  },

  /**
   * List structured clinician feedback for a prediction.
   */
  async listPredictionFeedback(predictionId: string): Promise<any[]> {
    const res = await apiClient.get(`/predictions/${predictionId}/feedback/`);
    return res.data?.data || [];
  },
};

export interface FeatureDifference {
  feature: string;
  display_name: string;
  unit: string;
  previous_value: string | number | null;
  current_value: string | number | null;
  delta: number | null;
  percentage_change: number | null;
  direction: "INCREASED" | "DECREASED" | "UNCHANGED" | "ADDED" | "REMOVED" | "CHANGED";
  is_numeric: boolean;
  is_significant: boolean;
}

export interface PredictionComparisonResult {
  is_initial_prediction: boolean;
  patient_id: string;
  patient_mrn: string;
  risk_changed: boolean;
  transition_direction: "ESCALATION" | "DE_ESCALATION" | "STABLE" | "INITIAL";
  risk_transition: string;
  time_between_predictions_seconds: number;
  time_between_formatted: string;
  current_prediction: {
    id: string;
    timestamp: string;
    risk_level: RiskLevel;
    probability: number;
    confidence_score?: number | null;
    model_name: string;
    model_version: string;
    feature_schema_version: string;
    dataset_version: string;
    is_abstaining: boolean;
    uncertainty_score?: number | null;
    ood_status: string;
    clinician_override?: RiskLevel | null;
    override_reason?: string;
    review_status: string;
    review_decision?: string | null;
  };
  previous_prediction?: {
    id: string;
    timestamp: string;
    risk_level: RiskLevel;
    probability: number;
    confidence_score?: number | null;
    model_name: string;
    model_version: string;
    feature_schema_version: string;
    dataset_version: string;
    is_abstaining: boolean;
    uncertainty_score?: number | null;
    ood_status: string;
    clinician_override?: RiskLevel | null;
    override_reason?: string;
    review_status: string;
    review_decision?: string | null;
  } | null;
  model_version_changed: boolean;
  feature_changes: FeatureDifference[];
  feature_changes_count: number;
  shap_divergence: {
    available: boolean;
    method?: string;
    shifted_factors: Array<{
      feature: string;
      display_name: string;
      previous_shap: number;
      current_shap: number;
      shap_shift: number;
      increased_contribution: boolean;
    }>;
    disclaimer?: string;
  };
  alerts_generated: any[];
  evaluation_timestamp: string;
}

