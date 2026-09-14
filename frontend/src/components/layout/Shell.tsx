"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Cpu,
  FileText,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/authStore";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MobileFloatingNavigation } from "@/components/navigation/MobileFloatingNavigation";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState("");

  const { user, logout, loginAsRole } = useAuthStore();
  const {
    notifications,
    unreadAlertsCount,
    markNotificationAsRead,
    handleWebSocketPrediction,
    handleWebSocketAlert,
    handleWebSocketTask,
  } = useClinicalStore();

  // Keep live time updated
  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket hook to capture live predictions and update dashboard immediately without refresh
  const wsState = useWebSocket({
    path: "dashboard/",
    handlers: {
      prediction_created: (payload) => {
        handleWebSocketPrediction(payload);
      },
      PREDICTION_CREATED: (payload) => {
        handleWebSocketPrediction(payload);
      },
      risk_alert: (payload) => {
        handleWebSocketAlert(payload);
      },
      RISK_ALERT: (payload) => {
        handleWebSocketAlert(payload);
      },
      task_status_updated: (payload) => {
        handleWebSocketTask(payload);
      },
      TASK_STATUS_UPDATED: (payload) => {
        handleWebSocketTask(payload);
      },
    },
    autoReconnect: true,
  });

  // Dynamic Navigation Items tailored strictly to active role
  const navItems = React.useMemo(() => {
    const role = user?.role || "DOCTOR";

    if (role === "NURSE") {
      return [
        { label: "Triage & Bedside Center", href: "/dashboard", icon: LayoutDashboard },
        { label: "Emergency Queue", href: "/clinical", icon: HeartPulse },
        { label: "Hospital Census", href: "/patients", icon: Users },
        {
          label: "Doctor Escalations",
          href: "/notifications",
          icon: Bell,
          badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
        },
        { label: "Nursing Reports", href: "/reports", icon: FileText },
        { label: "Nurse Profile", href: "/profile", icon: User },
      ];
    }

    if (role === "MEDICAL_INFORMATICIST" || role === "ANALYST") {
      return [
        { label: "Informatics & MLOps", href: "/dashboard", icon: LayoutDashboard },
        { label: "scikit-learn Registry", href: "/admin/models", icon: Cpu },
        { label: "Biomarker Telemetry", href: "/predictions", icon: BarChart3 },
        { label: "Validation Reports", href: "/reports", icon: FileText },
        { label: "Tamper-Evident Audits", href: "/admin/audit", icon: ShieldCheck },
        { label: "Informaticist Profile", href: "/profile", icon: User },
      ];
    }

    if (role === "IT_ADMIN" || role === "ADMIN") {
      return [
        { label: "Infrastructure Center", href: "/dashboard", icon: LayoutDashboard },
        { label: "User Governance", href: "/admin/audit", icon: Users },
        { label: "Model Deployments", href: "/admin/models", icon: Cpu },
        { label: "Telemetry & Logs", href: "/reports", icon: ShieldCheck },
        { label: "System Config", href: "/settings", icon: Settings },
        { label: "Admin Profile", href: "/profile", icon: User },
      ];
    }

    // Default DOCTOR navigation
    return [
      { label: "Physician Center", href: "/dashboard", icon: LayoutDashboard },
      { label: "Assigned Patients", href: "/patients", icon: Users },
      { label: "Clinical Records", href: "/clinical", icon: Activity },
      { label: "Risk Prediction", href: "/predictions/new", icon: HeartPulse },
      { label: "Prediction History", href: "/predictions", icon: History },
      {
        label: "Clinical Alerts",
        href: "/notifications",
        icon: Bell,
        badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
      },
      { label: "Clinical Reports", href: "/reports", icon: FileText },
      { label: "Doctor Profile", href: "/profile", icon: User },
    ];
  }, [user?.role, unreadAlertsCount]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-800">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 bg-white">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-sky-200 bg-white shadow-sm p-0.5">
              <Image
                src="/logo.png"
                alt="PatientRisk Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain rounded-lg"
                priority
              />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
                PatientRisk
              </span>
              <span className="text-[10px] uppercase font-mono font-semibold text-sky-600 tracking-wider">
                Predict • Prevent
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live WebSocket Telemetry Indicator */}
        <div className="mx-4 my-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                wsState.isConnected
                  ? "bg-emerald-500 animate-ping"
                  : wsState.isConnecting
                  ? "bg-amber-500 animate-pulse"
                  : "bg-slate-400"
              }`}
            />
            <span className="text-slate-600 font-medium">
              {wsState.isConnected
                ? "Live Telemetry"
                : wsState.isConnecting
                ? "Connecting..."
                : "Telemetry Ready"}
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-emerald-600">
            {wsState.isConnected ? "WS ACTIVE" : "ONLINE"}
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Role Switcher for Evaluation */}
        <div className="border-t border-slate-200 px-4 py-3 bg-slate-50/70">
          <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Clinical Workspace:</span>
            <span className="font-mono font-semibold text-emerald-700">{user?.role || "DOCTOR"}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => loginAsRole("DOCTOR")}
              className={`rounded px-2 py-1.5 text-[10px] font-semibold transition-colors border ${
                user?.role === "DOCTOR"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Doctor
            </button>
            <button
              onClick={() => loginAsRole("NURSE")}
              className={`rounded px-2 py-1.5 text-[10px] font-semibold transition-colors border ${
                user?.role === "NURSE"
                  ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Triage Nurse
            </button>
            <button
              onClick={() => loginAsRole("MEDICAL_INFORMATICIST")}
              className={`rounded px-2 py-1.5 text-[10px] font-semibold transition-colors border ${
                user?.role === "MEDICAL_INFORMATICIST" || user?.role === "ANALYST"
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Informaticist
            </button>
            <button
              onClick={() => loginAsRole("IT_ADMIN")}
              className={`rounded px-2 py-1.5 text-[10px] font-semibold transition-colors border ${
                user?.role === "IT_ADMIN" || user?.role === "ADMIN"
                  ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              IT Admin
            </button>
          </div>
        </div>

        {/* Clinician Profile Footer */}
        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                {user?.full_name ? user.full_name.charAt(0) : "D"}
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-bold text-slate-900">
                  {user?.full_name || "Dr. Elena Vance, MD"}
                </p>
                <p className="truncate text-[10px] font-medium text-slate-500">
                  {user?.department || "Cardiology"}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
                } catch {}
                logout();
                window.location.href = "/login?logout=true";
              }}
              title="Sign Out"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Patient Search */}
            <div className="hidden sm:flex items-center relative w-72 lg:w-96">
              <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient name, MRN (e.g. MRN-90241)..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push("/patients");
                  }
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Clock */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{currentTime || "15:45:00 UTC"}</span>
            </div>

            {/* Quick Actions */}
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/predictions/new")}
              className="gap-1.5 text-xs shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Run Assessment
            </Button>

            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="View alerts"
              >
                <Bell className="h-4 w-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {alertsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl z-50 text-xs animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-slate-900">Live Clinical Alerts</span>
                    <Link
                      href="/notifications"
                      onClick={() => setAlertsDropdownOpen(false)}
                      className="text-emerald-600 hover:underline text-[11px] font-semibold"
                    >
                      View all ({notifications.length})
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto my-2">
                    {notifications.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        className="py-2.5 space-y-1 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.action_url) {
                            router.push(n.action_url);
                            setAlertsDropdownOpen(false);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold ${
                              n.severity === "CRITICAL"
                                ? "text-rose-600"
                                : n.severity === "WARNING"
                                ? "text-amber-600"
                                : "text-blue-600"
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] line-clamp-2">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Main Content Area (with safe bottom padding on mobile) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-8">
          {children}
        </main>

        {/* Floating Mobile Bottom Navigation */}
        <MobileFloatingNavigation role={user?.role} />
      </div>
    </div>
  );
}
