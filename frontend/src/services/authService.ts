/**
 * Centralized Authentication & Logout Service for HealthNova AI.
 *
 * Implements end-to-end security invalidation:
 * 1. Blacklists JWT refresh token in Django/Neon PostgreSQL via POST /api/v1/auth/logout/
 * 2. Clears server-side HTTP cookies via POST /api/auth/logout
 * 3. Purges client-side credentials from localStorage, sessionStorage, and document cookies
 * 4. Tears down active realtime WebSockets cleanly (code 1000) and disables auto-reconnect
 * 5. Clears sensitive user-specific stores (e.g. clinicalStore notifications and alerts)
 * 6. Broadcasts logout event across all browser tabs via BroadcastChannel & storage events
 * 7. Redirects to /login?logout=true
 */

import apiClient, { tokenStorage } from "@/services/apiClient";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export const AUTH_CHANNEL_NAME = "healthnova_auth_channel";
export const LOGOUT_STORAGE_KEY = "healthnova_logout_timestamp";
export const TEARDOWN_REALTIME_EVENT = "healthnova:teardown-realtime";

export interface LogoutOptions {
  /** Skip backend API call (e.g. in offline fallback mode) */
  skipApi?: boolean;
}

/**
 * Dispatches a client-wide event to cleanly tear down all active realtime WebSockets
 * and disable auto-reconnection.
 */
export function teardownRealtimeConnections(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TEARDOWN_REALTIME_EVENT));
  }
}

/**
 * Clears all client-side authentication tokens, cookies, and cached profile data.
 */
export function clearClientAuthData(): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Clear token storage
    tokenStorage.clear();

    // 2. Clear user profile and cached auth state
    localStorage.removeItem("clinical_ai_user");
    localStorage.removeItem("clinical_ai_access_token");
    localStorage.removeItem("clinical_ai_refresh_token");
    sessionStorage.clear();

    // 3. Clear all authentication and role cookies across domain/paths
    const cookiesToClear = [
      "clinical_role",
      "user_role",
      "clinical_access_token",
      "clinical_refresh_token",
    ];

    for (const name of cookiesToClear) {
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `${name}=; path=/; samesite=strict; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    }

    // 4. Reset user-specific clinical store state
    const clinicalStore = useClinicalStore.getState();
    if (clinicalStore && typeof clinicalStore.resetClinicalState === "function") {
      clinicalStore.resetClinicalState();
    }
  } catch (err) {
    console.error("[AuthService] Error clearing client auth data:", err);
  }
}

/**
 * Broadcasts logout event to all other open tabs in the same browser session.
 */
export function broadcastLogout(): void {
  if (typeof window === "undefined") return;

  try {
    // Broadcast via BroadcastChannel
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channel.postMessage({ type: "LOGOUT", timestamp: Date.now() });
      channel.close();
    }

    // Fallback broadcast via localStorage event
    localStorage.setItem(LOGOUT_STORAGE_KEY, Date.now().toString());
  } catch (err) {
    console.warn("[AuthService] Failed to broadcast logout event:", err);
  }
}

/**
 * Executes full centralized logout sequence.
 * Throws on genuine backend errors unless explicitly safe to proceed.
 */
export async function performCentralizedLogout(options: LogoutOptions = {}): Promise<void> {
  const refreshToken = tokenStorage.getRefresh();

  // 1. Invalidate refresh token on Django REST backend if available and not skipped
  if (!options.skipApi && refreshToken) {
    try {
      await apiClient.post("/auth/logout/", { refresh: refreshToken });
    } catch (apiError: unknown) {
      const err = apiError as { response?: { status?: number; data?: Record<string, unknown> } };
      // 400 with "Token invalid or already revoked" is acceptable (already blacklisted)
      if (err?.response?.status !== 400 && err?.response?.status !== 401) {
        console.error("[AuthService] Backend logout failed:", apiError);
        // Do not silently ignore server errors (500 etc)
        throw apiError;
      }
    }
  }

  // 2. Invalidate Next.js edge cookies
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Next.js internal route failure; client cookies will still be purged directly
  }

  // 3. Teardown active realtime connections before clearing auth tokens
  teardownRealtimeConnections();

  // 4. Purge client storage and cookies
  clearClientAuthData();

  // 5. Broadcast to other tabs
  broadcastLogout();

  // 6. Redirect to login with logout query parameter
  if (typeof window !== "undefined") {
    window.location.href = "/login?logout=true";
  }
}

/**
 * Initializes multi-tab logout listener so any other open tab
 * immediately drops auth and redirects to login when logout occurs in another tab.
 */
export function initMultiTabAuthSync(onRemoteLogout: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let channel: BroadcastChannel | null = null;

  if ("BroadcastChannel" in window) {
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === "LOGOUT") {
          onRemoteLogout();
        }
      };
    } catch (e) {
      console.warn("[AuthService] BroadcastChannel init error:", e);
    }
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
      onRemoteLogout();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    if (channel) {
      channel.close();
    }
    window.removeEventListener("storage", handleStorage);
  };
}
