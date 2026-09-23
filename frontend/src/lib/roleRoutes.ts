/**
 * roleRoutes.ts — Canonical role → route namespace and authorization registry.
 * Single source of truth used by Edge middleware, client guards, login redirects,
 * and navigation shells throughout the clinical decision support application.
 */

import type { RoleType } from "@/features/auth/authStore";

export type RoleCategory = "user" | "doctor" | "nurse" | "informaticist" | "admin";

export interface RoleConfig {
  basePath: string;
  dashboard: string;
  roles: RoleType[];
  displayName: string;
}

/**
 * 1. Centralized Role Route Configuration
 */
export const roleRouteConfig: Record<RoleCategory, RoleConfig> = {
  user: {
    basePath: "/user",
    dashboard: "/user/dashboard",
    roles: ["PATIENT"],
    displayName: "Patient Health Portal",
  },
  doctor: {
    basePath: "/doctor",
    dashboard: "/doctor/dashboard",
    roles: ["DOCTOR"],
    displayName: "Physician Workspace",
  },
  nurse: {
    basePath: "/nurse",
    dashboard: "/nurse/dashboard",
    roles: ["NURSE"],
    displayName: "Triage & Bedside",
  },
  informaticist: {
    basePath: "/informaticist",
    dashboard: "/informaticist/dashboard",
    roles: ["MEDICAL_INFORMATICIST", "ANALYST"],
    displayName: "Medical Informatics",
  },
  admin: {
    basePath: "/admin",
    dashboard: "/admin/dashboard",
    roles: ["IT_ADMIN", "ADMIN"],
    displayName: "Hospital Administration",
  },
};

/**
 * 2. Explicit Role Route Registry
 * Complete registry of routes and parameterized patterns permitted for each role.
 */
export const ROLE_ROUTE_REGISTRY: Record<RoleCategory, string[]> = {
  doctor: [
    "/doctor/dashboard",
    "/doctor/patients",
    "/doctor/patients/:patientId",
    "/doctor/patients/:patientId/timeline",
    "/doctor/patients/:patientId/clinical-records",
    "/doctor/patients/:patientId/predictions",
    "/doctor/patients/:patientId/reviews",
    "/doctor/predictions",
    "/doctor/predictions/new",
    "/doctor/predictions/:predictionId",
    "/doctor/reviews",
    "/doctor/reviews/:reviewId",
    "/doctor/ai-assistant",
    "/doctor/reports",
    "/doctor/reports/:reportId",
    "/doctor/notifications",
    "/doctor/profile",
    "/doctor/settings",
  ],
  nurse: [
    "/nurse/dashboard",
    "/nurse/triage",
    "/nurse/triage/:triageId",
    "/nurse/patients",
    "/nurse/patients/:patientId",
    "/nurse/patients/:patientId/vitals",
    "/nurse/patients/:patientId/vitals/new",
    "/nurse/patients/:patientId/timeline",
    "/nurse/patients/:patientId/risk-screening",
    "/nurse/risk-screening",
    "/nurse/escalations",
    "/nurse/escalations/:escalationId",
    "/nurse/tasks",
    "/nurse/alerts",
    "/nurse/notifications",
    "/nurse/profile",
    "/nurse/settings",
  ],
  user: [
    "/user/dashboard",
    "/user/profile",
    "/user/medical-records",
    "/user/medical-records/:recordId",
    "/user/medical-records/timeline",
    "/user/vitals",
    "/user/vitals/history",
    "/user/vitals/:vitalId",
    "/user/risk",
    "/user/risk-assessment",
    "/user/risk-assessment/new",
    "/user/risk-assessment/:assessmentId",
    "/user/predictions",
    "/user/predictions/:predictionId",
    "/user/appointments",
    "/user/appointments/:appointmentId",
    "/user/reports",
    "/user/reports/:reportId",
    "/user/notifications",
    "/user/messages",
    "/user/messages/:conversationId",
    "/user/tasks",
    "/user/health-summary",
    "/user/consent",
    "/user/privacy",
    "/user/settings",
    "/user/security",
  ],
  informaticist: [
    "/informaticist/dashboard",
    "/informaticist/data-quality",
    "/informaticist/data-quality/issues",
    "/informaticist/data-quality/issues/:issueId",
    "/informaticist/models",
    "/informaticist/models/:modelId",
    "/informaticist/models/registry",
    "/informaticist/models/evaluations",
    "/informaticist/models/evaluations/:evaluationId",
    "/informaticist/drift",
    "/informaticist/drift/features",
    "/informaticist/drift/predictions",
    "/informaticist/analytics",
    "/informaticist/analytics/predictions",
    "/informaticist/analytics/clinical-workflow",
    "/informaticist/ai-evaluation",
    "/informaticist/reports",
    "/informaticist/audit",
    "/informaticist/profile",
    "/informaticist/settings",
  ],
  admin: [
    "/admin/dashboard",
    "/admin/users",
    "/admin/users/:userId",
    "/admin/roles",
    "/admin/roles/:roleId",
    "/admin/permissions",
    "/admin/services",
    "/admin/services/:service",
    "/admin/health",
    "/admin/monitoring",
    "/admin/incidents",
    "/admin/database",
    "/admin/redis",
    "/admin/celery",
    "/admin/websockets",
    "/admin/security",
    "/admin/security/events",
    "/admin/audit",
    "/admin/audit/:auditId",
    "/admin/logs",
    "/admin/logs/application",
    "/admin/logs/security",
    "/admin/configuration",
    "/admin/profile",
    "/admin/settings",
  ],
};

