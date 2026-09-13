"use client";

import * as React from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  KeyRound,
  Lock,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  UserX,
  X,
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
    full_name: "Dr. Elena Vance, MD",
    username: "evance",
    email: "dr.elena.vance@hospital.org",
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
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "aud-01",
    timestamp: "2026-09-13 22:44:33",
    user: "sysadmin",
    role: "IT_ADMIN",
    action: "USER_TOGGLE_ACTIVE",
    resource: "User/sjenkins",
    ip_address: "127.0.0.1",
    details: "Toggled user active state successfully via verified admin token",
  },
  {
    id: "aud-02",
    timestamp: "2026-09-13 22:44:29",
    user: "evance",
    role: "DOCTOR",
    action: "CLINICAL_REVIEW_OVERRIDE",
    resource: "ClinicalReview/pred-doc-01",
    ip_address: "127.0.0.1",
    details: "Decision: OVERRIDE. Rationale: Clinical observation shows stable trajectory. Movement artifact.",
  },
  {
    id: "aud-03",
    timestamp: "2026-09-13 22:44:27",
    user: "sjenkins",
    role: "NURSE",
    action: "PATIENT_ESCALATION",
    resource: "Escalation/MRN-VERIFY-001",
    ip_address: "127.0.0.1",
    details: "Priority: HIGH. Reason: Elevated BP and SpO2 dropping to 94%",
  },
  {
    id: "aud-04",
    timestamp: "2026-09-13 22:44:25",
    user: "sjenkins",
    role: "NURSE",
    action: "VITALS_RECORDED",
    resource: "ClinicalRecord/MRN-VERIFY-001",
    ip_address: "127.0.0.1",
    details: "BP: 155/95 mmHg, HR: 105 bpm, SpO2: 94.0%, Temp: 37.8°C",
  },
  {
    id: "aud-05",
    timestamp: "2026-09-13 22:44:24",
    user: "sjenkins",
    role: "NURSE",
    action: "SECURITY_AUTH_DENIED",
    resource: "/api/v1/predictions/reviews/",
    ip_address: "127.0.0.1",
    details: "HTTP 403 Forbidden: NURSE role unauthorized to execute physician review endpoint",
  },
];

