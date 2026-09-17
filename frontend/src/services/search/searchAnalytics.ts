/**
 * Client-Side Search Analytics & Performance Telemetry.
 * Strictly adheres to HIPAA minimization: does not log patient names or MRNs.
 */

export interface SearchTelemetryRecord {
  category: string;
  queryLength: number;
  resultCount: number;
  durationMs: number;
  searchMode: string;
  timestamp: number;
}

class SearchAnalytics {
  private recentRecords: SearchTelemetryRecord[] = [];

  public trackSearch(
    category: string,
    query: string,
    resultCount: number,
    durationMs: number,
    searchMode: string
  ): void {
    const record: SearchTelemetryRecord = {
      category,
      queryLength: (query || "").length,
      resultCount,
      durationMs,
      searchMode,
      timestamp: Date.now(),
    };

    this.recentRecords.unshift(record);
    if (this.recentRecords.length > 50) {
      this.recentRecords.pop();
    }
  }

  public getRecentTelemetry(): SearchTelemetryRecord[] {
    return [...this.recentRecords];
  }
}

export const searchAnalytics = new SearchAnalytics();
