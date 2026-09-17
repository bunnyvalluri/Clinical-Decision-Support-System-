"use client";

import * as React from "react";
import {
  BarChart3,
  Bell,
  Brain,
  ClipboardCheck,
  Database,
  FileText,
  LayoutDashboard,
  PenTool,
  Settings,
  Sparkles,
  TrendingDown,
  User,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { ResponsiveAppShell, NavItem } from "@/components/responsive/ResponsiveAppShell";

const INFORMATICIST_NAV_ITEMS: NavItem[] = [
  { href: "/informaticist/dashboard", icon: LayoutDashboard, label: "Dashboard", mobileQuick: true },
  { href: "/informaticist/models", icon: Brain, label: "Models & Registry", mobileQuick: true },
  { href: "/informaticist/drift", icon: TrendingDown, label: "Drift Monitor", mobileQuick: true },
  { href: "/informaticist/analytics", icon: BarChart3, label: "Analytics", mobileQuick: true },
  { href: "/informaticist/whiteboards", icon: PenTool, label: "Whiteboards" },
  { href: "/informaticist/data-quality", icon: Database, label: "Data Quality" },
  { href: "/informaticist/external-apis", icon: Database, label: "External APIs" },
  { href: "/informaticist/ai-evaluation", icon: Sparkles, label: "AI Evaluation" },
  { href: "/informaticist/reports", icon: FileText, label: "Reports" },
  { href: "/informaticist/audit", icon: ClipboardCheck, label: "Audit Ledger" },
  { href: "/informaticist/notifications", icon: Bell, label: "Notifications" },
];

const INFORMATICIST_BOTTOM_ITEMS: NavItem[] = [
  { href: "/informaticist/profile", icon: User, label: "Profile" },
  { href: "/informaticist/settings", icon: Settings, label: "Settings" },
];

export default function InformaticistLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["MEDICAL_INFORMATICIST", "ANALYST"]}>
      <ResponsiveAppShell
        role="ANALYST"
        workspaceName="HealthNova AI"
        workspaceSubtitle="Clinical Data & Model Intelligence"
        accentColor="amber"
        brandIcon={Brain}
        navItems={INFORMATICIST_NAV_ITEMS}
        bottomItems={INFORMATICIST_BOTTOM_ITEMS}
        wsConnected={true}
        wsStatusText="Telemetry Stream"
      >
        {children}
      </ResponsiveAppShell>
    </RoleGuard>
  );
}
