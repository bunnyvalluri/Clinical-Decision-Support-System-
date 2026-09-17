"use client";

import * as React from "react";
import {
  Activity,
  Bell,
  Bot,
  ClipboardList,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Settings,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { ResponsiveAppShell, NavItem } from "@/components/responsive/ResponsiveAppShell";

const DOCTOR_NAV_ITEMS: NavItem[] = [
  { href: "/doctor/dashboard", icon: LayoutDashboard, label: "Dashboard", mobileQuick: true },
  { href: "/doctor/patients", icon: Users, label: "Patients", mobileQuick: true },
  { href: "/doctor/predictions", icon: Activity, label: "Predictions", mobileQuick: true },
  { href: "/doctor/reviews", icon: ClipboardList, label: "Reviews", badge: 3, mobileQuick: true },
  { href: "/doctor/ai-assistant", icon: Bot, label: "AI Assistant" },
  { href: "/doctor/external-data", icon: Stethoscope, label: "External Data" },
  { href: "/doctor/reports", icon: FileText, label: "Reports" },
  { href: "/doctor/notifications", icon: Bell, label: "Notifications", badge: 5 },
];

const DOCTOR_BOTTOM_ITEMS: NavItem[] = [
  { href: "/doctor/profile", icon: User, label: "Profile" },
  { href: "/doctor/settings", icon: Settings, label: "Settings" },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["DOCTOR"]}>
      <ResponsiveAppShell
        role="DOCTOR"
        workspaceName="HealthNova AI"
        workspaceSubtitle="Clinical Decision Support"
        accentColor="emerald"
        brandIcon={HeartPulse}
        navItems={DOCTOR_NAV_ITEMS}
        bottomItems={DOCTOR_BOTTOM_ITEMS}
        wsConnected={true}
        wsStatusText="Live ICU Feed"
      >
        {children}
      </ResponsiveAppShell>
    </RoleGuard>
  );
}
