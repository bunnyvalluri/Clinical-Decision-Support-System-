"use client";

import * as React from "react";
import {
  AlertCircle,
  Bell,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  ListTodo,
  Settings,
  User,
  Users,
  Zap,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { ResponsiveAppShell, NavItem } from "@/components/responsive/ResponsiveAppShell";

const NURSE_NAV_ITEMS: NavItem[] = [
  { href: "/nurse/dashboard", icon: LayoutDashboard, label: "Dashboard", mobileQuick: true },
  { href: "/nurse/triage", icon: ClipboardList, label: "Triage", badge: 4, mobileQuick: true },
  { href: "/nurse/patients", icon: Users, label: "Patients", mobileQuick: true },
  { href: "/nurse/alerts", icon: Zap, label: "Alerts", badge: 6, mobileQuick: true },
  { href: "/nurse/escalations", icon: AlertCircle, label: "Escalations", badge: 2 },
  { href: "/nurse/tasks", icon: ListTodo, label: "Tasks" },
  { href: "/nurse/notifications", icon: Bell, label: "Notifications" },
];

const NURSE_BOTTOM_ITEMS: NavItem[] = [
  { href: "/nurse/profile", icon: User, label: "Profile" },
  { href: "/nurse/settings", icon: Settings, label: "Settings" },
];

export default function NurseLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["NURSE"]}>
      <ResponsiveAppShell
        role="NURSE"
        workspaceName="Triage & Bedside"
        workspaceSubtitle="Emergency & Vital Telemetry"
        accentColor="sky"
        brandIcon={HeartPulse}
        navItems={NURSE_NAV_ITEMS}
        bottomItems={NURSE_BOTTOM_ITEMS}
        wsConnected={true}
        wsStatusText="Telemetry Online"
      >
        {children}
      </ResponsiveAppShell>
    </RoleGuard>
  );
}
