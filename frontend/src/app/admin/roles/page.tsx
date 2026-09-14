"use client";

import * as React from "react";
import {
  Key,
  ShieldCheck,
  Shield,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Users,
  Plus,
  Search,
  FileCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface PermissionScope {
  id: string;
  name: string;
  category: "Clinical Core" | "AI Diagnostics" | "MLOps & Informatics" | "IT & System Governance";
  description: string;
  doctor: "FULL" | "PARTIAL" | "NONE";
  nurse: "FULL" | "PARTIAL" | "NONE";
  informaticist: "FULL" | "PARTIAL" | "NONE";
  itAdmin: "FULL" | "PARTIAL" | "NONE";
}

const PERMISSION_SCOPES: PermissionScope[] = [
  // Clinical Core
  {
    id: "view_patients",
    name: "View Patient Records & Vitals",
    category: "Clinical Core",
    description: "Read-only access to patient demographics, historical encounter notes, and active vitals.",
    doctor: "FULL",
    nurse: "PARTIAL", // Assigned patients only
    informaticist: "PARTIAL", // De-identified records only
    itAdmin: "NONE", // Zero access to PHI without break-glass
  },
  {
    id: "record_vitals",
    name: "Record Bedside Vitals & Triage",
    category: "Clinical Core",
    description: "Submit bedside blood pressure, SpO2, heart rate, and initial triage score.",
    doctor: "FULL",
    nurse: "FULL",
    informaticist: "NONE",
    itAdmin: "NONE",
  },
  {
    id: "escalate_patient",
    name: "Emergency Triage Escalation",
    category: "Clinical Core",
    description: "Trigger rapid response team and emergency code alerts across hospital paging channels.",
    doctor: "FULL",
    nurse: "FULL",
    informaticist: "NONE",
    itAdmin: "NONE",
  },

  // AI Diagnostics
  {
    id: "run_prediction",
    name: "Execute SaMD ML Risk Inferences",
    category: "AI Diagnostics",
    description: "Invoke mortality, readmission, and sepsis risk prediction inference models.",
    doctor: "FULL",
    nurse: "NONE",
    informaticist: "FULL", // Batch & validation inference
    itAdmin: "NONE",
  },
  {
    id: "review_prediction",
    name: "Clinical Sign-Off & ML Overrides",
    category: "AI Diagnostics",
    description: "Provide physician sign-off or record reasoned override on AI diagnostic recommendations.",
    doctor: "FULL",
    nurse: "NONE",
    informaticist: "PARTIAL", // Retrospective review
    itAdmin: "NONE",
  },
  {
    id: "use_ai_assistant",
    name: "AI Clinical Co-Pilot Assistant",
    category: "AI Diagnostics",
    description: "Interact with grounded RAG clinical reasoning assistant and PubMed evidence retrieval.",
    doctor: "FULL",
    nurse: "PARTIAL", // Bedside protocol queries
    informaticist: "FULL",
    itAdmin: "NONE",
  },

  // MLOps & Informatics
  {
    id: "view_model_registry",
    name: "Inspect Model Registry & Artifacts",
    category: "MLOps & Informatics",
    description: "Access champion/challenger weights, SaMD classification dossiers, and version trees.",
    doctor: "PARTIAL", // Summary card only
    nurse: "NONE",
    informaticist: "FULL",
    itAdmin: "PARTIAL", // Service health monitoring
  },
  {
    id: "monitor_drift",
    name: "Drift & Data Quality Governance",
    category: "MLOps & Informatics",
    description: "Monitor KS-test, Wasserstein distance, and biomarker distribution shift monitors.",
    doctor: "NONE",
    nurse: "NONE",
    informaticist: "FULL",
    itAdmin: "PARTIAL", // Alerting logs
  },
  {
    id: "deploy_model",
    name: "Promote Challenger to Champion",
    category: "MLOps & Informatics",
    description: "Execute staged canary rollouts and promote new model weights to live inference.",
    doctor: "NONE",
    nurse: "NONE",
    informaticist: "FULL",
    itAdmin: "PARTIAL", // Infrastructure gateway routing
  },

  // IT & System Governance
  {
    id: "manage_users",
    name: "Staff Account & Credential Lifecycle",
    category: "IT & System Governance",
    description: "Create, suspend, unlock, and provision MFA credentials for hospital personnel.",
    doctor: "NONE",
    nurse: "NONE",
    informaticist: "NONE",
    itAdmin: "FULL",
  },
  {
    id: "manage_roles",
    name: "RBAC Matrix & Privilege Scoping",
    category: "IT & System Governance",
    description: "Modify role boundary definitions and enforce least-privilege policies.",
    doctor: "NONE",
    nurse: "NONE",
    informaticist: "NONE",
    itAdmin: "FULL",
  },
  {
    id: "view_all_logs",
    name: "Immutable Audit Ledger & Telemetry",
    category: "IT & System Governance",
    description: "Access 21 CFR Part 11 cryptographic audit trails and distributed node telemetry.",
    doctor: "NONE",
    nurse: "NONE",
    informaticist: "PARTIAL", // Model audits only
    itAdmin: "FULL",
  },
  {
    id: "manage_configuration",
    name: "Subsystem & Infrastructure Routing",
    category: "IT & System Governance",
    description: "Configure Neon Postgres, Upstash Redis, Celery daemon, and WebSocket gateways.",
    doctor: "NONE",
    nurse: "NONE",
    informaticist: "NONE",
    itAdmin: "FULL",
  },
];

const ROLES_OVERVIEW = [
  {
    role: "DOCTOR",
    label: "Attending Physician / Doctor",
    description: "Full clinical diagnostics authority, SaMD AI inference execution, and clinical decision sign-offs.",
    staffCount: 2,
    activeStaff: ["Dr. Elena Vance, MD", "Dr. James Park, MD"],
    riskLevel: "High Clinical Impact",
    icon: Stethoscope,
    color: "text-emerald-600",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    badgeBg: "bg-emerald-100 text-emerald-800",
  },
  {
    role: "NURSE",
    label: "Triage & Bedside Nurse",
    description: "Bedside vitals monitoring, patient intake recording, emergency code escalation, and shift triage.",
    staffCount: 1,
    activeStaff: ["Sarah Jenkins, RN"],
    riskLevel: "Direct Patient Care",
    icon: Shield,
    color: "text-sky-600",
    border: "border-sky-200",
    bg: "bg-sky-50",
    badgeBg: "bg-sky-100 text-sky-800",
  },
  {
    role: "MEDICAL_INFORMATICIST",
    label: "Medical Informaticist / MLOps",
    description: "Model governance, drift surveillance, fairness evaluations, and SaMD Class II regulatory validation.",
    staffCount: 1,
    activeStaff: ["Alex Rivera, MSc"],
    riskLevel: "Model Lifecycle Governance",
    icon: Activity,
    color: "text-purple-600",
    border: "border-purple-200",
    bg: "bg-purple-50",
    badgeBg: "bg-purple-100 text-purple-800",
  },
  {
    role: "IT_ADMIN",
    label: "IT System & Infrastructure Admin",
    description: "Full zero-trust infrastructure governance, user lifecycle management, and security compliance.",
    staffCount: 1,
    activeStaff: ["Marcus Chen"],
    riskLevel: "Full System Infrastructure",
    icon: ShieldCheck,
    color: "text-slate-800",
    border: "border-slate-300",
    bg: "bg-slate-100",
    badgeBg: "bg-slate-200 text-slate-800",
  },
];

export default function AdminRolesPage() {
  const [activeTab, setActiveTab] = React.useState<"matrix" | "cards">("matrix");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // New Role Form State
  const [newRoleName, setNewRoleName] = React.useState("");
  const [newRoleDesc, setNewRoleDesc] = React.useState("");
  const [newRoleParent, setNewRoleParent] = React.useState("NURSE");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setIsAddRoleModalOpen(false);
    showToast(`Custom role "${newRoleName}" created and queued for compliance officer audit.`);
    setNewRoleName("");
    setNewRoleDesc("");
  };

  const filteredScopes = PERMISSION_SCOPES.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderPermissionBadge = (val: "FULL" | "PARTIAL" | "NONE") => {
    if (val === "FULL") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Full Grant
        </span>
      );
    }
    if (val === "PARTIAL") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
          <AlertCircle className="h-3 w-3 text-amber-600" />
          Scoped / Read
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5">
        <XCircle className="h-3 w-3 text-slate-400" />
        Denied
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold">
              RBAC Governance & Boundaries
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <Lock className="h-3 w-3" /> Least Privilege Enforced
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Key className="h-7 w-7 text-purple-600" />
            Roles & Permission Scopes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hospital-wide Role-Based Access Control (RBAC) matrix separating clinical practice, MLOps, and infrastructure governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsAddRoleModalOpen(true)}
            className="text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Define Custom Role
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Users className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Configured Roles</p>
              <p className="text-xl font-bold text-slate-900">4 Base Roles</p>
              <p className="text-[11px] text-purple-700 font-medium">5 active staff accounts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <Key className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Granular Permissions</p>
              <p className="text-xl font-bold text-slate-900">{PERMISSION_SCOPES.length} Scopes</p>
              <p className="text-[11px] text-emerald-700 font-medium">4 operational domains</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <ShieldCheck className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Zero Standing Root</p>
              <p className="text-xl font-bold text-slate-900">100% Aligned</p>
              <p className="text-[11px] text-sky-700 font-medium">Break-glass audit logged</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <FileCheck className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Last Matrix Audit</p>
              <p className="text-xl font-bold text-slate-900">Sep 14, 2026</p>
              <p className="text-[11px] text-amber-700 font-medium">SOC 2 / HIPAA certified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "matrix"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Permission Comparison Matrix
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "cards"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Role Cards & Boundaries ({ROLES_OVERVIEW.length})
          </button>
        </div>

        {activeTab === "matrix" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
              {(["ALL", "Clinical Core", "AI Diagnostics", "MLOps & Informatics", "IT & System Governance"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                    selectedCategory === cat
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {cat === "IT & System Governance" ? "IT Gov" : cat === "MLOps & Informatics" ? "MLOps" : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Filter permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: RBAC Comparison Matrix */}
      {activeTab === "matrix" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Cross-Role Granular Permission Matrix
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Strict boundary enforcement preventing cross-privilege pollution. All API routes require verified token matching these scopes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="p-3 font-bold text-slate-700 min-w-[220px]">Permission Scope</th>
                  <th className="p-3 font-bold text-slate-700 min-w-[140px]">Domain</th>
                  <th className="p-3 font-bold text-emerald-800 text-center min-w-[120px] bg-emerald-50/40">DOCTOR</th>
                  <th className="p-3 font-bold text-sky-800 text-center min-w-[120px] bg-sky-50/40">NURSE</th>
                  <th className="p-3 font-bold text-purple-800 text-center min-w-[120px] bg-purple-50/40">INFORMATICIST</th>
                  <th className="p-3 font-bold text-slate-800 text-center min-w-[120px] bg-slate-100/60">IT ADMIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScopes.map((scope) => (
                  <tr key={scope.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{scope.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{scope.description}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-white">
                        {scope.category}
                      </Badge>
                    </td>
                    <td className="p-3 text-center bg-emerald-50/20">
                      {renderPermissionBadge(scope.doctor)}
                    </td>
                    <td className="p-3 text-center bg-sky-50/20">
                      {renderPermissionBadge(scope.nurse)}
                    </td>
                    <td className="p-3 text-center bg-purple-50/20">
                      {renderPermissionBadge(scope.informaticist)}
                    </td>
                    <td className="p-3 text-center bg-slate-100/30">
                      {renderPermissionBadge(scope.itAdmin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Detailed Role Cards */}
      {activeTab === "cards" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {ROLES_OVERVIEW.map((r) => {
            const Icon = r.icon;
            const rolePermissions = PERMISSION_SCOPES.filter((p) => {
              if (r.role === "DOCTOR") return p.doctor !== "NONE";
              if (r.role === "NURSE") return p.nurse !== "NONE";
              if (r.role === "MEDICAL_INFORMATICIST") return p.informaticist !== "NONE";
              return p.itAdmin !== "NONE";
            });

            return (
              <Card key={r.role} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl ${r.bg} flex items-center justify-center shrink-0 border ${r.border}`}>
                        <Icon className={`h-6 w-6 ${r.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900">{r.role.replace(/_/g, " ")}</CardTitle>
                        <p className="text-xs text-slate-500">{r.label}</p>
                      </div>
                    </div>
                    <Badge className={`${r.badgeBg} border-0 text-[10px] font-bold`}>
                      {r.riskLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Assigned Staff Personnel ({r.staffCount})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {r.activeStaff.map((staff) => (
                        <Badge key={staff} variant="outline" className="text-xs bg-slate-50 font-medium text-slate-700">
                          {staff}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Granted Operational Scopes ({rolePermissions.length})
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {rolePermissions.map((perm) => (
                        <div key={perm.id} className="flex items-center justify-between text-xs p-1.5 rounded-md bg-slate-50/70 border border-slate-100">
                          <span className="font-semibold text-slate-800">{perm.name}</span>
                          <span className="text-[10px] font-bold text-slate-500">{perm.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">auth_role: &quot;{r.role}&quot;</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showToast(`Audit trail exported for role ${r.role}.`)}
                      className="text-xs h-7 font-semibold"
                    >
                      Export Audit Dossier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Custom Role Modal */}
      {isAddRoleModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddRoleModalOpen(false)}
          title="Define Custom RBAC Role & Scope"
        >
          <form onSubmit={handleCreateRole} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Role Identifier (Caps / Underscores)</label>
              <Input
                placeholder="e.g. CLINICAL_PHARMACIST"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value.toUpperCase())}
                required
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Role Description & Clinical Scope</label>
              <textarea
                placeholder="Describe authorized clinical or technical capabilities..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Inherit Base Permissions From</label>
              <select
                value={newRoleParent}
                onChange={(e) => setNewRoleParent(e.target.value)}
                className="w-full rounded-md border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600 bg-white"
              >
                <option value="NURSE">NURSE (Bedside triage & vitals recording)</option>
                <option value="DOCTOR">DOCTOR (Physician diagnosis & AI execution)</option>
                <option value="MEDICAL_INFORMATICIST">MEDICAL_INFORMATICIST (MLOps & model registry)</option>
              </select>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 flex items-start gap-2 text-xs text-purple-900">
              <Info className="h-4 w-4 text-purple-700 shrink-0 mt-0.5" />
              <span>
                Under 21 CFR Part 11 and SaMD Class II governance, creating a custom role will trigger an immutable compliance audit record.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddRoleModalOpen(false)}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white"
              >
                Submit Role Definition
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
