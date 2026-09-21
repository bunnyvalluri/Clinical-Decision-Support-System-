/**
 * Interoperability & FHIR Hub TypeScript Type Definitions — BPY-CSE-2666.
 * Strictly mirrors backend DRF models and serializers. Zero fake data.
 */

export type IntegrationHealthStatus =
  | "CONNECTED"
  | "DEGRADED"
  | "OFFLINE"
  | "AUTHENTICATION_FAILED"
  | "VALIDATION_FAILED"
  | "CONFIGURATION_REQUIRED"
  | "NOT_CONFIGURED"
  | "UNKNOWN";

export type ConflictStatus =
  | "PENDING_REVIEW"
  | "IN_REVIEW"
  | "APPROVED_APPLY"
  | "REJECTED"
  | "DISMISSED";

export type ConflictType =
  | "DUPLICATE_PATIENT_MATCH"
  | "AMBIGUOUS_MAPPING"
  | "VALUE_OUT_OF_BOUNDS"
  | "OVERWRITE_PROTECTION_TRIGGERED"
  | "UNRECOGNIZED_CODE"
  | "INTEGRITY_VIOLATION";

export type ResolutionAction =
  | "OVERWRITE_EXISTING"
  | "MERGE_RECORDS"
  | "CREATE_NEW_RECORD"
  | "REJECT_INCOMING";

export type FHIRResourceStatus =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "NOT_SUPPORTED"
  | "PLANNED";

export interface InteroperabilityDashboardMetrics {
  has_data: boolean;
  empty_message: string;
  resources_imported: number;
  resources_rejected: number;
  validation_failures: number;
  mapping_failures: number;
  duplicate_resources: number;
  ambiguous_patient_matches: number;
  pending_reviews: number;
  successful_exports: number;
  failed_exports: number;
  overall_integration_health: IntegrationHealthStatus;
  connections: Array<{
    id: string;
    name: string;
    health_status: IntegrationHealthStatus;
    latency_ms: number;
    last_verified_at: string | null;
  }>;
  total_connections: number;
  verified_at: string;
}

export interface FHIRResourceBoundaryItem {
  resource: string;
  status: FHIRResourceStatus;
  internal_model: string;
  direction: string;
  description: string;
}

export interface IntegrationConnectionItem {
  id: string;
  external_system?: string;
  external_system_name?: string;
  name: string;
  base_url: string;
  fhir_version: string;
  auth_type: string;
  trust_level: string;
  health_status: IntegrationHealthStatus;
  is_active: boolean;
  allowed_direction: string;
  rate_limit_per_minute: number;
  timeout_seconds: number;
  last_verified_at: string | null;
  last_sync_at: string | null;
  latency_ms: number;
  health_details: Record<string, any>;
  import_jobs_count: number;
  export_jobs_count: number;
  created_at: string;
  updated_at: string;
}

export interface FHIRImportJobItem {
  id: string;
  connection?: string;
  connection_name?: string;
  status: string;
  resources_requested: string[];
  total_records: number;
  imported_records: number;
  conflicts_generated: number;
  failed_records: number;
  duration_ms: number;
  error_log: string;
  triggered_by_username?: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface FHIRExportJobItem {
  id: string;
  connection?: string;
  connection_name?: string;
  status: string;
  resource_type: string;
  total_records: number;
  exported_records: number;
  failed_records: number;
  duration_ms: number;
  error_log: string;
  patient?: string;
  patient_mrn?: string;
  triggered_by_username?: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface FHIRMappingConflictItem {
  id: string;
  conflict_type: ConflictType;
  status: ConflictStatus;
  resource_type: string;
  external_system?: string;
  external_system_name?: string;
  incoming_payload: Record<string, any>;
  existing_entity_type?: string;
  existing_entity_id?: string;
  discrepancy_details: Record<string, any>;
  confidence_score?: number;
  assigned_to_name?: string;
  resolution_action?: ResolutionAction;
  resolution_notes?: string;
  resolved_by_name?: string;
  resolved_at?: string | null;
  created_at: string;
}

export interface FHIRProvenanceRecordItem {
  id: string;
  entity_type: string;
  entity_id: string;
  external_system_name: string;
  external_resource_id: string;
  external_version_id: string;
  fhir_resource_type: string;
  payload_sha256: string;
  raw_payload_snapshot: Record<string, any>;
  direction: string;
  recorded_at: string;
  created_at: string;
}

export interface IntegrationAuditEventItem {
  id: number;
  connection_name?: string;
  actor_username?: string;
  action: string;
  resource: string;
  source: string;
  result: string;
  correlation_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface TerminologyMappingItem {
  id: string;
  connection_name?: string;
  source_system: string;
  source_code: string;
  source_display: string;
  target_system: string;
  target_code: string;
  target_display: string;
  internal_field?: string;
  is_verified: boolean;
  created_at: string;
}

export interface FHIRMappingVersionItem {
  id: string;
  resource_type: string;
  version: string;
  mapping_rules: Record<string, any>;
  is_active: boolean;
  change_summary?: string;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
}

