"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  ClipboardList,
  Database,
  HeartPulse,
  Home,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { useAuthStore, type RoleType } from "@/features/auth/authStore";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { useWebSocket } from "@/hooks/useWebSocket";

export interface MobileNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  badge?: number | string;
  hasLiveUpdate?: boolean;
  matchPrefixes?: string[];
  authorizedRoles: RoleType[];
}

export interface MobileFloatingNavigationProps {
  /** Optional role override; defaults to authenticated user role */
  role?: RoleType;
  /** Optional custom items if explicitly provided; otherwise auto-generated for role */
  items?: MobileNavItem[];
  /** Optional additional class name for the wrapper */
  className?: string;
}

/**
 * Role-authorized 5-item mobile navigation configurations.
 * Strictly maps to user requirements:
 *
 * USER: Home, Health, Risk, Messages, Profile
 * DOCTOR: Home, Patients, Predictions, Reviews, Profile
 * NURSE: Home, Triage, Patients, Alerts, Profile
 * MEDICAL INFORMATICIST: Home, Data, Models, Analytics, Profile
 * IT ADMIN: Home, Users, Services, Security, Profile
 */
export function getAuthorizedMobileNavItems(
  role: RoleType,
  badges: {
    alertsCount?: number;
    predictionsCount?: number;
    reviewsCount?: number;
    messagesCount?: number;
    securityCount?: number;
  } = {}
): MobileNavItem[] {
  const normalizedRole: RoleType =
    role === "ANALYST"
      ? "MEDICAL_INFORMATICIST"
      : role === "ADMIN"
      ? "IT_ADMIN"
      : role;

  switch (normalizedRole) {
    case "PATIENT":
      return [
        {
          id: "patient-home",
          label: "Home",
          href: "/user/dashboard",
          icon: Home,
          matchPrefixes: ["/user/dashboard", "/user"],
          authorizedRoles: ["PATIENT"],
        },
        {
          id: "patient-health",
          label: "Health",
          href: "/user/health-summary",
          icon: HeartPulse,
          matchPrefixes: ["/user/health-summary", "/user/vitals", "/user/medical-records"],
          authorizedRoles: ["PATIENT"],
        },
        {
          id: "patient-risk",
          label: "Risk",
          href: "/user/risk-assessment",
          icon: ShieldAlert,
          matchPrefixes: ["/user/risk-assessment", "/user/predictions"],
          authorizedRoles: ["PATIENT"],
        },
        {
          id: "patient-messages",
          label: "Messages",
          href: "/user/messages",
          icon: MessageSquare,
          badge: badges.messagesCount ?? 3,
          matchPrefixes: ["/user/messages"],
          authorizedRoles: ["PATIENT"],
        },
        {
          id: "patient-profile",
          label: "Profile",
          href: "/user/profile",
          icon: User,
          matchPrefixes: ["/user/profile", "/user/security", "/user/settings"],
          authorizedRoles: ["PATIENT"],
        },
      ];

    case "DOCTOR":
      return [
        {
          id: "doctor-home",
          label: "Home",
          href: "/doctor/dashboard",
          icon: Home,
          matchPrefixes: ["/doctor/dashboard", "/doctor", "/dashboard"],
          authorizedRoles: ["DOCTOR"],
        },
        {
          id: "doctor-patients",
          label: "Patients",
          href: "/doctor/patients",
          icon: Users,
          matchPrefixes: ["/doctor/patients", "/patients"],
          authorizedRoles: ["DOCTOR"],
        },
        {
          id: "doctor-predictions",
          label: "Predictions",
          href: "/doctor/predictions",
          icon: Activity,
          badge: badges.predictionsCount,
          hasLiveUpdate: Boolean(badges.predictionsCount),
          matchPrefixes: ["/doctor/predictions", "/predictions"],
          authorizedRoles: ["DOCTOR"],
        },
        {
          id: "doctor-reviews",
          label: "Reviews",
          href: "/doctor/reviews",
          icon: ClipboardList,
          badge: badges.reviewsCount ?? 3,
          matchPrefixes: ["/doctor/reviews", "/clinical"],
          authorizedRoles: ["DOCTOR"],
        },
        {
          id: "doctor-profile",
          label: "Profile",
          href: "/doctor/profile",
          icon: User,
          matchPrefixes: ["/doctor/profile", "/doctor/settings", "/profile"],
          authorizedRoles: ["DOCTOR"],
        },
      ];

    case "NURSE":
      return [
        {
          id: "nurse-home",
          label: "Home",
          href: "/nurse/dashboard",
          icon: Home,
          matchPrefixes: ["/nurse/dashboard", "/nurse", "/dashboard"],
          authorizedRoles: ["NURSE"],
        },
        {
          id: "nurse-triage",
          label: "Triage",
          href: "/nurse/triage",
          icon: ClipboardList,
          badge: 4,
          matchPrefixes: ["/nurse/triage"],
          authorizedRoles: ["NURSE"],
        },
        {
          id: "nurse-patients",
          label: "Patients",
          href: "/nurse/patients",
          icon: Users,
          matchPrefixes: ["/nurse/patients", "/patients"],
          authorizedRoles: ["NURSE"],
        },
        {
          id: "nurse-alerts",
          label: "Alerts",
          href: "/nurse/alerts",
          icon: Bell,
          badge: badges.alertsCount ?? 5,
          hasLiveUpdate: Boolean(badges.alertsCount),
          matchPrefixes: ["/nurse/alerts", "/nurse/escalations", "/notifications"],
          authorizedRoles: ["NURSE"],
        },
        {
          id: "nurse-profile",
          label: "Profile",
          href: "/nurse/profile",
          icon: User,
          matchPrefixes: ["/nurse/profile", "/nurse/settings", "/profile"],
          authorizedRoles: ["NURSE"],
        },
      ];

    case "MEDICAL_INFORMATICIST":
      return [
        {
          id: "informaticist-home",
          label: "Home",
          href: "/informaticist/dashboard",
          icon: Home,
          matchPrefixes: ["/informaticist/dashboard", "/informaticist", "/dashboard"],
          authorizedRoles: ["MEDICAL_INFORMATICIST", "ANALYST"],
        },
        {
          id: "informaticist-data",
          label: "Data",
          href: "/informaticist/data-quality",
          icon: Database,
          matchPrefixes: ["/informaticist/data-quality", "/informaticist/audit"],
          authorizedRoles: ["MEDICAL_INFORMATICIST", "ANALYST"],
        },
        {
          id: "informaticist-models",
          label: "Models",
          href: "/informaticist/models",
          icon: Brain,
          matchPrefixes: ["/informaticist/models", "/admin/models"],
          authorizedRoles: ["MEDICAL_INFORMATICIST", "ANALYST"],
        },
        {
          id: "informaticist-analytics",
          label: "Analytics",
          href: "/informaticist/analytics",
          icon: BarChart3,
          matchPrefixes: ["/informaticist/analytics", "/informaticist/drift", "/informaticist/ai-evaluation"],
          authorizedRoles: ["MEDICAL_INFORMATICIST", "ANALYST"],
        },
        {
          id: "informaticist-profile",
          label: "Profile",
          href: "/informaticist/profile",
          icon: User,
          matchPrefixes: ["/informaticist/profile", "/informaticist/settings", "/profile"],
          authorizedRoles: ["MEDICAL_INFORMATICIST", "ANALYST"],
        },
      ];

    case "IT_ADMIN":
    default:
      return [
        {
          id: "admin-home",
          label: "Home",
          href: "/admin/dashboard",
          icon: Home,
          matchPrefixes: ["/admin/dashboard", "/admin", "/dashboard"],
          authorizedRoles: ["IT_ADMIN", "ADMIN"],
        },
        {
          id: "admin-users",
          label: "Users",
          href: "/admin/users",
          icon: Users,
          matchPrefixes: ["/admin/users", "/admin/roles"],
          authorizedRoles: ["IT_ADMIN", "ADMIN"],
        },
        {
          id: "admin-services",
          label: "Services",
          href: "/admin/services",
          icon: Activity,
          matchPrefixes: [
            "/admin/services",
            "/admin/health",
            "/admin/database",
            "/admin/redis",
            "/admin/celery",
            "/admin/websockets",
          ],
          authorizedRoles: ["IT_ADMIN", "ADMIN"],
        },
        {
          id: "admin-security",
          label: "Security",
          href: "/admin/security",
          icon: ShieldCheck,
          badge: badges.securityCount ?? 2,
          matchPrefixes: ["/admin/security", "/admin/audit", "/admin/logs"],
          authorizedRoles: ["IT_ADMIN", "ADMIN"],
        },
        {
          id: "admin-profile",
          label: "Profile",
          href: "/admin/profile",
          icon: User,
          matchPrefixes: ["/admin/profile", "/admin/settings", "/profile"],
          authorizedRoles: ["IT_ADMIN", "ADMIN"],
        },
      ];
  }
}

