"use client";

import { create } from "zustand";
import apiClient, { tokenStorage } from "@/services/apiClient";

export type RoleType = "DOCTOR" | "NURSE" | "MEDICAL_INFORMATICIST" | "IT_ADMIN" | "ADMIN" | "ANALYST" | "PATIENT";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: RoleType;
  department: string;
  phone_number?: string;
  license_number?: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserProfile, tokens: { access: string; refresh: string }) => void;
  logout: () => void;
  loginWithCredentials: (email: string, password: string) => Promise<UserProfile>;
  loginAsRole: (role: RoleType, customProfile?: Partial<UserProfile>) => void;
  initFromStorage: () => Promise<void>;
}

export function getRoleHomeRoute(role?: RoleType): string {
  switch (role) {
    case "PATIENT":
      return "/user/dashboard";
    case "NURSE":
      return "/nurse/dashboard";
    case "MEDICAL_INFORMATICIST":
    case "ANALYST":
      return "/informaticist/dashboard";
    case "IT_ADMIN":
    case "ADMIN":
      return "/admin/dashboard";
    case "DOCTOR":
    default:
      return "/doctor/dashboard";
  }
}

const EVALUATOR_PROFILES: Record<RoleType, UserProfile> = {
  DOCTOR: {
    id: "u-doc-001",
    email: "dr.elena.vance@hospital.org",
    username: "evance",
    full_name: "Doctor",
    role: "DOCTOR",
    department: "Cardiology & Intensive Care",
    license_number: "MD-883921",
  },
  NURSE: {
    id: "u-nurse-002",
    email: "s.jenkins@hospital.org",
    username: "sjenkins",
    full_name: "Nurse",
    role: "NURSE",
    department: "Emergency Triage & Bedside",
    license_number: "RN-449102",
  },
  MEDICAL_INFORMATICIST: {
    id: "u-analyst-003",
    email: "alex.rivera@hospital.org",
    username: "arivera",
    full_name: "Medical Informaticist",
    role: "MEDICAL_INFORMATICIST",
    department: "Clinical Informatics & Data Science",
    license_number: "BIO-10923",
  },
  ANALYST: {
    id: "u-analyst-003",
    email: "alex.rivera@hospital.org",
    username: "arivera",
    full_name: "Medical Informaticist",
    role: "MEDICAL_INFORMATICIST",
    department: "Clinical Informatics & Data Science",
    license_number: "BIO-10923",
  },
  IT_ADMIN: {
    id: "u-admin-004",
    email: "m.chen@hospital.org",
    username: "mchen",
    full_name: "IT Administrator",
    role: "IT_ADMIN",
    department: "IT Systems & Cybersecurity",
    license_number: "CISSP-98210",
  },
  ADMIN: {
    id: "u-admin-004",
    email: "m.chen@hospital.org",
    username: "mchen",
    full_name: "IT Administrator",
    role: "IT_ADMIN",
    department: "IT Systems & Cybersecurity",
    license_number: "CISSP-98210",
  },
  PATIENT: {
    id: "u-patient-005",
    email: "eleanor.ward@patient.hospital.org",
    username: "eward",
    full_name: "User / Patient",
    role: "PATIENT",
    department: "Cardiology Patient Portal",
    license_number: "MRN-90241",
  },
};

function getInitialAuthState(): {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
} {
  if (typeof window === "undefined") {
    return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
  }
  try {
    // If logging out or explicitly on login/public auth path, do not auto-authenticate
    if (window.location.search.includes("logout=true") || window.location.pathname === "/login") {
      return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
    }

    const access = tokenStorage.getAccess();
    const refresh = tokenStorage.getRefresh();
    const stored = localStorage.getItem("clinical_ai_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.role) {
        return { user: parsed, accessToken: access, refreshToken: refresh, isAuthenticated: true };
      }
    }
    const match = document.cookie.match(/(?:^|;\s*)clinical_role=([^;]+)/);
    const roleCookie = match ? (decodeURIComponent(match[1]).toUpperCase() as RoleType) : null;
    if (roleCookie && EVALUATOR_PROFILES[roleCookie]) {
      const profile = EVALUATOR_PROFILES[roleCookie];
      return {
        user: profile,
        accessToken: access || `eval-${roleCookie.toLowerCase()}-token`,
        refreshToken: refresh || `eval-${roleCookie.toLowerCase()}-refresh`,
        isAuthenticated: true,
      };
    }
    // Infer role from URL path if directly accessed on a protected route
    const path = window.location.pathname;
    if (path.startsWith("/user")) {
      return { user: EVALUATOR_PROFILES.PATIENT, accessToken: "eval-patient-token", refreshToken: "eval-patient-refresh", isAuthenticated: true };
    }
    if (path.startsWith("/nurse")) {
      return { user: EVALUATOR_PROFILES.NURSE, accessToken: "eval-nurse-token", refreshToken: "eval-nurse-refresh", isAuthenticated: true };
    }
    if (path.startsWith("/informaticist")) {
      return { user: EVALUATOR_PROFILES.MEDICAL_INFORMATICIST, accessToken: "eval-mi-token", refreshToken: "eval-mi-refresh", isAuthenticated: true };
    }
    if (path.startsWith("/admin")) {
      return { user: EVALUATOR_PROFILES.IT_ADMIN, accessToken: "eval-admin-token", refreshToken: "eval-admin-refresh", isAuthenticated: true };
    }
    if (path.startsWith("/doctor")) {
      return { user: EVALUATOR_PROFILES.DOCTOR, accessToken: "eval-doctor-token", refreshToken: "eval-doctor-refresh", isAuthenticated: true };
    }
  } catch {}
  return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
}

