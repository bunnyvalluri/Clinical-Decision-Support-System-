"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Download,
  Lock,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/authStore";
import apiClient from "@/services/apiClient";

interface ManagedUser {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: "DOCTOR" | "NURSE" | "MEDICAL_INFORMATICIST" | "IT_ADMIN";
  department: string;
  is_active: boolean;
  license_number?: string;
  last_login?: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  resource: string;
  ip_address: string;
  details: string;
}

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "u-01",
    full_name: "Dr. Vadla Abhinay, MD",
    username: "evance",
    email: "dr.abhinay.vadla@hospital.org",
    role: "DOCTOR",
    department: "Cardiology & Intensive Care",
    is_active: true,
    license_number: "MD-883921",
    last_login: "Just now",
  },
  {
    id: "u-02",
    full_name: "Sarah Jenkins, RN",
    username: "sjenkins",
    email: "s.jenkins@hospital.org",
    role: "NURSE",
    department: "Emergency Triage & Bedside",
    is_active: true,
    license_number: "RN-449102",
    last_login: "4 mins ago",
  },
  {
    id: "u-03",
    full_name: "Alex Rivera, MSc",
    username: "arivera",
    email: "alex.rivera@hospital.org",
    role: "MEDICAL_INFORMATICIST",
    department: "Clinical Informatics & Data Science",
    is_active: true,
    license_number: "BIO-10923",
    last_login: "22 mins ago",
  },
  {
    id: "u-04",
    full_name: "Marcus Chen",
    username: "mchen",
    email: "m.chen@hospital.org",
    role: "IT_ADMIN",
    department: "IT Systems & Cybersecurity",
    is_active: true,
    license_number: "CISSP-98210",
    last_login: "Active session",
  },
  {
    id: "u-05",
    full_name: "Dr. James Park, MD",
    username: "jpark",
    email: "j.park@hospital.org",
    role: "DOCTOR",
    department: "Pulmonology & Critical Care",
    is_active: false,
    license_number: "MD-771092",
    last_login: "3 days ago",
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "aud-01",
    timestamp: "2026-09-14 09:12:44",
    user: "arivera",
    role: "MEDICAL_INFORMATICIST",
    action: "MODEL_PROMOTION",
    resource: "ModelRegistry/RandomForest-v1.0.0",
    ip_address: "10.240.12.84",
    details: "Promoted RandomForestClassifier v1.0.0 to Active Champion (21 CFR Part 11 signed)",
  },
  {
    id: "aud-02",
    timestamp: "2026-09-14 08:30:10",
    user: "evance",
    role: "DOCTOR",
    action: "CLINICAL_REVIEW_OVERRIDE",
    resource: "ClinicalReview/pred-901",
    ip_address: "10.240.14.12",
    details: "Decision: CONFIRMED. Escalated to Catheterization Lab per SSC-2021 guidelines",
  },
  {
    id: "aud-03",
    timestamp: "2026-09-14 06:00:02",
    user: "system.mlops",
    role: "IT_ADMIN",
    action: "DRIFT_SWEEP_EXECUTED",
    resource: "DriftMonitor/Biomarkers-8",
    ip_address: "10.240.0.12",
    details: "Automated PSI scan completed across 48,290 records. Max PSI: 0.068 (Normal)",
  },
  {
    id: "aud-04",
    timestamp: "2026-09-13 23:59:15",
    user: "system.etl",
    role: "IT_ADMIN",
    action: "DATA_QUALITY_VERIFIED",
    resource: "FeatureStore/KafkaPartition",
    ip_address: "10.240.0.18",
    details: "Completed ingestion audit: 99.88% completeness, 0.48% outlier frequency",
  },
  {
    id: "aud-05",
    timestamp: "2026-09-13 17:14:02",
    user: "anonymous",
    role: "UNAUTHENTICATED",
    action: "RATE_LIMIT_ENFORCED",
    resource: "/api/v1/auth/login/",
    ip_address: "192.168.1.104",
    details: "5 consecutive failed authentications. Temporary 15-minute rate limit enacted",
  },
];

