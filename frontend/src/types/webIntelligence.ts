/**
 * TypeScript types for Firecrawl Web Intelligence and Controlled Web Retrieval.
 */

export type SourceTrustTier = "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4" | "TIER_5";

export type WebJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "TIMEOUT";

export type ResearchMode =
  | "GENERAL_RESEARCH"
  | "MEDICAL_EVIDENCE"
  | "TECHNICAL_RESEARCH"
  | "ML_RESEARCH"
  | "SECURITY_RESEARCH"
  | "ADMIN_RESEARCH";

export type ClinicianReviewStatus =
  | "UNREVIEWED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "REQUIRES_ADDITIONAL_EVIDENCE";

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  markdown?: string;
  content_hash: string;
  trust_tier: SourceTrustTier;
  source_name: string;
  retrieved_at: string;
}

export interface SearchResponseData {
  query: string;
  total_count: number;
  duration_ms: number;
  results: SearchResultItem[];
}

export interface NormalizedDocument {
  url: string;
  canonical_url: string;
  title: string;
  markdown: string;
  content_hash: string;
  trust_tier: SourceTrustTier;
  retrieved_at: string;
}

export type WebDocument = NormalizedDocument;

export interface WebCrawlPage {
  id: string;
  url: string;
  title: string;
  status_code: number;
  content_hash: string;
  error?: string;
  created_at: string;
}

export interface WebCrawlJob {
  id: string;
  upstream_job_id: string;
  base_url: string;
  status: WebJobStatus;
  total_pages: number;
  completed_pages: number;
  failure_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  pages?: WebCrawlPage[];
}

export interface WebResearchSource {
  id: string;
  citation_number: number;
  source_title: string;
  source_url: string;
  relevance_score: number;
}

export interface WebResearchSession {
  id: string;
  role: string;
  query: string;
  mode: ResearchMode;
  status: string;
  findings: string;
  uncertainty_notes: string;
  limitations: string;
  conflicting_evidence: string;
  clinician_review_status: ClinicianReviewStatus;
  reviewed_at?: string;
  review_notes?: string;
  policy_version: string;
  created_at: string;
  completed_at?: string;
  sources: WebResearchSource[];
}

export interface DomainPolicy {
  id: string;
  domain: string;
  category: string;
  trust_tier: SourceTrustTier;
  status: "PENDING" | "APPROVED" | "BLOCKED" | "EXPIRED";
  allowed_roles: string[];
  reason: string;
  updated_at: string;
}

export interface WebSource {
  id: string;
  name: string;
  domain: string;
  base_url: string;
  trust_tier: SourceTrustTier;
  freshness_ttl_hours: number;
  last_retrieved_at?: string;
  updated_at: string;
}

export interface AdminHealthData {
  enabled: boolean;
  mode: string;
  base_url: string;
  circuit_breaker: "CLOSED" | "OPEN" | "HALF_OPEN";
  total_jobs_queued: number;
  total_jobs_running: number;
  total_jobs_completed: number;
  total_jobs_failed: number;
  total_documents_cached: number;
  telemetry: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_latency_ms: number;
    ssrf_blocks: number;
    domain_blocks: number;
    rate_limit_blocks: number;
    pages_crawled: number;
    pages_scraped: number;
    last_success_timestamp: number;
    last_failure_timestamp: number;
    last_error_message: string;
  };
}
