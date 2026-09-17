/**
 * TypeScript type definitions for HealthNova AI Search Platform (Meilisearch v1.12.0).
 */

export type RoleType =
  | "DOCTOR"
  | "NURSE"
  | "MEDICAL_INFORMATICIST"
  | "ANALYST"
  | "IT_ADMIN"
  | "ADMIN"
  | "PATIENT"
  | "USER";

export interface SearchHit {
  document_id: string;
  entity_type: string;
  source_id?: string;
  title?: string;
  subtitle?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  mrn?: string;
  patient_mrn?: string;
  patient_id?: number | string;
  risk_level?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  prediction_result?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  probability?: number;
  status?: string;
  state?: string;
  acuity_level?: number;
  encounter_type?: string;
  model_name?: string;
  algorithm?: string;
  version?: string;
  department?: string;
  updated_at?: number;
  created_at?: number;
  score?: number;
  highlight?: string;
  _formatted?: Record<string, any>;
  [key: string]: any;
}

export interface SearchResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  facet_distribution?: Record<string, Record<string, number>>;
  processing_time_ms: number;
  search_mode: "meilisearch" | "degraded_postgres" | "unavailable";
  warning?: string;
  error?: string;
}

export interface SearchRequest {
  q?: string;
  index?: string;
  filters?: Record<string, any>;
  sort?: string;
  facets?: string[];
  page?: number;
  limit?: number;
  highlight?: boolean;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  category: string;
}

export interface SearchHealthStatus {
  status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  engine: string;
  version: string;
  reachable: boolean;
  database_size_bytes: number;
  indexes_count: number;
  active_indexes: string[];
  tasks_queued: number;
  fallback_mode: string;
}

export interface SearchTask {
  uid: number;
  indexUid?: string;
  status: "enqueued" | "processing" | "succeeded" | "failed" | "canceled";
  type: string;
  enqueuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  duration?: string;
  error?: {
    message: string;
    code: string;
    type: string;
  };
}

export interface SearchIndexMetadata {
  index_uid: string;
  searchable_attributes: string[];
  filterable_attributes: string[];
  sortable_attributes: string[];
}
