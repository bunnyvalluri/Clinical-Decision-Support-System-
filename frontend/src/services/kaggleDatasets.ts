/**
 * Typed client service for Kaggle dataset intelligence & governance API endpoints.
 */
import apiClient from "@/services/apiClient";

export interface KaggleCandidate {
  kaggle_owner: string;
  kaggle_slug: string;
  title: string;
  description: string;
  dataset_url: string;
  license_name: string;
  license_url?: string;
  author: string;
  size_bytes: number;
  file_count: number;
  version_number: number;
  last_updated?: string;
  tags: string[];
  usability_rating: number;
  download_count: number;
  vote_count: number;
}

export interface KaggleDatasetSummary {
  id: string;
  kaggle_owner: string;
  kaggle_slug: string;
  title: string;
  description: string;
  dataset_url: string;
  version_number: number;
  version_identifier: string;
  license_name: string;
  author: string;
  size_bytes: number;
  file_count: number;
  status: string;
  quality_status: string;
  clinical_suitability_status: string;
  approval_status: string;
  discovered_at: string;
  last_checked_at: string;
  row_count?: number | null;
  column_count?: number | null;
  is_synthetic?: boolean;
}

export interface DatasetQualityFinding {
  feature?: string;
  issue_type: string;
  severity: "INFO" | "WARNING" | "ERROR" | "BLOCKING";
  message: string;
}

export interface DatasetFeature {
  name: string;
  data_type: string;
  min?: number | null;
  max?: number | null;
  missing_pct: number;
  clinical_meaning?: string;
  leakage_status?: string;
  privacy_classification?: string;
}

export interface KaggleDatasetVersion {
  id: string;
  version_number: number;
  version_identifier: string;
  dataset_hash?: string;
  content_hash_sha256: string;
  row_count: number;
  column_count: number;
  file_size_bytes: number;
  license_name: string;
  is_synthetic: boolean;
  synthetic_confidence: number;
  synthetic_reason: string;
  validation_status: string;
  schema_definition?: Record<string, any>;
  ingested_at: string;
  download_timestamp?: string;
}

export interface DatasetDetail {
  id: string;
  kaggle_owner: string;
  kaggle_slug: string;
  title: string;
  description: string;
  dataset_url: string;
  version_number: number;
  version_identifier: string;
  license_name: string;
  author: string;
  size_bytes: number;
  file_count: number;
  status: string;
  quality_status: string;
  clinical_suitability_status: string;
  approval_status: string;
  tags: string[];
  discovered_at: string;
  latest_version?: KaggleDatasetVersion | null;
  versions?: KaggleDatasetVersion[];
  quality_summary?: {
    findings_count: number;
    findings: DatasetQualityFinding[];
  } | null;
  privacy_assessment?: {
    classification: string;
    has_unredacted_phi: boolean;
    approval_gate: string;
    direct_identifiers_found: string[];
    scan_summary: Record<string, any>;
  } | null;
  clinical_validation?: {
    clinical_suitability_status: string;
    has_blocking_violations: boolean;
    range_violations: any[];
    contradictions: any[];
  } | null;
  features: DatasetFeature[];
  validation_jobs: Array<{
    id: string;
    job_type: string;
    status: string;
    progress_pct: number;
    error_message?: string;
    started_at: string;
    completed_at?: string;
  }>;
}

export interface DatasetLineageGraph {
  nodes: Array<{ id: string; label: string; type: string }>;
  edges: Array<{ source: string; target: string }>;
}

export interface TrainingRunDTO {
  id: string;
  algorithm: string;
  status: string;
  metrics: Record<string, any>;
  brier_score?: number | null;
  shap_summary?: Record<string, number>;
  artifact_path?: string;
  artifact_checksum?: string;
  created_at: string;
  completed_at?: string;
  model_version?: {
    id: string;
    model_name: string;
    status: string;
    accuracy?: number | null;
    roc_auc?: number | null;
  } | null;
}

