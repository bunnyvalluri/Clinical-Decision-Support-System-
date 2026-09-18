/**
 * TypeScript Interfaces for Google Jules Engineering Automation
 * Matches backend Neon PostgreSQL models and Google Jules v1alpha schema.
 */

export type JulesSessionState =
  | "QUEUED"
  | "PLANNING"
  | "PLAN_PENDING_APPROVAL"
  | "EXECUTING"
  | "VALIDATING"
  | "AWAITING_REVIEW"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type RemediationTriggerType =
  | "CI_FAILURE"
  | "REACT_DOCTOR"
  | "BRUNO"
  | "STRIX"
  | "BUG_HUNTER"
  | "PENTEST_AGENTS"
  | "DJANGO_TEST"
  | "NEXTJS_BUILD"
  | "TYPESCRIPT"
  | "LINT"
  | "COOLIFY"
  | "MANUAL";

export type RemediationIssueCategory =
  | "BUILD_FAILURE"
  | "TYPESCRIPT_ERROR"
  | "PYTHON_ERROR"
  | "DJANGO_ERROR"
  | "DATABASE_ERROR"
  | "API_ERROR"
  | "UI_ERROR"
  | "TEST_FAILURE"
  | "LINT_FAILURE"
  | "PERFORMANCE_REGRESSION"
  | "ACCESSIBILITY_FAILURE"
  | "SECURITY_FINDING"
  | "DEPENDENCY_FAILURE"
  | "DOCKER_FAILURE"
  | "CI_FAILURE"
  | "DEPLOYMENT_FAILURE"
  | "DOCUMENTATION_FAILURE"
  | "OTHER";

export type RemediationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RemediationJobStatus =
  | "DRAFT"
  | "PENDING_AUTHORIZATION"
  | "AUTHORIZED"
  | "QUEUED"
  | "JULES_SESSION_CREATED"
  | "PLANNING"
  | "PLAN_PENDING_APPROVAL"
  | "EXECUTING"
  | "VALIDATING"
  | "AWAITING_REVIEW"
  | "APPROVED"
  | "PR_CREATED"
  | "MERGED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REJECTED";

export interface JulesSource {
  id: string;
  external_name: string;
  source_id: string;
  provider: string;
  github_owner: string;
  github_repository: string;
  is_private: boolean;
  default_branch: string;
  available_branches: string[];
  enabled: boolean;
  last_synced_at: string | null;
  created_at: string;
}

export interface JulesActivity {
  id: string;
  external_activity_id: string;
  activity_type: string;
  originator: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface JulesArtifact {
  id: string;
  artifact_type: string;
  path: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface JulesSession {
  id: string;
  external_session_id: string | null;
  title: string;
  prompt: string;
  repository: string;
  branch: string;
  state: JulesSessionState;
  automation_mode: string;
  require_plan_approval: boolean;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  created_at: string;
  activities?: JulesActivity[];
  artifacts?: JulesArtifact[];
}

export interface JulesApproval {
  id: string;
  remediation_job: string;
  approval_type: string;
  requested_by: string | null;
  requester_email?: string;
  approved_by: string | null;
  approver_email?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  reason: string;
  expires_at: string | null;
  created_at: string;
}

export interface JulesRemediationJob {
  id: string;
  correlation_id: string;
  repository: string;
  branch: string;
  trigger_type: RemediationTriggerType;
  issue_category: RemediationIssueCategory;
  issue_reference: string;
  title: string;
  description: string;
  severity: RemediationSeverity;
  status: RemediationJobStatus;
  created_by: string | null;
  created_by_email?: string;
  approved_by: string | null;
  approved_by_email?: string;
  validation_status: string;
  validation_output: {
    affected_files?: string[];
    error_log?: string;
    check_results?: Record<string, unknown>;
  };
  pr_url: string;
  pr_number: number | null;
  prompt_version: string;
  remediation_attempts: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  session?: JulesSession;
  approvals?: JulesApproval[];
}

export interface JulesHealthResponse {
  service: string;
  enabled: boolean;
  configured: boolean;
  api_reachable: boolean;
  latency_ms: number;
  error: string | null;
  sources_count: number;
  active_sessions_count: number;
  circuit_breaker: {
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
    failure_count: number;
    last_failure_time: number | null;
    is_open: boolean;
  };
  environment: string;
}

export interface JulesSettings {
  enabled: boolean;
  is_configured: boolean;
  base_url: string;
  timeout_seconds: number;
  connect_timeout_seconds: number;
  max_concurrent_sessions: number;
  require_plan_approval: boolean;
  auto_create_pr: boolean;
  allowed_repositories: string[];
  allowed_branches: string[];
  environment: string;
  circuit_breaker: {
    state: string;
    failure_count: number;
    last_failure_time: number | null;
    is_open: boolean;
  };
}

export interface CreateRemediationPayload {
  title: string;
  issue_category: RemediationIssueCategory;
  description: string;
  repository?: string;
  branch?: string;
  trigger_type?: RemediationTriggerType;
  severity?: RemediationSeverity;
  issue_reference?: string;
  affected_files?: string[];
  error_log?: string;
}

export type JulesHealthStatus = "HEALTHY" | "DEGRADED" | "UNAVAILABLE" | "CONFIG_ERROR";
