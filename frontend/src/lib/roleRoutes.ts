/**
 * roleRoutes.ts — Canonical role → route namespace mapping.
 * Single source of truth used by middleware, login redirects,
 * and role guards throughout the application.
 */

import type { RoleType } from "@/features/auth/authStore";

/** Map each clinical role to its URL namespace root */
export function getRoleNamespace(role: RoleType | undefined | null): string {
  switch (role) {
    case "DOCTOR":
      return "doctor";
    case "NURSE":
      return "nurse";
    case "MEDICAL_INFORMATICIST":
    case "ANALYST":
      return "informaticist";
    case "IT_ADMIN":
    case "ADMIN":
      return "admin";
    case "PATIENT":
      return "user";
    default:
      return "doctor";
  }
}

/** Return the canonical dashboard URL for a given role */
export function getRoleDashboard(role: RoleType | undefined | null): string {
  return `/${getRoleNamespace(role)}/dashboard`;
}

/** Return true if the given pathname is within the role's authorized namespace */
export function isAuthorizedPath(
  role: RoleType | undefined | null,
  pathname: string
): boolean {
  const namespace = getRoleNamespace(role);
  return (
    pathname.startsWith(`/${namespace}/`) ||
    pathname === `/${namespace}` ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/forbidden" ||
    pathname === "/"
  );
}

/** Role display labels */
export const ROLE_LABELS: Record<string, string> = {
  DOCTOR: "Physician / Doctor",
  NURSE: "Triage & Bedside Nurse",
  MEDICAL_INFORMATICIST: "Medical Informaticist",
  ANALYST: "Medical Informaticist",
  IT_ADMIN: "IT System Administrator",
  ADMIN: "IT System Administrator",
  PATIENT: "Patient / Self-Service",
};

/** Role accent colors for badges */
export const ROLE_COLORS: Record<string, string> = {
  DOCTOR: "bg-emerald-50 text-emerald-800 border-emerald-200",
  NURSE: "bg-sky-50 text-sky-800 border-sky-200",
  MEDICAL_INFORMATICIST: "bg-purple-50 text-purple-800 border-purple-200",
  ANALYST: "bg-purple-50 text-purple-800 border-purple-200",
  IT_ADMIN: "bg-slate-100 text-slate-800 border-slate-300",
  ADMIN: "bg-slate-100 text-slate-800 border-slate-300",
  PATIENT: "bg-teal-50 text-teal-800 border-teal-200",
};