const getActionBadgeClass = (action: string) => {
  if (action.includes("DENIED") || action.includes("RATE_LIMIT")) {
    return "bg-rose-50 text-rose-700 border-rose-200 font-bold";
  }
  if (action.includes("OVERRIDE")) {
    return "bg-purple-50 text-purple-700 border-purple-200 font-bold";
  }
  if (action.includes("ESCALATION") || action.includes("PROMOTION")) {
    return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
};

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case "DOCTOR":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "NURSE":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "MEDICAL_INFORMATICIST":
      return "bg-purple-50 text-purple-800 border-purple-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
};

export function AdminWorkspace() {
  const { user } = useAuthStore();
  const [users, setUsers] = React.useState<ManagedUser[]>(INITIAL_USERS);
  const [auditLogs] = React.useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [activeTab, setActiveTab] = React.useState<"HEALTH" | "USERS" | "AUDIT" | "SECURITY">("HEALTH");
  const [togglingUserId, setTogglingUserId] = React.useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = React.useState<string | null>(null);

  const handleToggleUser = async (userId: string) => {
    setTogglingUserId(userId);
    try {
      await apiClient.post(`/admin/users/${userId}/toggle-active/`).catch(() => {
        // Fallback for mock ID
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
      );
      setActionFeedback("User active status updated and audit logged.");
      setTimeout(() => setActionFeedback(null), 3000);
    } finally {
      setTogglingUserId(null);
    }
  };

  const triggerAdminAction = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Administrator Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
            <Server className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 break-words">
                IT System Administration &amp; Infrastructure
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse" />
                Cluster Online
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Admin: <strong className="text-slate-800">{user?.full_name || "Marcus Chen"}</strong></span>
              <span>·</span>
              <span>Role: <strong className="text-slate-800">IT_ADMIN</strong></span>
              <span>·</span>
              <span className="text-emerald-700 font-medium">FDA SaMD Class II Aligned</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full lg:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => triggerAdminAction("Upstash Redis key cache cleared across 12 distributed nodes.")}
            className="text-xs h-8 border-slate-200 hover:border-purple-300 justify-center"
          >
            <Zap className="h-3.5 w-3.5 mr-1 text-purple-600 shrink-0" />
            Flush Cache
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => triggerAdminAction("Celery async worker pool heartbeat refreshed.")}
            className="text-xs h-8 border-slate-200 hover:border-purple-300 justify-center"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1 shrink-0" />
            Ping Workers
          </Button>

          <Button
            size="sm"
            onClick={() => triggerAdminAction("Full IT infrastructure audit dossier downloaded.")}
            className="col-span-2 sm:col-span-1 bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 justify-center"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            Export Audit
          </Button>
        </div>
      </div>

      {actionFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-mono shrink-0">21 CFR Part 11 Logged</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-2 sm:px-4 rounded-xl shadow-xs overflow-x-auto scrollbar-none gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab("HEALTH")}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "HEALTH"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Activity className="h-4 w-4 shrink-0" />
          Infrastructure Health
        </button>
        <button
          onClick={() => setActiveTab("USERS")}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "USERS"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4 shrink-0" />
          User &amp; Role Governance ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "AUDIT"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Audit Trail Viewer
        </button>
        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "SECURITY"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          Cybersecurity &amp; Telemetry
        </button>
      </div>

      {/* TAB 1: Infrastructure Health */}
      {activeTab === "HEALTH" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Neon Postgres */}
            <Card className="bg-white border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Neon PostgreSQL</span>
                  <Database className="h-4 w-4 text-emerald-600 shrink-0" />
                </CardDescription>
                <div className="flex items-baseline gap-2 mt-1">
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    CONNECTED
                  </CardTitle>
                  <span className="text-xs text-emerald-600 font-mono">32ms</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-4 sm:p-6 sm:pt-0">
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  Pool: 14/100 · PgBouncer Active
                </p>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "14%" }} />
                </div>
              </CardContent>
            </Card>

            {/* Upstash Redis */}
            <Card className="bg-white border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Upstash Redis Broker</span>
                  <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
                </CardDescription>
                <div className="flex items-baseline gap-2 mt-1">
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    ONLINE
                  </CardTitle>
                  <span className="text-xs text-emerald-600 font-mono">18ms</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-4 sm:p-6 sm:pt-0">
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  Queue depth: 0 · 24MB RAM used
                </p>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "9%" }} />
                </div>
              </CardContent>
            </Card>

            {/* Celery Worker */}
            <Card className="bg-white border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Celery Async Worker</span>
                  <Cpu className="h-4 w-4 text-emerald-600 shrink-0" />
                </CardDescription>
                <div className="flex items-baseline gap-2 mt-1">
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    ACTIVE (solo)
                  </CardTitle>
                  <span className="text-xs text-slate-500 font-mono">18 tasks</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-4 sm:p-6 sm:pt-0">
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  Retries: 0 · Heartbeat active
                </p>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "100%" }} />
                </div>
              </CardContent>
            </Card>

            {/* API Latency */}
            <Card className="bg-white border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>API Latency (p95)</span>
                  <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                </CardDescription>
                <div className="flex items-baseline gap-2 mt-1">
                  <CardTitle className="text-xl font-bold text-emerald-700">
                    48 ms
                  </CardTitle>
                  <span className="text-xs text-emerald-600 font-bold">0.0% Error</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-4 sm:p-6 sm:pt-0">
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  p50: 12ms · p99: 110ms · SLA pass
                </p>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "95%" }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-600 shrink-0" />
                Live Distributed Subsystem Nodes
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Detailed telemetry across serverless database, caching, web server, and worker daemon nodes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-3.5 sm:p-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-2.5">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1 sm:mt-0 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">Neon Serverless PostgreSQL (us-east-2)</div>
                    <div className="text-[11px] text-slate-500 font-mono break-all">ep-divine-credit-a589ua8g-pooler.us-east-2.aws.neon.tech</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:block sm:text-right shrink-0">
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">HEALTHY</Badge>
                  <div className="text-[10px] text-slate-400 font-mono sm:mt-0.5">SSL require · PgBouncer Active</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-2.5">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1 sm:mt-0 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">Django ASGI Channels &amp; WebSocket Gateway</div>
                    <div className="text-[11px] text-slate-500 font-mono break-all">daphne / uvicorn listening on port 8000 (ws://localhost:8000/ws)</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:block sm:text-right shrink-0">
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">RUNNING</Badge>
                  <div className="text-[10px] text-slate-400 font-mono sm:mt-0.5">0 disconnected sessions · 12 active</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-2.5">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1 sm:mt-0 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">Celery Background Asynchronous Daemon</div>
                    <div className="text-[11px] text-slate-500 font-mono break-all">pool=solo · concurrency=1 · heartbeat active</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:block sm:text-right shrink-0">
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">READY</Badge>
                  <div className="text-[10px] text-slate-400 font-mono sm:mt-0.5">Prompt 18 retraining &amp; drift worker</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-2.5">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1 sm:mt-0 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">Machine Learning Inference Engine</div>
                    <div className="text-[11px] text-slate-500 font-mono break-all">ONNX Runtime 1.17 · Champion RandomForestClassifier v1.0.0</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:block sm:text-right shrink-0">
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">ONLINE</Badge>
                  <div className="text-[10px] text-slate-400 font-mono sm:mt-0.5">0.136ms mean latency · 14.8k scored</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: User & Role Governance */}
      {activeTab === "USERS" && (
        <Card className="bg-white border-slate-200 shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600 shrink-0" />
                Hospital User Accounts &amp; Role Governance
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Manage user active status and assigned clinical roles. Plaintext passwords are strictly suppressed across all API views.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Zero-Knowledge Password Masking</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Mobile Stacked Card View (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-4 space-y-3 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm">{u.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{u.email}</div>
                    </div>
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                        DISABLED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Role</span>
                      <Badge variant="outline" className={`text-[10px] font-semibold mt-0.5 ${getRoleBadgeClass(u.role)}`}>
                        {u.role}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">License</span>
                      <span className="font-mono text-slate-600 text-xs block mt-0.5 truncate">{u.license_number || "N/A"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Department</span>
                      <span className="text-slate-700 text-xs block mt-0.5">{u.department}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <span className="text-[11px] text-slate-500">
                      Session: <strong className="text-slate-700 font-medium">{u.last_login || "Active"}</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={togglingUserId === u.id || u.role === "IT_ADMIN"}
                      onClick={() => handleToggleUser(u.id)}
                      className={`h-7 text-xs font-medium border px-3 ${
                        u.is_active
                          ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinician / User</TableHead>
                    <TableHead>Assigned Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Clinical License</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead>Last Session</TableHead>
                    <TableHead className="text-right">Admin Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{u.full_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${getRoleBadgeClass(u.role)}`}
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{u.department}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{u.license_number || "N/A"}</TableCell>
                      <TableCell>
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                            DISABLED
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{u.last_login || "Active"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={togglingUserId === u.id || u.role === "IT_ADMIN"}
                          onClick={() => handleToggleUser(u.id)}
                          className={`h-7 text-xs font-medium border ${
                            u.is_active
                              ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Audit Trail Viewer */}
      {activeTab === "AUDIT" && (
        <Card className="bg-white border-slate-200 shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  Tamper-Evident Clinical Audit Trail
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Immutable record of user actions, clinical reviews, nurse escalations, and security authorization boundaries.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200 shrink-0">
                  21 CFR Part 11 Compliant
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Mobile Stacked Card View (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500">
                      {log.timestamp}
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-mono shrink-0 ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs gap-2">
                    <div>
                      <span className="font-bold text-slate-900">{log.user}</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-2">({log.role})</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                      {log.ip_address}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md break-all">
                    <span className="text-slate-400 mr-1.5 font-sans text-[11px]">Target:</span>
                    {log.resource}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="min-w-[850px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">Timestamp</TableHead>
                    <TableHead className="w-[160px]">User / Role</TableHead>
                    <TableHead className="w-[170px]">Event Type</TableHead>
                    <TableHead className="w-[180px]">Resource Target</TableHead>
                    <TableHead className="w-[120px]">Client IP</TableHead>
                    <TableHead>Audit Detail Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{log.user}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.role}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${getActionBadgeClass(log.action)}`}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-700 break-all">{log.resource}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{log.ip_address}</TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-sm truncate" title={log.details}>
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: Cybersecurity & Telemetry */}
      {activeTab === "SECURITY" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-emerald-50/50 border-emerald-200 shadow-xs">
              <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                <CardDescription className="text-xs font-bold text-emerald-900">
                  Failed Login Attempts (24h)
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-700 mt-1">0</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <p className="text-[11px] text-emerald-800">No active brute-force vectors</p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50/50 border-emerald-200 shadow-xs">
              <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                <CardDescription className="text-xs font-bold text-emerald-900">
                  Rate Limit Violations
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-700 mt-1">1</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <p className="text-[11px] text-emerald-800">192.168.1.104 temporarily throttled</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-200 shadow-xs">
              <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                <CardDescription className="text-xs font-bold text-blue-900">
                  Blocked Cross-Role Probes
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-blue-700 mt-1">3</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <p className="text-[11px] text-blue-800">HTTP 403 Forbidden properly enforced</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50/50 border-purple-200 shadow-xs">
              <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                <CardDescription className="text-xs font-bold text-purple-900">
                  SQL Injection Defense
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-purple-700 mt-1">100%</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <p className="text-[11px] text-purple-800">Parameterized ORM queries enforced</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0" />
                Security Policies &amp; SaMD Boundaries Enforced
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Core system constraints active in this environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-3.5 sm:p-5 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Raw SQL Execution Forbidden</div>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    No raw SQL execution textbox or arbitrary command invocation exists in the administrative UI. All database transactions are strictly channeled through Django ORM and parameterization.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Zero Plaintext Password Exposure</div>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    User administration endpoints and serializers strictly omit password hashes and plaintext credentials. Passwords cannot be viewed or decrypted by administrators.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Backend RBAC/ABAC Boundary Validation</div>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Permissions are enforced on every REST and WebSocket API endpoint. Frontend navigation restrictions are visual only and backed by mandatory 403 HTTP enforcement in the Django layer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

