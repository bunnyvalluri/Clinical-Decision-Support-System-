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
  loginAsRole: (role: RoleType) => void;
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: typeof window !== "undefined" ? tokenStorage.getAccess() : null,
  refreshToken: typeof window !== "undefined" ? tokenStorage.getRefresh() : null,
  isAuthenticated: false,
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
      localStorage.removeItem("clinical_ai_user");
      document.cookie = "clinical_role=; path=/; max-age=0";
      document.cookie = "user_role=; path=/; max-age=0";
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
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  loginAsRole: (role) => {
    const profile = EVALUATOR_PROFILES[role] || EVALUATOR_PROFILES.DOCTOR;
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
}));
