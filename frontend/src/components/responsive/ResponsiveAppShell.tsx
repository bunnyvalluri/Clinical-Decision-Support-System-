"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Sparkles,
  Wifi,
  WifiOff,
  X,
  User,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/authStore";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { MobileFloatingNavigation } from "@/components/navigation/MobileFloatingNavigation";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  category?: string;
  mobileQuick?: boolean; // Show in bottom navigation bar on mobile
}

export interface ResponsiveAppShellProps {
  role: "DOCTOR" | "NURSE" | "ANALYST" | "ADMIN" | "PATIENT";
  workspaceName: string;
  workspaceSubtitle?: string;
  accentColor: "emerald" | "sky" | "amber" | "purple" | "teal";
  brandIcon: React.ComponentType<{ className?: string }>;
  navItems: NavItem[];
  bottomItems?: NavItem[];
  children: React.ReactNode;
  wsConnected?: boolean;
  wsStatusText?: string;
}

const COLOR_MAP = {
  emerald: {
    brandBg: "bg-emerald-600",
    brandText: "text-emerald-700",
    brandBorder: "border-emerald-200",
    activeNav: "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 font-semibold",
    hoverNav: "hover:bg-emerald-50/60 hover:text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
    ring: "focus:ring-emerald-500",
    mobileActive: "text-emerald-600 font-bold",
  },
  sky: {
    brandBg: "bg-sky-600",
    brandText: "text-sky-700",
    brandBorder: "border-sky-200",
    activeNav: "bg-sky-50 text-sky-800 border-l-4 border-sky-600 font-semibold",
    hoverNav: "hover:bg-sky-50/60 hover:text-sky-700",
    badge: "bg-sky-100 text-sky-800",
    ring: "focus:ring-sky-500",
    mobileActive: "text-sky-600 font-bold",
  },
  amber: {
    brandBg: "bg-amber-600",
    brandText: "text-amber-700",
    brandBorder: "border-amber-200",
    activeNav: "bg-amber-50 text-amber-900 border-l-4 border-amber-600 font-semibold",
    hoverNav: "hover:bg-amber-50/60 hover:text-amber-800",
    badge: "bg-amber-100 text-amber-900",
    ring: "focus:ring-amber-500",
    mobileActive: "text-amber-700 font-bold",
  },
  purple: {
    brandBg: "bg-purple-600",
    brandText: "text-purple-700",
    brandBorder: "border-purple-200",
    activeNav: "bg-purple-50 text-purple-800 border-l-4 border-purple-600 font-semibold",
    hoverNav: "hover:bg-purple-50/60 hover:text-purple-700",
    badge: "bg-purple-100 text-purple-800",
    ring: "focus:ring-purple-500",
    mobileActive: "text-purple-600 font-bold",
  },
  teal: {
    brandBg: "bg-teal-600",
    brandText: "text-teal-700",
    brandBorder: "border-teal-200",
    activeNav: "bg-teal-50 text-teal-800 border-l-4 border-teal-600 font-semibold",
    hoverNav: "hover:bg-teal-50/60 hover:text-teal-700",
    badge: "bg-teal-100 text-teal-800",
    ring: "focus:ring-teal-500",
    mobileActive: "text-teal-600 font-bold",
  },
};

