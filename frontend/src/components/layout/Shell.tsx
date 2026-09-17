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
  Check,
  ChevronRight,
  Cpu,
  FileText,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Server,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuthStore } from "@/features/auth/authStore";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MobileFloatingNavigation } from "@/components/navigation/MobileFloatingNavigation";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { RealtimeStatusBadge } from "@/components/ai/RealtimeStatusBadge";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState("");
  const [commandOpen, setCommandOpen] = React.useState(false);

  const { user, logout, loginAsRole } = useAuthStore();
  const {
    notifications,
    unreadAlertsCount,
    markNotificationAsRead,
    handleWebSocketPrediction,
    handleWebSocketAlert,
    handleWebSocketTask,
  } = useClinicalStore();

  // Keyboard shortcut for Cmd+K / Ctrl+K Command Palette
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
        { label: "Nursing Search", href: "/nurse/search", icon: Search },
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
        { label: "Informatics Search", href: "/informaticist/search", icon: Search },
        { label: "Validation Reports", href: "/reports", icon: FileText },
        { label: "Tamper-Evident Audits", href: "/admin/audit", icon: ShieldCheck },
        { label: "Informaticist Profile", href: "/profile", icon: User },
      ];
    }

    if (role === "IT_ADMIN" || role === "ADMIN") {
      return [
        { label: "Infrastructure Center", href: "/dashboard", icon: LayoutDashboard },
        { label: "Coolify Platform", href: "/admin/infrastructure", icon: Server },
        { label: "User Governance", href: "/admin/audit", icon: Users },
        { label: "Search & Tasks", href: "/admin/search", icon: Search },
        { label: "API Contract Tests", href: "/admin/api-tests", icon: FileText },
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
      { label: "Clinical Search", href: "/doctor/search", icon: Search },
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

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card text-card-foreground">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-sky-200 bg-white shadow-xs p-0.5">
            <Image
              src="/logo.png"
              alt="HealthNova AI Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain rounded-lg"
              priority
            />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-foreground block leading-tight">
              HealthNova AI
            </span>
            <span className="text-[10px] uppercase font-mono font-semibold text-teal-600 tracking-wider">
              Clinical Decision Support
            </span>
          </div>
        </Link>
      </div>

      {/* Live WebSocket Telemetry Indicator using RealtimeStatusBadge */}
      <div className="mx-4 my-3 px-3 py-2 rounded-lg bg-muted/50 border border-border flex items-center justify-between text-xs">
        <RealtimeStatusBadge
          status={
            wsState.isConnected
              ? "connected"
              : wsState.isConnecting
              ? "reconnecting"
              : "disconnected"
          }
        />
        <span className="font-mono text-[10px] font-semibold text-muted-foreground">
          {wsState.isConnected ? "CHANNELS" : "OFFLINE"}
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 ${
                    isActive
                      ? "text-emerald-600"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Clinical Role Switcher & User Profile Footer */}
      <div className="border-t border-border p-4 space-y-3 bg-muted/20">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Switch Clinical Role
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { role: "DOCTOR", label: "Physician" },
              { role: "NURSE", label: "Nurse" },
              { role: "MEDICAL_INFORMATICIST", label: "Informatics" },
              { role: "IT_ADMIN", label: "Admin" },
            ].map((r) => {
              const isCurrent = (user?.role || "DOCTOR") === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => {
                    loginAsRole(r.role as any);
                    router.push("/dashboard");
                  }}
                  className={`rounded px-2 py-1 text-[10px] font-semibold transition-all text-left flex items-center justify-between ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  <span>{r.label}</span>
                  {isCurrent && <Check className="h-2.5 w-2.5" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              {(user?.full_name || "U")[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {user?.full_name || "Dr. Elena Vance, MD"}
              </p>
              <p className="truncate text-[10px] font-medium text-muted-foreground">
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
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-foreground selection:bg-emerald-500/20 selection:text-emerald-800">
      {/* Mobile Accessible Navigation via Radix Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-border bg-card">
        {sidebarContent}
      </aside>

      {/* Main Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Quick Command Palette Button */}
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:bg-muted transition-colors w-64 lg:w-80 text-left"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search patients, records, models...</span>
              <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* System Clock */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-[11px] font-mono font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{currentTime || "15:45:00 UTC"}</span>
            </div>

            {/* Quick Actions */}
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/predictions/new")}
              className="gap-1.5 text-xs shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Run Assessment
            </Button>

            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
                className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="View alerts"
              >
                <Bell className="h-4 w-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {alertsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-popover p-4 shadow-2xl z-50 text-xs animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <span className="font-bold text-foreground">Live Clinical Alerts</span>
                    <Link
                      href="/notifications"
                      onClick={() => setAlertsDropdownOpen(false)}
                      className="text-emerald-600 hover:underline text-[11px] font-semibold"
                    >
                      View all ({notifications.length})
                    </Link>
                  </div>
                  <div className="divide-y divide-border/50 max-h-64 overflow-y-auto my-2">
                    {notifications.slice(0, 4).map((n) => (
                      <button
                        type="button"
                        key={n.id}
                        className="w-full text-left py-2.5 space-y-1 hover:bg-muted/50 px-2 rounded-lg cursor-pointer transition-colors"
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
                                : "text-sky-600"
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{n.timestamp}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] line-clamp-2">{n.message}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-8">
          {children}
        </main>

        {/* Floating Mobile Bottom Navigation */}
        <MobileFloatingNavigation role={user?.role} />
      </div>

      {/* Accessible Command Palette Dialog */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search patients, predictions, actions..." />
        <CommandList>
          <CommandEmpty>No clinical records or actions found.</CommandEmpty>
          <CommandGroup heading="Quick Navigation">
            <CommandItem
              onSelect={() => {
                router.push("/dashboard");
                setCommandOpen(false);
              }}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Role Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/patients");
                setCommandOpen(false);
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Assigned Patients Directory</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/predictions/new");
                setCommandOpen(false);
              }}
            >
              <HeartPulse className="mr-2 h-4 w-4" />
              <span>New Risk Prediction</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Clinical Records & Tools">
            <CommandItem
              onSelect={() => {
                router.push("/clinical");
                setCommandOpen(false);
              }}
            >
              <Activity className="mr-2 h-4 w-4" />
              <span>Clinical Encounters</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/reports");
                setCommandOpen(false);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Medical Reports</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/admin/models");
                setCommandOpen(false);
              }}
            >
              <Cpu className="mr-2 h-4 w-4" />
              <span>Model Registry</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
