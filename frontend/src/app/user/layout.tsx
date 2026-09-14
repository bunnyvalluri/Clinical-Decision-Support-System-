"use client";

import * as React from "react";
import {
  Activity,
  Bell,
  Calendar,
  ClipboardList,
  FileCheck,
  FileText,
  HeartPulse,
  Key,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Settings,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { ResponsiveAppShell, NavItem } from "@/components/responsive/ResponsiveAppShell";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

const USER_NAV_ITEMS: NavItem[] = [
  { href: "/user/dashboard", icon: LayoutDashboard, label: "Dashboard", mobileQuick: true },
  { href: "/user/vitals", icon: HeartPulse, label: "Vitals & Telemetry", mobileQuick: true },
  { href: "/user/appointments", icon: Calendar, label: "Appointments", mobileQuick: true },
  { href: "/user/messages", icon: MessageSquare, label: "Care Messages", mobileQuick: true },
  { href: "/user/health-summary", icon: Activity, label: "Health Summary" },
  { href: "/user/medical-records", icon: FileText, label: "Medical Records" },
  { href: "/user/risk-assessment", icon: Sparkles, label: "Risk Assessment" },
  { href: "/user/predictions", icon: TrendingUp, label: "Predictions & AI" },
  { href: "/user/reports", icon: ClipboardList, label: "Reports" },
  { href: "/user/tasks", icon: ListTodo, label: "Daily Tasks" },
  { href: "/user/notifications", icon: Bell, label: "Notifications" },
  { href: "/user/consent", icon: FileCheck, label: "Consent & Privacy" },
];

const USER_BOTTOM_ITEMS: NavItem[] = [
  { href: "/user/profile", icon: User, label: "My Profile" },
  { href: "/user/security", icon: Key, label: "Security" },
  { href: "/user/settings", icon: Settings, label: "Settings" },
];

function UserLayoutInner({ children }: { children: React.ReactNode }) {
  const { status: wsStatus } = useUserWebSocket();

  const isWsLive = wsStatus === "connected";
  const statusLabel = isWsLive ? "Portal Live" : "Portal Active";

  return (
    <ResponsiveAppShell
      role="PATIENT"
      workspaceName="Patient Health Portal"
      workspaceSubtitle="Personal Health Records & Monitoring"
      accentColor="teal"
      brandIcon={HeartPulse}
      navItems={USER_NAV_ITEMS}
      bottomItems={USER_BOTTOM_ITEMS}
      wsConnected={true}
      wsStatusText={statusLabel}
    >
      {children}
    </ResponsiveAppShell>
  );
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["PATIENT"]}>
      <UserLayoutInner>{children}</UserLayoutInner>
    </RoleGuard>
  );
}
