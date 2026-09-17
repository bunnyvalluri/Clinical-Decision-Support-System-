/**
 * Telemetry and health state management for NocoDB.
 */
import { useState, useEffect } from "react";
import { nocodbClient } from "./nocodbClient";
import type { NocoDBHealthTelemetry } from "./types";

export function useNocoDBHealth(pollIntervalMs: number = 30000) {
  const [health, setHealth] = useState<NocoDBHealthTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const data = await nocodbClient.getHealth();
        if (isMounted) {
          setHealth(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to reach NocoDB telemetry endpoint.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, pollIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pollIntervalMs]);

  return { health, isLoading, error };
}