/**
 * Longest-prefix matching to determine which mobile navigation item is active.
 * Handles nested routes seamlessly (e.g. /doctor/patients/123 highlights Patients).
 */
export function resolveActiveNavItemId(
  pathname: string,
  items: MobileNavItem[]
): string | null {
  let bestMatchId: string | null = null;
  let bestMatchScore = -1;

  for (const item of items) {
    const prefixes = [item.href, ...(item.matchPrefixes || [])];

    for (const prefix of prefixes) {
      if (pathname === prefix) {
        // Exact match has highest priority
        const score = 1000 + prefix.length;
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatchId = item.id;
        }
      } else if (
        pathname.startsWith(prefix.endsWith("/") ? prefix : prefix + "/")
      ) {
        // Child path match: longer prefix beats shorter prefix
        const score = prefix.length;
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatchId = item.id;
        }
      }
    }
  }

  // If no match found, fallback to first item (Home)
  return bestMatchId || (items[0] ? items[0].id : null);
}

/**
 * MobileFloatingNavigation
 *
 * Clean, minimal, floating white pill navigation fixed near the bottom of mobile viewports.
 * Strict adherence to:
 * - Fixed near bottom of viewport, centered horizontally
 * - Floating pill appearance with large rounded corners, white background, subtle border, soft shadow
 * - Exactly 5 navigation items with Icon + label
 * - Strong visual weight on active item, muted inactive items (never relying on color alone)
 * - Minimum 44x44px touch targets (Apple HIG compliant)
 * - Safe area support (calc(base + env(safe-area-inset-bottom)))
 * - Full keyboard, touch, and screen reader accessibility
 * - Real-time WebSocket badge integration without exposing clinical details
 */
