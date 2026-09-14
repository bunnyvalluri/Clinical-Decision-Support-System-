import PocketBase from "pocketbase";

/**
 * Configuration options for the PocketBase client.
 */
export interface PocketBaseClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
}

/**
 * PocketBaseClient provides a controlled, defensive client abstraction for
 * auxiliary non-clinical microservice interactions.
 *
 * CRITICAL ARCHITECTURAL RULE:
 * This client must NEVER be used to query or mutate clinical records, EHR data,
 * vitals, ML predictions, or 21 CFR Part 11 audit trails. Neon PostgreSQL remains
 * the authoritative source of truth.
 */
export class PocketBaseClient {
  private static instance: PocketBaseClient | null = null;
  private client: PocketBase;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config?: PocketBaseClientConfig) {
    const rawUrl =
      config?.baseUrl ||
      (typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.POCKETBASE_URL
        : undefined);

    // Fallback to local default only in development/test, never assume hardcoded prod
    this.baseUrl = rawUrl && rawUrl.trim() !== "" ? rawUrl.trim() : "http://127.0.0.1:8090";
    this.timeoutMs = config?.timeoutMs ?? 5000;

    this.client = new PocketBase(this.baseUrl);
    // Configure default request timeout if supported
    this.client.autoCancellation(false);
  }

  /**
   * Returns a shared client instance for browser/client-side contexts.
   */
  public static getInstance(config?: PocketBaseClientConfig): PocketBaseClient {
    if (!PocketBaseClient.instance) {
      PocketBaseClient.instance = new PocketBaseClient(config);
    }
    return PocketBaseClient.instance;
  }

  /**
   * Creates a fresh, isolated client instance (crucial for server-side Next.js
   * rendering to prevent cross-request session contamination).
   */
  public static createIsolatedClient(config?: PocketBaseClientConfig): PocketBaseClient {
    return new PocketBaseClient(config);
  }

  /**
   * Access the underlying SDK instance within the controlled service layer.
   */
  public getRawClient(): PocketBase {
    return this.client;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Non-blocking health probe with timeout.
   */
  public async checkHealth(): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  }

  /**
   * Diagnostic ping with roundtrip latency measurement for infrastructure monitoring.
   */
  public async ping(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = (typeof performance !== "undefined" ? performance.now() : Date.now());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latencyMs = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - start);
      return {
        healthy: response.ok,
        latencyMs: latencyMs < 1 ? 1 : latencyMs,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const latencyMs = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - start);
      const message = err instanceof Error ? err.message : "Connection failed";
      return {
        healthy: false,
        latencyMs,
        error: message,
      };
    }
  }
}
