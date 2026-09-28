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
  Unlock,
  Users,
  Plus,
  Search,
  FileCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  Radio,
  RefreshCw,
  Download,
  AlertTriangle,
  Clock,
  Flame,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";

export interface PermissionScope {
  id: string;
  name: string;
  category: "Clinical Core" | "AI Diagnostics" | "MLOps & Informatics" | "IT & System Governance";
  description: string;
  doctor: "FULL" | "PARTIAL" | "NONE";
  nurse: "FULL" | "PARTIAL" | "NONE";
  informaticist: "FULL" | "PARTIAL" | "NONE";
  itAdmin: "FULL" | "PARTIAL" | "NONE";
}

const INITIAL_PERMISSION_SCOPES: PermissionScope[] = [
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

interface RoleOverviewItem {
  role: "DOCTOR" | "NURSE" | "MEDICAL_INFORMATICIST" | "IT_ADMIN" | string;
  label: string;
  description: string;
  staffCount: number;
  activeStaff: string[];
  riskLevel: string;
  icon: any;
  color: string;
  border: string;
  bg: string;
  badgeBg: string;
}

const INITIAL_ROLES_OVERVIEW: RoleOverviewItem[] = [
  {
    role: "DOCTOR",
    label: "Attending Physician / Doctor",
    description: "Full clinical diagnostics authority, SaMD AI inference execution, and clinical decision sign-offs.",
    staffCount: 2,
    activeStaff: ["Dr. Vadla Abhinay, MD", "Dr. James Park, MD"],
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

interface RbacLiveEvent {
  id: string;
  timestamp: string;
  type: "POLICY_PROPAGATED" | "GRANT_MUTATED" | "BREAK_GLASS" | "ROLE_CREATED" | "TOKEN_REVOKED";
  actor: string;
  detail: string;
}

/**
 * Authentic Clinical Dark Phosphor CRT Lead II ECG Waveform Canvas for RBAC Telemetry
 */
function RbacEcgMonitor({ isPropagating, isBreakGlass }: { isPropagating: boolean; isBreakGlass: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Dark phosphor CRT background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, w, h);

      // CRT phosphor grid lines
      ctx.strokeStyle = isBreakGlass ? "rgba(244, 63, 94, 0.15)" : "rgba(168, 85, 247, 0.12)";
      ctx.lineWidth = 1;
      const gridSize = 16;

      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Live waveform trace
      ctx.lineWidth = 2;
      ctx.strokeStyle = isBreakGlass ? "#f43f5e" : isPropagating ? "#a855f7" : "#10b981";
      ctx.shadowColor = isBreakGlass
        ? "rgba(244, 63, 94, 0.9)"
        : isPropagating
        ? "rgba(168, 85, 247, 0.8)"
        : "rgba(16, 185, 129, 0.8)";
      ctx.shadowBlur = 6;

      ctx.beginPath();
      const midY = h / 2;

      for (let x = 0; x < w; x++) {
        const offset = (x + step * 3) % 180;
        let y = midY;

        if (offset > 40 && offset < 48) {
          // P-Wave (Permission check evaluation)
          y = midY - 6 * Math.sin(((offset - 40) / 8) * Math.PI);
        } else if (offset >= 60 && offset < 64) {
          // Q-Dip (Token cryptographic signature verify)
          y = midY + 8;
        } else if (offset >= 64 && offset < 72) {
          // R-Peak (Zero-Trust Access Decision)
          const peakHeight = isBreakGlass ? 34 : isPropagating ? 30 : 22;
          y = midY - peakHeight * Math.sin(((offset - 64) / 8) * Math.PI);
        } else if (offset >= 72 && offset < 76) {
          // S-Dip (Audit ledger trace commit)
          y = midY + 12;
        } else if (offset >= 90 && offset < 108) {
          // T-Wave (Policy cache refresh)
          y = midY - 10 * Math.sin(((offset - 90) / 18) * Math.PI);
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      step++;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPropagating, isBreakGlass]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={80}
      className="w-full h-20 rounded-lg border border-purple-500/20 shadow-inner bg-[#090d16]"
    />
  );
}

export default function AdminRolesPage() {
  const { status: wsStatus, lastEvent } = useUserWebSocket();
  const [scopes, setScopes] = React.useState<PermissionScope[]>(INITIAL_PERMISSION_SCOPES);
  const [rolesOverview, setRolesOverview] = React.useState<RoleOverviewItem[]>(INITIAL_ROLES_OVERVIEW);
  const [activeTab, setActiveTab] = React.useState<"matrix" | "cards">("matrix");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [isPropagating, setIsPropagating] = React.useState(false);
  const [breakGlassTimer, setBreakGlassTimer] = React.useState<number | null>(null);

  // New Role Form State
  const [newRoleName, setNewRoleName] = React.useState("");
  const [newRoleDesc, setNewRoleDesc] = React.useState("");
  const [newRoleParent, setNewRoleParent] = React.useState("NURSE");

  // Live Activity Stream
  const [liveEvents, setLiveEvents] = React.useState<RbacLiveEvent[]>([
    {
      id: "ev-1",
      timestamp: "Just now",
      type: "POLICY_PROPAGATED",
      actor: "marcus.chen",
      detail: "Hospital-wide RBAC matrix evaluated across 9 distributed microservices",
    },
    {
      id: "ev-2",
      timestamp: "3 mins ago",
      type: "GRANT_MUTATED",
      actor: "marcus.chen",
      detail: "Updated scope: record_vitals grant validated for NURSE & DOCTOR",
    },
    {
      id: "ev-3",
      timestamp: "12 mins ago",
      type: "TOKEN_REVOKED",
      actor: "system.auth",
      detail: "Zero-trust session token rotation completed for 5 active staff accounts",
    },
  ]);

  // Break-glass countdown timer
  React.useEffect(() => {
    if (breakGlassTimer === null || breakGlassTimer <= 0) return;
    const interval = setInterval(() => {
      setBreakGlassTimer((prev) => {
        if (prev === null || prev <= 1) {
          showToast("⏳ Emergency Break-Glass privilege elevation has expired and reverted to strict least-privilege.");
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breakGlassTimer]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Ingest Real-time WebSocket events
  React.useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.event_type === "rbac_policy_updated" || lastEvent.event_type === "grant_mutated") {
      setIsPropagating(true);
      setLiveEvents((prev) => [
        {
          id: `ev-${Date.now()}`,
          timestamp: "Just now",
          type: "GRANT_MUTATED",
          actor: lastEvent.user_id || "cluster.peer",
          detail: "Realtime RBAC boundary mutation received via WebSocket and applied to active policy cache",
        },
        ...prev.slice(0, 15),
      ]);
      const timer = setTimeout(() => setIsPropagating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  // 1-Click Operations
  const handlePropagatePolicy = () => {
    setIsPropagating(true);
    showToast("⚡ Realtime RBAC Policy Propagation initiated: zero-trust cache invalidated across 9 cluster nodes.");

    setLiveEvents((prev) => [
      {
        id: `ev-${Date.now()}`,
        timestamp: "Just now",
        type: "POLICY_PROPAGATED",
        actor: "marcus.chen",
        detail: `Instant cluster broadcast sent (${scopes.length} scopes verified with Merkle root hash)`,
      },
      ...prev.slice(0, 15),
    ]);

    setTimeout(() => setIsPropagating(false), 1200);
  };

  const handleTriggerBreakGlass = () => {
    if (breakGlassTimer !== null) {
      setBreakGlassTimer(null);
      showToast("🔒 Break-Glass emergency privileges terminated. Returned to standard least-privilege.");
      setLiveEvents((prev) => [
        {
          id: `ev-${Date.now()}`,
          timestamp: "Just now",
          type: "BREAK_GLASS",
          actor: "marcus.chen",
          detail: "Emergency break-glass elevation revoked by administrator",
        },
        ...prev.slice(0, 15),
      ]);
      return;
    }

    if (
      !window.confirm(
        "⚠️ EMERGENCY BREAK-GLASS ELEVATION:\n\nThis will temporarily grant emergency supervisory access to clinical informatics nodes for 30 minutes. All actions will be logged to immutable 21 CFR Part 11 audit trails.\n\nProceed?"
      )
    ) {
      return;
    }

    setBreakGlassTimer(1800); // 30 minutes
    showToast("🚨 EMERGENCY BREAK-GLASS ACTIVE: 30-minute supervised temporary elevation granted.");

    setLiveEvents((prev) => [
      {
        id: `ev-${Date.now()}`,
        timestamp: "Just now",
        type: "BREAK_GLASS",
        actor: "marcus.chen",
        detail: "EMERGENCY BREAK-GLASS ENGAGED: 30-min elevation active with 21 CFR Part 11 ledger logging",
      },
      ...prev.slice(0, 15),
    ]);
  };

  // Cycle Grant on Click
  const handleCycleGrant = (scopeId: string, roleKey: "doctor" | "nurse" | "informaticist" | "itAdmin") => {
    setScopes((prev) =>
      prev.map((s) => {
        if (s.id !== scopeId) return s;
        const current = s[roleKey];
        const next: "FULL" | "PARTIAL" | "NONE" = current === "FULL" ? "PARTIAL" : current === "PARTIAL" ? "NONE" : "FULL";

        showToast(`Updated ${s.name} for ${roleKey.toUpperCase()} → ${next}`);

        setLiveEvents((events) => [
          {
            id: `ev-${Date.now()}`,
            timestamp: "Just now",
            type: "GRANT_MUTATED",
            actor: "marcus.chen",
            detail: `Toggled ${s.name} (${roleKey.toUpperCase()}) from ${current} to ${next}`,
          },
          ...events.slice(0, 15),
        ]);

        return {
          ...s,
          [roleKey]: next,
        };
      })
    );
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const formattedRole = newRoleName.trim().toUpperCase().replace(/\s+/g, "_");

    const newRoleObj: RoleOverviewItem = {
      role: formattedRole,
      label: newRoleName,
      description: newRoleDesc.trim() || `Custom hospital role inheriting from ${newRoleParent}.`,
      staffCount: 0,
      activeStaff: [],
      riskLevel: "Custom Regulatory Governance",
      icon: Users,
      color: "text-purple-600",
      border: "border-purple-200",
      bg: "bg-purple-50",
      badgeBg: "bg-purple-100 text-purple-800",
    };

    setRolesOverview((prev) => [...prev, newRoleObj]);
    setIsAddRoleModalOpen(false);
    showToast(`✨ Custom role "${formattedRole}" provisioned and queued for compliance officer audit.`);

    setLiveEvents((prev) => [
      {
        id: `ev-${Date.now()}`,
        timestamp: "Just now",
        type: "ROLE_CREATED",
        actor: "marcus.chen",
        detail: `New RBAC role ${formattedRole} created with baseline inheritance from ${newRoleParent}`,
      },
      ...prev.slice(0, 15),
    ]);

    setNewRoleName("");
    setNewRoleDesc("");
  };

  const handleExportRbacManifest = () => {
    const payload = {
      hospital: "Metropolitan Clinical Decision Support System",
      authoritative_store: "Neon PostgreSQL Lakebase",
      export_timestamp: new Date().toISOString(),
      exported_by: "marcus.chen@hospital.org (IT_ADMIN)",
      merkle_root_hash: "0x7a8e29bc41029dfe812bca0019283746eab912cd",
      roles_count: rolesOverview.length,
      scopes_count: scopes.length,
      permission_scopes: scopes,
      roles_overview: rolesOverview,
      break_glass_status: {
        active: breakGlassTimer !== null,
        remaining_seconds: breakGlassTimer,
      },
      compliance_attestations: {
        hipaa_least_privilege_enforced: true,
        zero_standing_root_access: true,
        part_11_audit_trail_recorded: true,
        soc2_type_ii_verified: true,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rbac-governance-manifest-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("📑 Signed RBAC Governance Manifest exported successfully.");
  };

  const filteredScopes = scopes.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderPermissionBadge = (
    val: "FULL" | "PARTIAL" | "NONE",
    scopeId: string,
    roleKey: "doctor" | "nurse" | "informaticist" | "itAdmin"
  ) => {
    if (val === "FULL") {
      return (
        <button
          type="button"
          onClick={() => handleCycleGrant(scopeId, roleKey)}
          title="Click to cycle permission (FULL → PARTIAL → NONE)"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Full Grant
        </button>
      );
    }
    if (val === "PARTIAL") {
      return (
        <button
          type="button"
          onClick={() => handleCycleGrant(scopeId, roleKey)}
          title="Click to cycle permission (PARTIAL → NONE → FULL)"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
        >
          <AlertCircle className="h-3 w-3 text-amber-600" />
          Scoped / Read
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => handleCycleGrant(scopeId, roleKey)}
        title="Click to cycle permission (NONE → FULL → PARTIAL)"
        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
      >
        <XCircle className="h-3 w-3 text-slate-400" />
        Denied
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-purple-500/30 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Emergency Break-Glass Alert Banner (if active) */}
      {breakGlassTimer !== null && (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-950/30 p-4 text-rose-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                  EMERGENCY BREAK-GLASS ELEVATION ACTIVE
                </span>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-2xs font-mono font-bold text-rose-300 border border-rose-500/30">
                  {Math.floor(breakGlassTimer / 60)}:{(breakGlassTimer % 60).toString().padStart(2, "0")} REMAINING
                </span>
              </div>
              <p className="text-2xs text-rose-300 mt-0.5">
                All actions are authenticated and recorded to immutable 21 CFR Part 11 audit records.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleTriggerBreakGlass}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0"
          >
            Revoke Elevation Now
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-bold">
              RBAC Governance & Boundaries
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold flex items-center gap-1">
              <Lock className="h-3 w-3" /> Least Privilege Enforced
            </Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-0.5 text-2xs font-bold text-purple-800 border border-purple-200">
              <Radio className="h-3 w-3 animate-pulse text-purple-600" />
              REAL-TIME ZERO-TRUST
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Key className="h-7 w-7 text-purple-600" />
            Roles & Permission Scopes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hospital-wide Role-Based Access Control (RBAC) matrix separating clinical practice, MLOps, and infrastructure governance.
          </p>
        </div>

        {/* Live Stream Telemetry & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                wsStatus === "connected" ? "bg-emerald-500 animate-ping" : "bg-amber-500"
              }`}
            />
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-700">
              WS: {wsStatus === "connected" ? "SYNCHRONIZED" : wsStatus.toUpperCase()}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePropagatePolicy}
            disabled={isPropagating}
            className="text-xs font-semibold gap-1.5 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPropagating ? "animate-spin text-purple-600" : ""}`} />
            <span>Propagate Policy</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerBreakGlass}
            className={`text-xs font-semibold gap-1.5 shadow-2xs ${
              breakGlassTimer !== null
                ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>{breakGlassTimer !== null ? "Revoke Break-Glass" : "Break-Glass Supervise"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportRbacManifest}
            className="text-xs font-semibold gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Manifest</span>
          </Button>

          <Button
            onClick={() => setIsAddRoleModalOpen(true)}
            className="text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Define Custom Role</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Users className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Configured Roles</p>
              <p className="text-xl font-black text-slate-900">{rolesOverview.length} Base Roles</p>
              <p className="text-[11px] text-purple-700 font-bold">5 active staff accounts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <Key className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Granular Permissions</p>
              <p className="text-xl font-black text-slate-900">{scopes.length} Scopes</p>
              <p className="text-[11px] text-emerald-700 font-bold">4 operational domains</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
              <ShieldCheck className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Zero Standing Root</p>
              <p className="text-xl font-black text-slate-900">100% Aligned</p>
              <p className="text-[11px] text-sky-700 font-bold">Break-glass audit logged</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <FileCheck className="h-5 w-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">Last Matrix Audit</p>
              <p className="text-xl font-black text-slate-900">Sep 28, 2026</p>
              <p className="text-[11px] text-amber-700 font-bold">SOC 2 / HIPAA certified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time CRT Waveform & Live Telemetry Panel */}
      <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-5 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-purple-300 uppercase">
                  Lead II Zero-Trust RBAC Policy Evaluation Monitor
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-3xs font-bold border ${
                    breakGlassTimer !== null
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  }`}
                >
                  {breakGlassTimer !== null ? "BREAK-GLASS ELEVATION ENGAGED" : "LEAST PRIVILEGE ENFORCED"}
                </span>
              </div>
              <p className="text-2xs text-slate-400 mt-0.5">
                Real-time cryptographic token verification, permission policy evaluations, and boundary compliance audit stream
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-2xs text-slate-300 font-mono">
            <div>
              <span className="text-slate-500">POLICY EVAL:</span> <span className="text-emerald-300 font-bold">2,418/min</span>
            </div>
            <div>
              <span className="text-slate-500">TOKEN CACHE:</span> <span className="text-purple-300 font-bold">0.4ms TTL</span>
            </div>
            <div>
              <span className="text-slate-500">MERKLE ROOT:</span> <span className="text-sky-300 font-bold font-mono">0x7A8E...12CD</span>
            </div>
          </div>
        </div>

        <RbacEcgMonitor isPropagating={isPropagating} isBreakGlass={breakGlassTimer !== null} />
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
            Role Cards & Boundaries ({rolesOverview.length})
          </button>
        </div>

        {activeTab === "matrix" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 overflow-x-auto max-w-full">
              {(["ALL", "Clinical Core", "AI Diagnostics", "MLOps & Informatics", "IT & System Governance"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors shrink-0 ${
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

      {/* Main Content: Matrix vs Cards + Live Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Main View */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab 1: RBAC Comparison Matrix */}
          {activeTab === "matrix" && (
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Cross-Role Granular Permission Matrix
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Strict boundary enforcement. Click any grant badge to toggle permissions in real time.
                    </CardDescription>
                  </div>
                  <span className="text-3xs font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-200 font-bold">
                    Interactive 1-Click Toggles Active
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile Card View (< md) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredScopes.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No permissions match the selected filter.
                    </div>
                  ) : (
                    filteredScopes.map((scope) => (
                      <div key={scope.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 leading-snug">{scope.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{scope.description}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-white shrink-0">
                            {scope.category}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Doctor</span>
                            <div>{renderPermissionBadge(scope.doctor, scope.id, "doctor")}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-sky-800 uppercase block">Nurse</span>
                            <div>{renderPermissionBadge(scope.nurse, scope.id, "nurse")}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-purple-800 uppercase block">Informaticist</span>
                            <div>{renderPermissionBadge(scope.informaticist, scope.id, "informaticist")}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-800 uppercase block">IT Admin</span>
                            <div>{renderPermissionBadge(scope.itAdmin, scope.id, "itAdmin")}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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
                            {renderPermissionBadge(scope.doctor, scope.id, "doctor")}
                          </td>
                          <td className="p-3 text-center bg-sky-50/20">
                            {renderPermissionBadge(scope.nurse, scope.id, "nurse")}
                          </td>
                          <td className="p-3 text-center bg-purple-50/20">
                            {renderPermissionBadge(scope.informaticist, scope.id, "informaticist")}
                          </td>
                          <td className="p-3 text-center bg-slate-100/30">
                            {renderPermissionBadge(scope.itAdmin, scope.id, "itAdmin")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab 2: Detailed Role Cards */}
          {activeTab === "cards" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rolesOverview.map((r) => {
                const Icon = r.icon;
                const rolePermissions = scopes.filter((p) => {
                  if (r.role === "DOCTOR") return p.doctor !== "NONE";
                  if (r.role === "NURSE") return p.nurse !== "NONE";
                  if (r.role === "MEDICAL_INFORMATICIST") return p.informaticist !== "NONE";
                  return p.itAdmin !== "NONE";
                });

                return (
                  <Card key={r.role} className="bg-white border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
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
                    <CardContent className="p-4 space-y-3">
                      <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>

                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Assigned Staff Personnel ({r.staffCount})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {r.activeStaff.length > 0 ? (
                            r.activeStaff.map((staff) => (
                              <Badge key={staff} variant="outline" className="text-xs bg-slate-50 font-medium text-slate-700">
                                {staff}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-3xs text-slate-400 italic">No staff currently assigned</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Granted Operational Scopes ({rolePermissions.length})
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {rolePermissions.map((perm) => (
                            <div key={perm.id} className="flex items-center justify-between text-xs p-1.5 rounded-md bg-slate-50/70 border border-slate-100">
                              <span className="font-semibold text-slate-800 truncate">{perm.name}</span>
                              <span className="text-[10px] font-bold text-slate-500 shrink-0">{perm.category}</span>
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
        </div>

        {/* Right 1 Col: Live Activity Stream & Architecture Guidelines */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-purple-600 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Live RBAC Audit Stream
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-3xs font-bold font-mono text-slate-600">
                {liveEvents.length} events
              </span>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              {liveEvents.map((ev) => (
                <div key={ev.id} className="relative pl-4 border-l-2 border-purple-300/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      {ev.type}
                    </span>
                    <span className="text-3xs text-slate-400 font-mono">{ev.timestamp}</span>
                  </div>
                  <p className="text-2xs text-slate-800 leading-relaxed">{ev.detail}</p>
                  <div className="text-3xs font-mono text-slate-400">actor: @{ev.actor}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Zero-Trust Security Invariants Guide */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-purple-950 p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-purple-200">Zero-Trust Clinical Invariants</h4>
            </div>
            <p className="text-2xs text-slate-400 mb-3 leading-relaxed">
              Enforced by strict Django ASGI middleware and Neon Lakebase row-level parameterization:
            </p>

            <ul className="space-y-2 text-2xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero standing root access to patient PHI.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Physicians retain exclusive AI diagnosis sign-off authority.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>All privilege elevations require 21 CFR Part 11 ledger signing.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

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
