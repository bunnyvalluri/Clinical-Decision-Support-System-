export type APIStatus =
  | "DISCOVERED"
  | "UNDER_REVIEW"
  | "SECURITY_REVIEW"
  | "PRIVACY_REVIEW"
  | "CLINICAL_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "SUSPENDED"
  | "DEPRECATED"
  | "REJECTED";

export type APITrustLevel = "UNTRUSTED" | "REVIEWED" | "APPROVED" | "CLINICAL_APPROVED";

export type HealthStatus = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNKNOWN";

export interface ExternalAPIRegistryItem {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  base_url: string;
  documentation_url: string;
  authentication_type: string;
  https_required: boolean;
  cors_support: string;
  status: APIStatus;
  trust_level: APITrustLevel;
  approved_for_use: boolean;
  clinical_relevance: string;
  data_classification: string;
  rate_limit: string;
  timeout: number;
  last_validated_at: string | null;
  health_status: HealthStatus;
  created_at: string;
  updated_at: string;
}

export interface ProvenanceMetadata {
  source: string;
  provider: string;
  endpoint: string;
  source_url: string;
  retrieved_at: string;
  request_id: string;
  source_version: string;
  validation_status: string;
  data_classification: string;
  cached?: boolean;
}

export interface ExternalEnvelope<T> {
  provenance: ProvenanceMetadata;
  data: T;
}

export interface ExternalDrugInformation {
  name: string;
  generic_name?: string;
  identifier: string;
  manufacturer: string;
  indications: string;
  warnings: string;
  active_ingredients: string[];
  source: string;
  provider: string;
  source_url?: string;
  retrieved_at: string;
  confidence: number;
  version: string;
}

export interface ExternalProviderInformation {
  npi: string;
  provider_name: string;
  credential?: string;
  specialty: string;
  practice_address: string;
  phone: string;
  enumeration_date: string;
  status: string;
  source: string;
  provider: string;
  retrieved_at: string;
}

export interface ExternalNutritionInformation {
  food_name: string;
  fdc_id: string;
  nutrients: Record<string, string>;
  serving_size: string;
  source: string;
  provider: string;
  retrieved_at: string;
}

export interface ExternalAPIHealthCheck {
  id: string;
  api_name: string;
  latency_ms: number;
  status_code: number;
  is_available: boolean;
  error_message: string;
  checked_at: string;
}

export interface ExternalAPIAuditLogItem {
  id: string;
  endpoint: string;
  http_method: string;
  request_id: string;
  user_username?: string;
  user_role: string;
  status_code: number;
  latency_ms: number;
  success: boolean;
  circuit_state: string;
  timestamp: string;
}
