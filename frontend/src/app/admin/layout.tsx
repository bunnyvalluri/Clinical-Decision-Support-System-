"use client";

import * as React from "react";
import {
  Activity,
  Bell,
  Bot,
  Cpu,
  Database,
  FileText,
  Key,
  Layers,
  LayoutDashboard,
  Monitor,
  PenTool,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  User,
  Users,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { ResponsiveAppShell, NavItem } from "@/components/responsive/ResponsiveAppShell";

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", mobileQuick: true },
  { href: "/admin/ai", icon: Bot, label: "Ruflo AI Swarm", mobileQuick: true },
  { href: "/admin/automation/jules", icon: Wrench, label: "Jules Automation", mobileQuick: true },
  { href: "/admin/users", icon: Users, label: "Users & Staff", mobileQuick: true },
  { href: "/admin/health", icon: Monitor, label: "System Health", mobileQuick: true },
  { href: "/admin/monitoring", icon: Activity, label: "Live Telemetry", mobileQuick: true },
  { href: "/admin/incidents", icon: ShieldCheck, label: "Incidents" },
  { href: "/admin/disaster-recovery", icon: ShieldAlert, label: "Disaster Recovery", mobileQuick: true },
  { href: "/admin/security", icon: ShieldCheck, label: "Security & 2FA", mobileQuick: true },
  { href: "/admin/whiteboards", icon: PenTool, label: "Whiteboards" },
  { href: "/admin/roles", icon: Key, label: "RBAC Roles" },
  { href: "/admin/integrations/apis", icon: Layers, label: "External APIs" },
  { href: "/admin/services", icon: Activity, label: "Core Services" },
  { href: "/admin/database", icon: Database, label: "PostgreSQL" },
  { href: "/admin/nocodb", icon: Database, label: "NocoDB Governance" },
  { href: "/admin/redis", icon: Zap, label: "Redis Cache" },
  { href: "/admin/celery", icon: Cpu, label: "Celery Workers" },
  { href: "/admin/websockets", icon: Wifi, label: "WebSockets" },
  { href: "/admin/audit", icon: Terminal, label: "Audit Ledger" },
  { href: "/admin/logs", icon: FileText, label: "System Logs" },
  { href: "/admin/configuration", icon: Settings, label: "Configuration" },
  { href: "/admin/notifications", icon: Bell, label: "Notifications" },
];

const ADMIN_BOTTOM_ITEMS: NavItem[] = [
  { href: "/admin/profile", icon: User, label: "Profile" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={["IT_ADMIN", "ADMIN"]}>
      <ResponsiveAppShell
        role="ADMIN"
        workspaceName="HealthNova AI"
        workspaceSubtitle="Platform & Security Administration"
        accentColor="purple"
        brandIcon={ShieldCheck}
        navItems={ADMIN_NAV_ITEMS}
        bottomItems={ADMIN_BOTTOM_ITEMS}
        wsConnected={true}
        wsStatusText="Cluster Online"
      >
        {children}
      </ResponsiveAppShell>
    </RoleGuard>
  );
}
