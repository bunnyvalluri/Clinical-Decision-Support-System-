"use client";

import { create } from "zustand";
import { tokenStorage } from "@/services/apiClient";

export type RoleType = "DOCTOR" | "NURSE" | "MEDICAL_INFORMATICIST" | "IT_ADMIN" | "ADMIN" | "ANALYST";

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
  loginAsRole: (role: RoleType) => void;
  initFromStorage: () => void;
}

const DEMO_PROFILES: Record<RoleType, UserProfile> = {
  DOCTOR: {
    id: "u-doc-001",
    email: "dr.elena.vance@hospital.org",
    username: "evance",
    full_name: "Dr. Elena Vance, MD",
    role: "DOCTOR",
    department: "Cardiology & Intensive Care",
    license_number: "MD-883921",
  },
  NURSE: {
    id: "u-nurse-002",
    email: "s.jenkins@hospital.org",
    username: "sjenkins",
    full_name: "Sarah Jenkins, RN",
    role: "NURSE",
    department: "Emergency Triage & Bedside",
    license_number: "RN-449102",
  },
  MEDICAL_INFORMATICIST: {
    id: "u-analyst-003",
    email: "alex.rivera@hospital.org",
    username: "arivera",
    full_name: "Alex Rivera, MSc",
    role: "MEDICAL_INFORMATICIST",
    department: "Clinical Informatics & Data Science",
    license_number: "BIO-10923",
  },
  ANALYST: {
    id: "u-analyst-003",
    email: "alex.rivera@hospital.org",
    username: "arivera",
    full_name: "Alex Rivera, MSc",
    role: "MEDICAL_INFORMATICIST",
    department: "Clinical Informatics & Data Science",
    license_number: "BIO-10923",
  },
  IT_ADMIN: {
    id: "u-admin-004",
    email: "m.chen@hospital.org",
    username: "mchen",
    full_name: "Marcus Chen",
    role: "IT_ADMIN",
    department: "IT Systems & Cybersecurity",
    license_number: "CISSP-98210",
  },
  ADMIN: {
    id: "u-admin-004",
    email: "m.chen@hospital.org",
    username: "mchen",
    full_name: "Marcus Chen",
    role: "IT_ADMIN",
    department: "IT Systems & Cybersecurity",
    license_number: "CISSP-98210",
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: DEMO_PROFILES.DOCTOR, // Default authenticated clinician for instant live demo experience
  accessToken: typeof window !== "undefined" ? tokenStorage.getAccess() : "demo-access-token",
  refreshToken: typeof window !== "undefined" ? tokenStorage.getRefresh() : "demo-refresh-token",
  isAuthenticated: true,
  isLoading: false,

  setAuth: (user, tokens) => {
    tokenStorage.setTokens(tokens);
    if (typeof window !== "undefined") {
      localStorage.setItem("clinical_ai_user", JSON.stringify(user));
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
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loginAsRole: (role) => {
    const profile = DEMO_PROFILES[role];
    const mockTokens = {
      access: `demo-${role.toLowerCase()}-jwt-access-token`,
      refresh: `demo-${role.toLowerCase()}-jwt-refresh-token`,
    };
    tokenStorage.setTokens(mockTokens);
    if (typeof window !== "undefined") {
      localStorage.setItem("clinical_ai_user", JSON.stringify(profile));
    }
    set({
      user: profile,
      accessToken: mockTokens.access,
      refreshToken: mockTokens.refresh,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  initFromStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const storedUser = localStorage.getItem("clinical_ai_user");
      const access = tokenStorage.getAccess();
      const refresh = tokenStorage.getRefresh();
      if (storedUser && access) {
        set({
          user: JSON.parse(storedUser),
          accessToken: access,
          refreshToken: refresh || "",
          isAuthenticated: true,
        });
      }
    } catch (e) {
      console.error("Failed to restore session from storage:", e);
    }
  },
}));
