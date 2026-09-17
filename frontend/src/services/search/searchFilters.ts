/**
 * Search filter helpers, builders, and sanitizers.
 */

export interface FilterState {
  riskLevel?: string;
  status?: string;
  department?: string;
  gender?: string;
  dateRange?: string;
  algorithm?: string;
}

export function buildSearchFilterPayload(filters: FilterState): Record<string, any> {
  const payload: Record<string, any> = {};

  if (filters.riskLevel && filters.riskLevel !== "ALL") {
    payload.prediction_result = filters.riskLevel;
  }
  if (filters.status && filters.status !== "ALL") {
    payload.status = filters.status;
  }
  if (filters.gender && filters.gender !== "ALL") {
    payload.gender = filters.gender;
  }
  if (filters.algorithm && filters.algorithm !== "ALL") {
    payload.algorithm = filters.algorithm;
  }

  return payload;
}

export function sanitizeSearchQuery(query: string): string {
  if (!query) return "";
  // Strip ANSI escape sequences, control characters, and truncate excessive length
  return query
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, 200);
}