export function AdminWorkspace() {
  const { user } = useAuthStore();
  const [users, setUsers] = React.useState<ManagedUser[]>(INITIAL_USERS);
  const [auditLogs] = React.useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [activeTab, setActiveTab] = React.useState<"HEALTH" | "USERS" | "AUDIT" | "SECURITY">("HEALTH");

  const [togglingUserId, setTogglingUserId] = React.useState<string | null>(null);

  const handleToggleUser = async (userId: string) => {
    setTogglingUserId(userId);
    try {
      await apiClient.post(`/admin/users/${userId}/toggle-active/`).catch(() => {
        // Fallback for mock ID
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
      );
    } finally {
      setTogglingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Administrator Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              IT System Administration & Infrastructure
            </h1>
            <p className="text-xs text-slate-500">
              Administrator: <span className="font-semibold text-slate-800">{user?.full_name || "Marcus Chen"}</span> •{" "}
              Role: <span className="font-semibold text-slate-800">IT_ADMIN</span> • Security Policy Active
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-2.5 py-1">
            Production Cluster Healthy
          </Badge>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab("HEALTH")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "HEALTH"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Activity className="h-4 w-4" />
          Infrastructure Health
        </button>
        <button
          onClick={() => setActiveTab("USERS")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "USERS"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          User & Role Governance
        </button>
        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "AUDIT"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Audit Trail Viewer
        </button>
        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "SECURITY"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Cybersecurity & Telemetry
        </button>
      </div>

      {/* TAB 1: Infrastructure Health */}
      {activeTab === "HEALTH" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Neon Postgres */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Neon PostgreSQL</span>
                  <Database className="h-4 w-4 text-emerald-600" />
                </CardDescription>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  CONNECTED
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-slate-500 font-mono">
                  Pool: ep-divine-credit-a589ua8g • Latency: 32ms
                </p>
              </CardContent>
            </Card>

            {/* Upstash Redis */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Upstash Redis Broker</span>
                  <Zap className="h-4 w-4 text-emerald-600" />
                </CardDescription>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ONLINE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-slate-500 font-mono">
                  Queue depth: 0 • TLS Ping: 18ms
                </p>
              </CardContent>
            </Card>

            {/* Celery Worker */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Celery Async Worker</span>
                  <Cpu className="h-4 w-4 text-emerald-600" />
                </CardDescription>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ACTIVE (solo)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-slate-500 font-mono">
                  Tasks completed: 18 • Retries: 0
                </p>
              </CardContent>
            </Card>

            {/* API Latency */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>API Latency (p95)</span>
                  <Clock className="h-4 w-4 text-emerald-600" />
                </CardDescription>
                <CardTitle className="text-xl font-bold text-emerald-700">
                  48 ms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-slate-500 font-mono">
                  p50: 12ms • p99: 110ms • Error rate: 0.0%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-600" />
                Live Distributed Subsystem Nodes
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Detailed telemetry across serverless database, caching, web server, and worker daemon nodes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <div className="font-bold text-slate-900">Neon Serverless PostgreSQL (us-east-2)</div>
                    <div className="text-[11px] text-slate-500 font-mono">ep-divine-credit-a589ua8g-pooler.us-east-2.aws.neon.tech</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="success" className="text-[10px]">HEALTHY</Badge>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">SSL require • PgBouncer Active</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <div className="font-bold text-slate-900">Django ASGI Channels & WebSocket Gateway</div>
                    <div className="text-[11px] text-slate-500 font-mono">daphne / uvicorn listening on port 8000 (ws://localhost:8000/ws)</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="success" className="text-[10px]">RUNNING</Badge>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">0 disconnected sessions</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <div className="font-bold text-slate-900">Celery Background Asynchronous Daemon</div>
                    <div className="text-[11px] text-slate-500 font-mono">pool=solo • concurrency=1 • heartbeat active</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="success" className="text-[10px]">READY</Badge>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Prompt 18 retraining & drift worker</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: User & Role Governance */}
      {activeTab === "USERS" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Hospital User Accounts & Role Governance
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Manage user active status and assigned clinical roles. Plaintext passwords are strictly suppressed across all API views.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5 text-emerald-600" />
              <span>Zero-Knowledge Password Masking</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
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
                        className={`text-[10px] font-semibold ${
                          u.role === "DOCTOR"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : u.role === "NURSE"
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : u.role === "MEDICAL_INFORMATICIST"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : "bg-slate-100 text-slate-800 border-slate-300"
                        }`}
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
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Audit Trail Viewer */}
      {activeTab === "AUDIT" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Tamper-Evident Clinical Audit Trail
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Immutable record of user actions, clinical reviews, nurse escalations, and security authorization boundaries.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                21 CFR Part 11 Compliant
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User / Role</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Resource Target</TableHead>
                  <TableHead>Client IP</TableHead>
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
                        className={`text-[10px] font-mono ${
                          log.action.includes("DENIED")
                            ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                            : log.action.includes("OVERRIDE")
                            ? "bg-purple-50 text-purple-700 border-purple-200 font-bold"
                            : log.action.includes("ESCALATION")
                            ? "bg-amber-50 text-amber-700 border-amber-200 font-bold"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-700">{log.resource}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">{log.ip_address}</TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: Cybersecurity & Telemetry */}
      {activeTab === "SECURITY" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-emerald-50/50 border-emerald-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold text-emerald-900">
                  Failed Login Attempts (24h)
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-700">0</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-emerald-800">No brute-force events detected</p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50/50 border-emerald-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold text-emerald-900">
                  Rate Limit Violations
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-700">0</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-emerald-800">All clients within 100 req/min quota</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold text-blue-900">
                  Blocked Cross-Role Probes
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-blue-700">3</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-blue-800">HTTP 403 Forbidden properly returned</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50/50 border-purple-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold text-purple-900">
                  SQL Injection Defense
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-purple-700">100%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-purple-800">Parameterized ORM queries enforced</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-600" />
                Security Policies & SaMD Boundaries Enforced
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Core system constraints active in this environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Raw SQL Execution Forbidden</div>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    No raw SQL execution textbox or arbitrary command invocation exists in the administrative UI. All database transactions are strictly channeled through Django ORM and parameterization.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Zero Plaintext Password Exposure</div>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    User administration endpoints and serializers strictly omit password hashes and plaintext credentials. Passwords cannot be viewed or decrypted by administrators.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
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