export interface KaggleAuthStatus {
  authenticated: boolean;
  configured_user?: string | null;
  auth_source: string;
  backend_mode: string;
}

export const kaggleDatasetsApi = {
  getAuthStatus: async (): Promise<KaggleAuthStatus> => {
    const res = await apiClient.get<{ success: boolean; data: KaggleAuthStatus }>(
      "/models/datasets/auth-status/"
    );
    return res.data.data;
  },

  listDatasets: async (params?: {
    status?: string;
    approval_status?: string;
    search?: string;
  }): Promise<KaggleDatasetSummary[]> => {
    const res = await apiClient.get<{ success: boolean; data: { count: number; datasets: KaggleDatasetSummary[] } }>(
      "/models/datasets/",
      { params }
    );
    return res.data.data.datasets;
  },

  discoverDatasets: async (query: string, limit = 20): Promise<KaggleCandidate[]> => {
    const res = await apiClient.post<{ success: boolean; data: { query: string; count: number; candidates: KaggleCandidate[] } }>(
      "/models/datasets/discover/",
      { query, limit }
    );
    return res.data.data.candidates;
  },

  importDataset: async (candidate: {
    kaggle_owner: string;
    kaggle_slug: string;
    title?: string;
    description?: string;
    dataset_url?: string;
    license_name?: string;
    author?: string;
  }): Promise<{ id: string; ref: string; status: string }> => {
    const res = await apiClient.post<{ success: boolean; data: { id: string; ref: string; status: string } }>(
      "/models/datasets/import/",
      candidate
    );
    return res.data.data;
  },

  getDatasetDetail: async (datasetId: string): Promise<DatasetDetail> => {
    const res = await apiClient.get<{ success: boolean; data: DatasetDetail }>(
      `/models/datasets/${datasetId}/`
    );
    return res.data.data;
  },

  getDataset: async (datasetId: string): Promise<DatasetDetail> => {
    const res = await apiClient.get<{ success: boolean; data: DatasetDetail }>(
      `/models/datasets/${datasetId}/`
    );
    return res.data.data;
  },

  validateDataset: async (datasetId: string): Promise<{ celery_task_id: string; status: string }> => {
    const res = await apiClient.post<{ success: boolean; data: { celery_task_id: string; status: string } }>(
      `/models/datasets/${datasetId}/validate/`
    );
    return res.data.data;
  },

  getDatasetQuality: async (datasetId: string) => {
    const res = await apiClient.get<{ success: boolean; data: any }>(
      `/models/datasets/${datasetId}/quality/`
    );
    return res.data.data;
  },

  getDatasetSchema: async (datasetId: string) => {
    const res = await apiClient.get<{ success: boolean; data: any }>(
      `/models/datasets/${datasetId}/schema/`
    );
    return res.data.data;
  },

  getDatasetLineage: async (datasetId: string): Promise<DatasetLineageGraph> => {
    const res = await apiClient.get<{ success: boolean; data: DatasetLineageGraph }>(
      `/models/datasets/${datasetId}/lineage/`
    );
    return res.data.data;
  },

  approveDataset: async (datasetId: string, approval_tier: string, clinical_rationale: string, intended_use?: string) => {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/models/datasets/${datasetId}/approve/`,
      { approval_tier, clinical_rationale, intended_use }
    );
    return res.data.data;
  },

  trainModel: async (datasetId: string, algorithm: string, hyperparameters?: Record<string, any>, random_seed = 42) => {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/models/datasets/${datasetId}/train/`,
      { algorithm, hyperparameters, random_seed }
    );
    return res.data.data;
  },

  getTrainingRuns: async (datasetId: string): Promise<TrainingRunDTO[]> => {
    const res = await apiClient.get<{ success: boolean; data: { count: number; runs: TrainingRunDTO[] } }>(
      `/models/datasets/${datasetId}/training-runs/`
    );
    return res.data.data.runs;
  },
};
