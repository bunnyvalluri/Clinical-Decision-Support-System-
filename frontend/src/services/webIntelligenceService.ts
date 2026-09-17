/**
 * Web Intelligence Service — API Client for Firecrawl integration.
 * Connects to /api/v1/web/ endpoints.
 */
import apiClient from "./apiClient";
import type {
  AdminHealthData,
  DomainPolicy,
  NormalizedDocument,
  SearchResponseData,
  WebCrawlJob,
  WebDocument,
  WebResearchSession,
  WebSource,
} from "@/types/webIntelligence";

export const webIntelligenceService = {
  // Search
  search: async (query: string, limit = 10, domain?: string): Promise<SearchResponseData> => {
    const res = await apiClient.post("/web/search/", { query, limit, domain });
    return res.data?.data || res.data;
  },

  // Scrape single URL
  scrape: async (url: string, onlyMainContent = true): Promise<NormalizedDocument> => {
    const res = await apiClient.post("/web/scrape/", { url, only_main_content: onlyMainContent });
    return res.data?.data || res.data;
  },

  // Map website links
  mapWebsite: async (url: string, search?: string, limit = 100): Promise<{ url: string; links: string[]; total_links: number }> => {
    const res = await apiClient.post("/web/map/", { url, search, limit });
    return res.data?.data || res.data;
  },

  // Crawl website
  startCrawl: async (url: string, limit = 25, maxDepth = 2, idempotencyKey?: string): Promise<WebCrawlJob> => {
    const res = await apiClient.post("/web/crawl/", {
      url,
      limit,
      max_depth: maxDepth,
      idempotency_key: idempotencyKey,
    });
    return res.data?.data || res.data;
  },

  // Batch scrape
  batchScrape: async (urls: string[]): Promise<{ task_id: string; urls_queued: number }> => {
    const res = await apiClient.post("/web/batch/", { urls });
    return res.data?.data || res.data;
  },

  // Extract structured JSON
  extract: async (urls: string[], schema: Record<string, any>, prompt?: string): Promise<any> => {
    const res = await apiClient.post("/web/extract/", { urls, schema, prompt });
    return res.data?.data || res.data;
  },

  // Evidence research sessions
  createResearch: async (query: string, mode = "MEDICAL_EVIDENCE"): Promise<WebResearchSession> => {
    const res = await apiClient.post("/web/research/", { query, mode });
    return res.data?.data || res.data;
  },

  getResearch: async (sessionId: string): Promise<WebResearchSession> => {
    const res = await apiClient.get(`/web/research/${sessionId}/`);
    return res.data?.data || res.data;
  },

  reviewResearch: async (sessionId: string, status: string, reviewNotes?: string): Promise<WebResearchSession> => {
    const res = await apiClient.post(`/web/research/${sessionId}/review/`, {
      status,
      review_notes: reviewNotes,
    });
    return res.data?.data || res.data;
  },

  // Jobs
  getJobs: async (): Promise<WebCrawlJob[]> => {
    const res = await apiClient.get("/web/jobs/");
    return res.data?.data || res.data || [];
  },

  getJob: async (jobId: string): Promise<WebCrawlJob> => {
    const res = await apiClient.get(`/web/jobs/${jobId}/`);
    return res.data?.data || res.data;
  },

  cancelJob: async (jobId: string): Promise<{ message: string; status: string }> => {
    const res = await apiClient.post(`/web/jobs/${jobId}/cancel/`);
    return res.data?.data || res.data;
  },

  // Sources & Domain Policies
  getSources: async (): Promise<{ sources: WebSource[]; policies: DomainPolicy[] }> => {
    const res = await apiClient.get("/web/sources/");
    return res.data?.data || { sources: [], policies: [] };
  },

  addDomainPolicy: async (policy: Partial<DomainPolicy>): Promise<DomainPolicy> => {
    const res = await apiClient.post("/web/sources/manage/", policy);
    return res.data?.data || res.data;
  },

  getDocuments: async (): Promise<WebDocument[]> => {
    const res = await apiClient.get("/web/documents/");
    return res.data?.data || [];
  },

  // Admin Health & Telemetry
  getAdminHealth: async (): Promise<AdminHealthData> => {
    const res = await apiClient.get("/web/admin/health/");
    return res.data?.data || res.data;
  },
};
