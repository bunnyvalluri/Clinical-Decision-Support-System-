export type WhiteboardType =
  | "CARE_PLAN"
  | "CLINICAL_WORKFLOW"
  | "PATIENT_JOURNEY"
  | "TRIAGE_WORKFLOW"
  | "RISK_ANALYSIS"
  | "DECISION_TREE"
  | "CLINICAL_EDUCATION"
  | "TEAM_COLLABORATION"
  | "ML_WORKFLOW"
  | "AI_WORKFLOW"
  | "DATA_LINEAGE"
  | "SYSTEM_ARCHITECTURE"
  | "INCIDENT_RESPONSE"
  | "GENERAL";

export type DataClassification = "PUBLIC" | "INTERNAL" | "SENSITIVE" | "PHI" | "RESTRICTED";

export type WhiteboardStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "ARCHIVED"
  | "DELETED_PENDING_RETENTION"
  | "PURGED";

export interface UserSummary {
  id: string;
  username: string;
  email: string;
  role: string;
  name: string;
}

export interface WhiteboardDocument {
  id: string;
  version_number: number;
  elements: any[];
  app_state: Record<string, any>;
  files: Record<string, any>;
  content_hash: string;
  size_bytes: number;
  schema_version: number;
  is_checkpoint: boolean;
  checkpoint_summary: string;
  created_by?: UserSummary;
  created_at: string;
}

export interface ClinicalWhiteboard {
  id: string;
  title: string;
  description: string;
  type: WhiteboardType;
  classification: DataClassification;
  status: WhiteboardStatus;
  current_version: number;
  is_locked: boolean;
  locked_by?: UserSummary | null;
  locked_at?: string | null;
  clinical_reviewer?: UserSummary | null;
  reviewed_at?: string | null;
  review_notes?: string;
  owner: UserSummary;
  created_by: UserSummary;
  updated_by?: UserSummary;
  patient?: string | null;
  patient_name?: string | null;
  patient_mrn?: string | null;
  tags: string[];
  metadata: Record<string, any>;
  thumbnail_data?: string;
  created_at: string;
  updated_at: string;
  current_document?: WhiteboardDocument | null;
}

export interface WhiteboardShare {
  id: string;
  share_token: string;
  target_role: string;
  target_user?: UserSummary | null;
  allow_edit: boolean;
  created_by: UserSummary;
  created_at: string;
  expires_at?: string | null;
  is_revoked: boolean;
  revoked_at?: string | null;
  is_valid: boolean;
}

export interface WhiteboardComment {
  id: string;
  whiteboard: string;
  element_id: string;
  author: UserSummary;
  text: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuidelineCitation {
  source: string;
  section: string;
  recommendation: string;
  doi_or_url?: string;
}

export interface AIDiagramResponse {
  diagram_title: string;
  elements: any[];
  app_state: Record<string, any>;
  files: Record<string, any>;
  guideline_citations: GuidelineCitation[];
  safety_disclaimer: string;
}

export type SaveStatus = "saved" | "saving" | "unsaved" | "offline" | "error";
