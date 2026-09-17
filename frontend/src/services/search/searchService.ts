/**
 * Search Service API Wrapper.
 * Dispatches queries to Django /api/v1/search/ endpoints with AbortController support.
 */
import { searchAxiosClient } from "./searchClient";
import {
  type SearchRequest,
  type SearchResponse,
  type SearchSuggestion,
  type SearchHealthStatus,
  type SearchTask,
  type SearchIndexMetadata,
} from "./searchTypes";
import { sanitizeSearchQuery } from "./searchFilters";
import { searchAnalytics } from "./searchAnalytics";

export class SearchService {
  /**
   * Execute authorization-aware search across indexes.
   */
  public static async search(
    request: SearchRequest,
    signal?: AbortSignal
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const cleanQuery = sanitizeSearchQuery(request.q || "");

    const params: Record<string, any> = {
      q: cleanQuery,
      page: request.page || 1,
      limit: request.limit || 20,
      highlight: request.highlight !== false,
    };

    if (request.index) {
      params.index = request.index;
    }
    if (request.sort) {
      params.sort = request.sort;
    }
    if (request.filters && Object.keys(request.filters).length > 0) {
      params.filters = JSON.stringify(request.filters);
    }
    if (request.facets && request.facets.length > 0) {
      params.facets = request.facets;
    }

    try {
      const response = await searchAxiosClient.get("/", {
        params,
        signal,
      });

      const data: SearchResponse = response.data.data;
      const duration = Date.now() - startTime;

      searchAnalytics.trackSearch(
        request.index || "all",
        cleanQuery,
        data.hits?.length || 0,
        duration,
        data.search_mode || "meilisearch"
      );

      return data;
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        throw error;
      }

      // Return graceful offline fallback
      return {
        hits: [],
        total: 0,
        page: request.page || 1,
        limit: request.limit || 20,
        total_pages: 0,
        processing_time_ms: Date.now() - startTime,
        search_mode: "unavailable",
        error: error?.response?.data?.error || "Search service is currently unreachable.",
      };
    }
  }

  /**
   * Fetch controlled autocomplete suggestions.
   */
  public static async getSuggestions(
    query: string,
    index?: string,
    signal?: AbortSignal
  ): Promise<SearchSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const response = await searchAxiosClient.get("/suggestions/", {
        params: { q: query.trim(), index },
        signal,
      });
      return response.data.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch facet counts for an index.
   */
  public static async getFacets(
    index: string = "patients",
    signal?: AbortSignal
  ): Promise<Record<string, Record<string, number>>> {
    try {
      const response = await searchAxiosClient.get("/facets/", {
        params: { index },
        signal,
      });
      return response.data.data || {};
    } catch {
      return {};
    }
  }

  /**
   * Retrieve Meilisearch cluster health and telemetry.
   */
  public static async getHealth(): Promise<SearchHealthStatus> {
    try {
      const response = await searchAxiosClient.get("/health/");
      return response.data.data;
    } catch {
      return {
        status: "UNAVAILABLE",
        engine: "meilisearch",
        version: "1.12.0",
        reachable: false,
        database_size_bytes: 0,
        indexes_count: 0,
        active_indexes: [],
        tasks_queued: 0,
        fallback_mode: "POSTGRESQL_DEGRADED_READY",
      };
    }
  }

  /**
   * Fetch async tasks from Meilisearch (IT Admin only).
   */
  public static async getTasks(): Promise<SearchTask[]> {
    try {
      const response = await searchAxiosClient.get("/tasks/");
      return response.data.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Trigger index reindexing (IT Admin / Informaticist only).
   */
  public static async triggerReindex(index?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await searchAxiosClient.post("/reindex/", { index });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.error || "Failed to trigger reindexing.",
      };
    }
  }

  /**
   * List authorized indexes and configuration schemas.
   */
  public static async getIndexes(): Promise<SearchIndexMetadata[]> {
    try {
      const response = await searchAxiosClient.get("/indexes/");
      return response.data.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Request a short-lived tenant token for direct client search.
   */
  public static async getTenantToken(): Promise<string | null> {
    try {
      const response = await searchAxiosClient.get("/tenant-token/");
      return response.data.token || null;
    } catch {
      return null;
    }
  }
}