export function MobileFloatingNavigation({
  role: propRole,
  items: propItems,
  className = "",
}: MobileFloatingNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { unreadAlertsCount } = useClinicalStore();

  // Local real-time counters updated by WebSockets
  const [livePredictionsCount, setLivePredictionsCount] = React.useState<number | undefined>(undefined);
  const [liveAlertsCount, setLiveAlertsCount] = React.useState<number | undefined>(undefined);
  const [liveSecurityCount, setLiveSecurityCount] = React.useState<number | undefined>(undefined);

  // Hook into WebSocket stream to update badges in real-time
  useWebSocket({
    path: "dashboard/",
    handlers: {
      prediction_created: () => {
        setLivePredictionsCount((prev) => (prev ? prev + 1 : 1));
      },
      PREDICTION_CREATED: () => {
        setLivePredictionsCount((prev) => (prev ? prev + 1 : 1));
      },
      risk_alert: () => {
        setLiveAlertsCount((prev) => (prev ? prev + 1 : 1));
      },
      RISK_ALERT: () => {
        setLiveAlertsCount((prev) => (prev ? prev + 1 : 1));
      },
      security_event: () => {
        setLiveSecurityCount((prev) => (prev ? prev + 1 : 1));
      },
    },
    autoReconnect: true,
  });

  // Effective user role
  const effectiveRole: RoleType =
    propRole || (user?.role as RoleType) || "DOCTOR";

  // Dynamic 5 items strictly authorized for this role
  const navItems = React.useMemo(() => {
    if (propItems && propItems.length === 5) {
      return propItems;
    }
    return getAuthorizedMobileNavItems(effectiveRole, {
      alertsCount: unreadAlertsCount > 0 ? unreadAlertsCount : liveAlertsCount,
      predictionsCount: livePredictionsCount,
      reviewsCount: 3,
      messagesCount: 3,
      securityCount: liveSecurityCount ?? 2,
    });
  }, [
    propItems,
    effectiveRole,
    unreadAlertsCount,
    liveAlertsCount,
    livePredictionsCount,
    liveSecurityCount,
  ]);

  // Active item resolution
  const activeItemId = React.useMemo(() => {
    return resolveActiveNavItemId(pathname, navItems);
  }, [pathname, navItems]);

  return (
    <nav
      role="navigation"
      aria-label="Mobile Bottom Navigation"
      data-testid="mobile-floating-nav"
      className={`lg:hidden fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-[440px] pointer-events-auto select-none ${className}`}
      style={{
        bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.08),0_1px_3px_rgb(0,0,0,0.05)] px-1 sm:px-1.5 py-1.5 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = item.id === activeItemId;
          const Icon = item.icon;
          const hasBadge = item.badge !== undefined && item.badge !== null && item.badge !== 0;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={
                hasBadge
                  ? `${item.label}, ${item.badge} updates available`
                  : item.label
              }
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              className={`touch-target flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl sm:rounded-2xl transition-all duration-200 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-1 active:scale-95 ${
                isActive
                  ? "text-slate-950 font-bold"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              }`}
            >
              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  strokeWidth={isActive ? 2.3 : 1.75}
                  className={`h-5 w-5 transition-all duration-200 ${
                    isActive
                      ? "text-slate-950 scale-105"
                      : "text-slate-600 group-hover:text-slate-900"
                  }`}
                  aria-hidden="true"
                />

                {/* Non-intrusive Live Counter Badge */}
                {hasBadge && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono flex items-center justify-center leading-none ring-2 ring-white shadow-xs"
                  >
                    {typeof item.badge === "number" && item.badge > 99
                      ? "99+"
                      : item.badge}
                  </span>
                )}

                {/* Pulsing Live Update Pip */}
                {item.hasLiveUpdate && !hasBadge && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"
                  />
                )}
              </div>

              {/* Navigation Item Label */}
              <span
                className={`text-[10px] xs:text-[11px] leading-tight mt-1 truncate max-w-full text-center tracking-tight transition-all duration-200 ${
                  isActive
                    ? "text-slate-950 font-bold"
                    : "text-slate-600 group-hover:text-slate-900 font-medium"
                }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <span
                  className="absolute bottom-0.5 h-0.75 w-3.5 sm:w-4 rounded-full bg-slate-950 transition-all duration-200"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