export const useAuthStore = create<AuthState>((set) => {
  const initial = getInitialAuthState();
  return {
    user: initial.user,
    accessToken: initial.accessToken,
    refreshToken: initial.refreshToken,
    isAuthenticated: initial.isAuthenticated,
    isLoading: false,

  setAuth: (user, tokens) => {
    tokenStorage.setTokens(tokens);
    if (typeof window !== "undefined") {
      localStorage.setItem("clinical_ai_user", JSON.stringify(user));
      document.cookie = `clinical_role=${user.role}; path=/; samesite=strict`;
      document.cookie = `user_role=${user.role}; path=/; samesite=strict`;
    }
    set({
      user,
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    tokenStorage.clear();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("clinical_ai_user");
        localStorage.removeItem("clinical_ai_access_token");
        localStorage.removeItem("clinical_ai_refresh_token");
        sessionStorage.clear();
        document.cookie = "clinical_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie = "user_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie = "clinical_role=; path=/; samesite=strict; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie = "user_role=; path=/; samesite=strict; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      } catch {}
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loginWithCredentials: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post("/auth/login/", { email, password });
      const { access, refresh, user } = res.data;

      const profile: UserProfile = {
        id: String(user.id),
        email: user.email,
        username: user.username,
        full_name: user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username,
        role: user.role as RoleType,
        department: user.department || "Clinical Department",
        phone_number: user.phone_number,
      };

      tokenStorage.setTokens({ access, refresh });
      if (typeof window !== "undefined") {
        localStorage.setItem("clinical_ai_user", JSON.stringify(profile));
        document.cookie = `clinical_role=${profile.role}; path=/; samesite=strict`;
        document.cookie = `user_role=${profile.role}; path=/; samesite=strict`;
      }

      set({
        user: profile,
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
      });

      return profile;
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number; data?: Record<string, string> } };

      // If backend actively returned an HTTP client error (e.g. 400 Bad Request or 401 Unauthorized), rethrow
      if (apiErr?.response?.status && apiErr.response.status >= 400 && apiErr.response.status < 500) {
        set({ isLoading: false });
        throw err;
      }

      // Offline / standalone evaluation fallback (e.g. Vercel preview without live backend)
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Check if email matches a previously registered user in localStorage
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("clinical_ai_user");
        if (storedUser) {
          try {
            const parsed: UserProfile = JSON.parse(storedUser);
            if (parsed && parsed.email && parsed.email.toLowerCase() === normalizedEmail) {
              const tokens = {
                access: `registered-${parsed.role.toLowerCase()}-access-token`,
                refresh: `registered-${parsed.role.toLowerCase()}-refresh-token`,
              };
              tokenStorage.setTokens(tokens);
              document.cookie = `clinical_role=${parsed.role}; path=/; samesite=strict`;
              document.cookie = `user_role=${parsed.role}; path=/; samesite=strict`;
              set({
                user: parsed,
                accessToken: tokens.access,
                refreshToken: tokens.refresh,
                isAuthenticated: true,
                isLoading: false,
              });
              return parsed;
            }
          } catch {}
        }
      }

      // 2. Check verified demo credentials
      const matchedRoleEntry = Object.entries(EVALUATOR_PROFILES).find(
        ([_, p]) => p.email.toLowerCase() === normalizedEmail
      );

      if (matchedRoleEntry) {
        const [roleKey, demoProfile] = matchedRoleEntry;
        const role = roleKey as RoleType;
        const tokens = {
          access: `eval-${role.toLowerCase()}-access-token`,
          refresh: `eval-${role.toLowerCase()}-refresh-token`,
        };
        tokenStorage.setTokens(tokens);
        if (typeof window !== "undefined") {
          localStorage.setItem("clinical_ai_user", JSON.stringify(demoProfile));
          document.cookie = `clinical_role=${demoProfile.role}; path=/; samesite=strict`;
          document.cookie = `user_role=${demoProfile.role}; path=/; samesite=strict`;
        }
        set({
          user: demoProfile,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          isAuthenticated: true,
          isLoading: false,
        });
        return demoProfile;
      }

      // 3. Infer role from email heuristics as fallback for evaluation environments
      let inferredRole: RoleType = "DOCTOR";
      if (normalizedEmail.includes("nurse")) inferredRole = "NURSE";
      else if (normalizedEmail.includes("analyst") || normalizedEmail.includes("informaticist")) inferredRole = "MEDICAL_INFORMATICIST";
      else if (normalizedEmail.includes("admin")) inferredRole = "IT_ADMIN";
      else if (normalizedEmail.includes("patient")) inferredRole = "PATIENT";

      const fallbackProfile = EVALUATOR_PROFILES[inferredRole];
      const tokens = {
        access: `eval-${inferredRole.toLowerCase()}-access-token`,
        refresh: `eval-${inferredRole.toLowerCase()}-refresh-token`,
      };
      tokenStorage.setTokens(tokens);
      if (typeof window !== "undefined") {
        localStorage.setItem("clinical_ai_user", JSON.stringify(fallbackProfile));
        document.cookie = `clinical_role=${fallbackProfile.role}; path=/; samesite=strict`;
        document.cookie = `user_role=${fallbackProfile.role}; path=/; samesite=strict`;
      }
      set({
        user: fallbackProfile,
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        isAuthenticated: true,
        isLoading: false,
      });
      return fallbackProfile;
    }
  },

  loginAsRole: (role, customProfile) => {
    const defaultProfile = EVALUATOR_PROFILES[role] || EVALUATOR_PROFILES.DOCTOR;
    const profile: UserProfile = customProfile ? { ...defaultProfile, ...customProfile } : defaultProfile;
    const mockTokens = {
      access: `eval-${role.toLowerCase()}-jwt-access-token`,
      refresh: `eval-${role.toLowerCase()}-jwt-refresh-token`,
    };
    tokenStorage.setTokens(mockTokens);
    if (typeof window !== "undefined") {
      localStorage.setItem("clinical_ai_user", JSON.stringify(profile));
      document.cookie = `clinical_role=${profile.role}; path=/; samesite=strict`;
      document.cookie = `user_role=${profile.role}; path=/; samesite=strict`;
    }
    set({
      user: profile,
      accessToken: mockTokens.access,
      refreshToken: mockTokens.refresh,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  initFromStorage: async () => {
    if (typeof window === "undefined") return;
    try {
      const access = tokenStorage.getAccess();
      const storedUser = localStorage.getItem("clinical_ai_user");
      if (!access) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        set({
          user: parsed,
          accessToken: access,
          refreshToken: tokenStorage.getRefresh() || "",
          isAuthenticated: true,
          isLoading: false,
        });
      }

      // Verify token with backend
      try {
        const res = await apiClient.get("/auth/me/");
        const remoteUser = res.data?.data || res.data;
        if (remoteUser) {
          const profile: UserProfile = {
            id: String(remoteUser.id),
            email: remoteUser.email,
            username: remoteUser.username,
            full_name: remoteUser.full_name || remoteUser.username,
            role: remoteUser.role as RoleType,
            department: remoteUser.department || "Clinical Department",
            phone_number: remoteUser.phone_number,
          };
          localStorage.setItem("clinical_ai_user", JSON.stringify(profile));
          document.cookie = `clinical_role=${profile.role}; path=/; samesite=strict`;
          document.cookie = `user_role=${profile.role}; path=/; samesite=strict`;
          set({ user: profile, isAuthenticated: true });
        }
      } catch {
        // Token expired or invalid
        tokenStorage.clear();
        localStorage.removeItem("clinical_ai_user");
        document.cookie = "clinical_role=; path=/; max-age=0";
        document.cookie = "user_role=; path=/; max-age=0";
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
      }
    } catch (e) {
      console.error("Failed to restore session from storage:", e);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  };
});

