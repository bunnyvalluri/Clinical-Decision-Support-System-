/**
 * Dedicated Axios HTTP Client for Search API requests.
 * Injects Correlation IDs, JWT Bearer tokens, and handles timeouts safely.
 */
import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export function createSearchClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/search`,
    timeout: 8000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  client.interceptors.request.use((config) => {
    // Generate Correlation ID for every request
    const correlationId = `search-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    config.headers.set("X-Correlation-ID", correlationId);

    // Retrieve access token if available in client environment
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("auth-storage");
        if (stored) {
          const parsed = JSON.parse(stored);
          const token = parsed?.state?.accessToken;
          if (token) {
            config.headers.set("Authorization", `Bearer ${token}`);
          }
        }
      } catch {
        // Ignore JSON parse errors in storage
      }
    }

    return config;
  });

  return client;
}

export const searchAxiosClient = createSearchClient();
