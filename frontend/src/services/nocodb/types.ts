/**
 * TypeScript interfaces for NocoDB Healthcare Analytics & Workspace Integration.
 */

export type ColumnDataType =
  | "SingleLineText"
  | "Number"
  | "Rating"
  | "Select"
  | "MultiSelect"
  | "Formula"
  | "Checkbox"
  | "DateTime"
  | "Date"
  | "JSON";

export type DatasetCategory =
  | "ML_OPS"
  | "DATA_QUALITY"
  | "CLINICAL_OPS"
  | "SYSTEM_TELEMETRY"
  | "COLLABORATION"
  | "GENERAL";

export interface NocoDBSchemaColumn {
  id: string;
  name: string;
  display_name: string;
  column_type: ColumnDataType;
  is_primary: boolean;
  is_phi: boolean;
  is_read_only: boolean;
  options?: string[];
  order: number;
}

export interface NocoDBDataset {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: DatasetCategory;
  allowed_roles: string[];
  is_active: boolean;
  is_system_dataset: boolean;
  row_count: number;
  column_count?: number;
  columns?: NocoDBSchemaColumn[];
  last_synced_at: string | null;
  updated_at: string;
}

export interface NocoDBRow {
  _record_id: string;
  _anon_ref_id: string;
  _created_at: string;
  [key: string]: any;
}

export interface NocoDBRowsResponse {
  dataset_id: string;
  dataset_title: string;
  category: DatasetCategory;
  total_rows: number;
  total_pages: number;
  page: number;
  page_size: number;
  schema: NocoDBSchemaColumn[];
  rows: NocoDBRow[];
}

export interface NocoDBViewPreference {
  id?: string;
  name: string;
  view_type: "grid" | "gallery" | "kanban" | "form";
  config: {
    filters?: Record<string, string>;
    sort?: string;
    hidden_columns?: string[];
  };
  is_default?: boolean;
  created_at?: string;
}

export interface NocoDBAuditEvent {
  id: string;
  user_email: string;
  user_role: string;
  action: string;
  dataset_slug: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface NocoDBHealthTelemetry {
  status: "HEALTHY" | "DEGRADED" | "OFFLINE" | "MAINTENANCE";
  container_url: string;
  is_active: boolean;
  last_check_at: string;
  mode: string;
  managed_datasets_count: number;
}

export interface NocoDBMCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface NocoDBMCPExecutionResponse {
  success: boolean;
  tool?: string;
  agent?: string;
  result?: any;
  error?: string;
}
