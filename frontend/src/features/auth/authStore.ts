"use client";

import { create } from "zustand";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: "ADMIN" | "DOCTOR" | "NURSE" | "ANALYST";
  department: string;
  phone_number?: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, tokens: { access: string; refresh: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: (user, tokens) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
    }
    set({
      user,
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      isAuthenticated: true,
    });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