export function ResponsiveAppShell({
  role,
  workspaceName,
  workspaceSubtitle,
  accentColor,
  brandIcon: BrandIcon,
  navItems,
  bottomItems = [],
  children,
  wsConnected = true,
  wsStatusText = "Live Synced",
}: ResponsiveAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [tabletRailCollapsed, setTabletRailCollapsed] = React.useState(false);
  const [hoveredRailItem, setHoveredRailItem] = React.useState<string | null>(null);

  const colors = COLOR_MAP[accentColor] || COLOR_MAP.teal;

  // Active route matching
  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href.split("/").length > 2 && pathname.startsWith(href + "/")) return true;
    return false;
  };

  // Lock body scroll when mobile drawer is open & handle Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };

    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileDrawerOpen]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Top 4-5 items for mobile bottom quick navigation
  const mobileQuickItems = React.useMemo(() => {
    const explicitlyTagged = navItems.filter((item) => item.mobileQuick);
    if (explicitlyTagged.length >= 3) return explicitlyTagged.slice(0, 4);
    return navItems.slice(0, 4);
  }, [navItems]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* ==================================================================== */}
      {/* 1. Mobile & Tablet Adaptive Top Header (< 1024px)                     */}
      {/* ==================================================================== */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 pt-safe flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            className="touch-target inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link href={`/${role.toLowerCase()}/dashboard`} className="flex items-center gap-2.5">
            <div className={`h-8 w-8 rounded-xl ${colors.brandBg} text-white flex items-center justify-center shadow-xs shrink-0`}>
              <BrandIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 leading-tight truncate block">
                {workspaceName}
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight truncate">
                PatientRisk CDSS
              </span>
            </div>
          </Link>
        </div>

        {/* Header Right Status Badges */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border ${
              wsConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                wsConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="hidden xs:inline" suppressHydrationWarning>{wsStatusText}</span>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/${role.toLowerCase()}/profile`)}
            aria-label="View Profile"
            className="touch-target inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. Main Workspace Layout: Desktop Sidebar + Content Body              */}
      {/* ==================================================================== */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop & Laptop Sidebar (lg: >= 1024px) */}
        <aside
          className={`hidden lg:flex flex-col sticky top-0 h-screen bg-white border-r border-slate-200 shrink-0 transition-all duration-300 z-30 ${
            tabletRailCollapsed ? "w-20" : "w-64 xl:w-72"
          }`}
        >
          {/* Top Brand Banner */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
            <Link href={`/${role.toLowerCase()}/dashboard`} className="flex items-center gap-3 overflow-hidden">
              <div className={`h-10 w-10 rounded-xl ${colors.brandBg} text-white flex items-center justify-center shadow-xs shrink-0`}>
                <BrandIcon className="h-5 w-5" />
              </div>
              {!tabletRailCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <span className="font-extrabold text-sm text-slate-900 leading-tight block truncate">
                    {workspaceName}
                  </span>
                  <span className={`text-[11px] font-semibold ${colors.brandText} block leading-tight truncate`}>
                    {workspaceSubtitle || "Clinical Workspace"}
                  </span>
                </div>
              )}
            </Link>

            {/* Toggle Rail Collapse on Desktop/Tablet */}
            <button
              type="button"
              onClick={() => setTabletRailCollapsed(!tabletRailCollapsed)}
              aria-label={tabletRailCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {tabletRailCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* User Profile Snippet */}
          {!tabletRailCollapsed && user && (
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 shadow-2xs">
                  {user.full_name?.[0] || user.username?.[0] || "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate font-mono">
                    {user.department || user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items List */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <div
                  key={item.href}
                  className="relative group"
                  onMouseEnter={() => tabletRailCollapsed && setHoveredRailItem(item.href)}
                  onMouseLeave={() => setHoveredRailItem(null)}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      tabletRailCollapsed ? "justify-center" : ""
                    } ${active ? colors.activeNav : `text-slate-600 ${colors.hoverNav}`}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? colors.brandText : "text-slate-500 group-hover:text-slate-700"}`} />
                    {!tabletRailCollapsed && <span className="truncate flex-1">{item.label}</span>}
                    {!tabletRailCollapsed && item.badge !== undefined && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  {/* Tablet Floating Tooltip for Collapsed Rail */}
                  {tabletRailCollapsed && hoveredRailItem === item.href && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap shadow-xl z-50 pointer-events-none animate-in fade-in zoom-in-95">
                      {item.label}
                      {item.badge !== undefined && ` (${item.badge})`}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom Settings & Sign Out */}
          <div className="p-3 border-t border-slate-100 space-y-1">
            {bottomItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    tabletRailCollapsed ? "justify-center" : ""
                  } ${active ? colors.activeNav : `text-slate-500 ${colors.hoverNav}`}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!tabletRailCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors ${
                tabletRailCollapsed ? "justify-center" : ""
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!tabletRailCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Desktop Top Breadcrumbs & Telemetry Bar (lg: >= 1024px) */}
          <header className="hidden lg:flex items-center justify-between px-6 xl:px-8 py-3.5 bg-white border-b border-slate-200 shrink-0">
            <Breadcrumbs />

            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border shadow-2xs ${
                  wsConnected
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {wsConnected ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-rose-600" />
                )}
                <span>{wsStatusText}</span>
              </div>

              <div className="h-4 w-px bg-slate-200" />

              <span className="text-xs text-slate-500 font-mono font-medium">
                FDA SaMD Class II Aligned
              </span>
            </div>
          </header>

          {/* Page Body Container (with safe-area bottom padding on mobile above floating nav) */}
          <main className="flex-1 min-w-0 p-3.5 xs:p-4 sm:p-6 lg:p-8 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] lg:pb-8 mb-0">
            <div className="max-w-7xl mx-auto w-full min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. Mobile Navigation Drawer (Slide-Over Sheet with Safe Areas)        */}
      {/* ==================================================================== */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Sliding Drawer Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="relative w-full max-w-xs sm:max-w-sm bg-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-250 pt-safe pb-safe"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl ${colors.brandBg} text-white flex items-center justify-center shadow-xs`}>
                  <BrandIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                    {workspaceName}
                  </span>
                  <span className={`text-[11px] font-semibold ${colors.brandText} block leading-tight`}>
                    {workspaceSubtitle || "Clinical Workspace"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation"
                className="touch-target inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Details */}
            {user && (
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-sm shadow-2xs">
                  {user.full_name?.[0] || user.username?.[0] || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate font-mono">
                    {user.email || user.department}
                  </p>
                </div>
              </div>
            )}

            {/* Nav Items Scrollable List */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`touch-target flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active ? colors.activeNav : `text-slate-700 ${colors.hoverNav}`
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon className={`h-5 w-5 ${active ? colors.brandText : "text-slate-500"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Drawer Actions */}
            <div className="p-4 border-t border-slate-100 space-y-2">
              {bottomItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`touch-target flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                      active ? colors.activeNav : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                className="touch-target w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out of Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. Mobile Floating Bottom Navigation (< 1024px)                      */}
      {/* ==================================================================== */}
      <MobileFloatingNavigation role={role} />
    </div>
  );
}
