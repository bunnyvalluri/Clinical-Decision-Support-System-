"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useAuthStore } from "@/features/auth/authStore";
import { getRoleDashboard } from "@/lib/roleRoutes";

/** Maps URL segments to human-readable labels */
const SEGMENT_LABELS: Record<string, string> = {
  doctor: "Doctor",
  nurse: "Nurse",
  informaticist: "Informatics",
  admin: "Admin",
  dashboard: "Dashboard",
  patients: "Patients",
  predictions: "Predictions",
  reviews: "Reviews",
  "ai-assistant": "AI Assistant",
  reports: "Reports",
  notifications: "Notifications",
  profile: "Profile",
  settings: "Settings",
  triage: "Triage",
  vitals: "Vitals",
  "risk-screening": "Risk Screening",
  escalations: "Escalations",
  tasks: "Tasks",
  alerts: "Alerts",
  "data-quality": "Data Quality",
  models: "Models",
  evaluations: "Evaluations",
  registry: "Registry",
  drift: "Drift",
  analytics: "Analytics",
  "ai-evaluation": "AI Evaluation",
  audit: "Audit",
  users: "Users",
  roles: "Roles",
  permissions: "Permissions",
  services: "Services",
  health: "Health",
  database: "Database",
  redis: "Redis",
  celery: "Celery",
  websockets: "WebSockets",
  security: "Security",
  logs: "Logs",
  configuration: "Configuration",
  new: "New",
  timeline: "Timeline",
  "clinical-records": "Clinical Records",
  issues: "Issues",
  features: "Features",
  "clinical-workflow": "Clinical Workflow",
  events: "Events",
  application: "Application",
};

function formatSegment(segment: string): string {
  // Dynamic segments like [id] values — try to shorten for display
  if (segment.length > 20) {
    return segment.slice(0, 8) + "…";
  }
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const homeHref = getRoleDashboard(user?.role);

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = formatSegment(segment);
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500 flex-wrap">
      <Link
        href={homeHref}
        className="flex items-center gap-1 hover:text-slate-800 transition-colors"
        title="Authorized Dashboard"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map(({ href, label, isLast }) => (
        <React.Fragment key={href}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          {isLast ? (
            <span className="font-medium text-slate-800 truncate max-w-[140px]">{label}</span>
          ) : (
            <Link
              href={href}
              className="hover:text-slate-800 transition-colors truncate max-w-[120px]"
            >
              {label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