/**
 * Normalizes role string to canonical RoleCategory
 */
export function getRoleCategory(role: RoleType | string | undefined | null): RoleCategory {
  if (!role) return "doctor";
  const r = role.toUpperCase();
  if (r === "DOCTOR") return "doctor";
  if (r === "NURSE") return "nurse";
  if (r === "MEDICAL_INFORMATICIST" || r === "ANALYST") return "informaticist";
  if (r === "IT_ADMIN" || r === "ADMIN") return "admin";
  if (r === "PATIENT" || r === "ROLE_PATIENT" || r === "USER" || r === "ROLE_USER") return "user";
  return "doctor";
}

/** Map each clinical role to its URL namespace root */
export function getRoleNamespace(role: RoleType | string | undefined | null): string {
  const category = getRoleCategory(role);
  return roleRouteConfig[category].basePath.replace(/^\//, "");
}

/** Return the canonical dashboard URL for a given role */
export function getRoleDashboard(role: RoleType | string | undefined | null): string {
  const category = getRoleCategory(role);
  return roleRouteConfig[category].dashboard;
}

/**
 * Checks if a pathname matches a parameterized route pattern
 * e.g. "/doctor/patients/:patientId" matches "/doctor/patients/123"
 */
export function matchRoutePattern(pattern: string, pathname: string): boolean {
  // Normalize trailing slash
  const cleanPattern = pattern.replace(/\/+$/, "") || "/";
  const cleanPathname = pathname.replace(/\/+$/, "") || "/";

  if (cleanPattern === cleanPathname) return true;

  const patternSegments = cleanPattern.split("/").filter(Boolean);
  const pathSegments = cleanPathname.split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) return false;

  return patternSegments.every((seg, idx) => {
    if (seg.startsWith(":")) return true; // parameter match
    return seg === pathSegments[idx];
  });
}

/**
 * Check if the given pathname is authorized for the specified role.
 * Validates against the role's base path namespace and registry patterns.
 */
export function isRouteAllowedForRole(
  role: RoleType | string | undefined | null,
  pathname: string
): boolean {
  if (!role) return false;

  const category = getRoleCategory(role);
  const config = roleRouteConfig[category];

  // If path starts with role's base path, check if it belongs to their namespace
  if (pathname.startsWith(`${config.basePath}/`) || pathname === config.basePath) {
    return true;
  }

  return false;
}

/**
 * Return true if the given pathname is within the role's authorized namespace.
 * Backward compatibility helper for existing callers.
 */
export function isAuthorizedPath(
  role: RoleType | string | undefined | null,
  pathname: string
): boolean {
  return isRouteAllowedForRole(role, pathname);
}

/**
 * Centralized Route Authorization Resolver
 * Given an authenticated role and a requested pathname:
 * - If allowed, returns null (no redirect required).
 * - If unauthorized, returns the user's authorized role dashboard.
 */
export function resolveRoleRedirect(
  role: RoleType | string | undefined | null,
  pathname: string
): string | null {
  if (!role) return "/login";

  if (isRouteAllowedForRole(role, pathname)) {
    return null;
  }

  // Cross-role or unauthorized route access -> redirect directly to own dashboard
  return getRoleDashboard(role);
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
