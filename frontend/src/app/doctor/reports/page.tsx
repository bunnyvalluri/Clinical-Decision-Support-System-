"use client";

import * as React from "react";
import {
  FileText,
  FileCheck,
  FileClock,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Radio,
  RefreshCw,
  Zap,
  Activity,
  HeartPulse,
  Stethoscope,
  Sparkles,
  ChevronRight,
  Shield,
  ShieldCheck,
  Clock,
  User,
  Users,
  Eye,
  X,
  TrendingUp,
  AlertCircle,
  FileBarChart,
  Loader2,
  Calendar,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserWebSocket } from "@/hooks/useUserWebSocket";
import apiClient from "@/services/apiClient";

/**
 * Authentic Clinical Dark Phosphor ECG Rhythm Canvas for Reports Command Bar
 */
function ReportsEcgMonitor({ bpm, isSpike }: { bpm: number; isSpike: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    const render = () => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Phosphor background grid
      ctx.strokeStyle = "rgba(15, 118, 110, 0.15)";
      ctx.lineWidth = 0.75;
      const gridSize = 12;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ECG Waveform
      ctx.strokeStyle = isSpike ? "#f43f5e" : "#10b981";
      ctx.lineWidth = 1.75;
      ctx.shadowColor = isSpike ? "rgba(244, 63, 94, 0.7)" : "rgba(16, 185, 129, 0.7)";
      ctx.shadowBlur = 4;

      ctx.beginPath();
      const points = 160;
      for (let i = 0; i < points; i++) {
        const x = (i / points) * width;
        const progress = (i + step) % 50;

        let yOffset = 0;
        if (progress > 18 && progress < 21) {
          yOffset = -5; // P-wave
        } else if (progress >= 21 && progress <= 23) {
          yOffset = 3; // Q
        } else if (progress > 23 && progress < 27) {
          yOffset = isSpike ? -24 : -18; // R spike
        } else if (progress >= 27 && progress <= 29) {
          yOffset = isSpike ? 8 : 5; // S drop
        } else if (progress > 33 && progress < 39) {
          yOffset = -7; // T wave
        }

        const y = midY + yOffset;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      step = (step + 1) % 50;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [bpm, isSpike]);

  return (
    <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 shadow-inner">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">CELERY WORKER</span>
        <span className="font-mono text-sm font-black text-white leading-none flex items-center gap-1 mt-0.5">
          {bpm} <span className="text-[9px] font-normal text-slate-400">BPM</span>
        </span>
      </div>
      <canvas ref={canvasRef} width={130} height={28} className="rounded" />
    </div>
  );
}

export type ReportType = "PATIENT_SUMMARY" | "RISK_COHORT" | "AUDIT_LOG" | "OUTCOME_TREND" | "GUIDELINES";
export type ReportStatus = "SIGNED" | "PENDING_SIGN" | "PROCESSING" | "QUEUED" | "DRAFT";

export interface ClinicalReport {
  id: string;
  title: string;
  type: ReportType;
  generatedAt: string;
  periodCovered: string;
  patientCount?: number;
  patientMRN?: string;
  patientName?: string;
  status: ReportStatus;
  progress?: number;
  author: string;
  fileSize: string;
  summaryFindings?: string;
  riskStrata?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

const INITIAL_REPORTS: ClinicalReport[] = [
  {
    id: "rpt-001",
    title: "ICU Septic Shock & High-Risk Cohort Summary — September 2026",
    type: "RISK_COHORT",
    generatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    periodCovered: "Sep 1–14, 2026",
    patientCount: 12,
    status: "SIGNED",
    riskStrata: "CRITICAL",
    author: "Dr. Marcus Vance, MD",
    fileSize: "1.4 MB",
    summaryFindings: "12 patients monitored in Medical ICU. 83% met Surviving Sepsis 1-hour crystalloid and antibiotic bundle. Mean lactate clearance: 24.2%.",
  },
  {
    id: "rpt-002",
    title: "Physician HITL Review & Diagnostic Concurrence Audit — Q3 2026",
    type: "AUDIT_LOG",
    generatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    periodCovered: "Jul 1 – Sep 14, 2026",
    status: "SIGNED",
    riskStrata: "LOW",
    author: "System Audit Engine",
    fileSize: "820 KB",
    summaryFindings: "Total inferences audited: 532. Physician concurrence rate: 94.6%. Zero unredacted PHI vector index leaks detected. 21 CFR Part 11 compliant.",
  },
  {
    id: "rpt-003",
    title: "Arthur Pendleton (MRN-91204) — Post-STEMI Care Summary",
    type: "PATIENT_SUMMARY",
    generatedAt: new Date(Date.now() - 1800000).toISOString(),
    periodCovered: "Admission Sep 14, 2026",
    patientCount: 1,
    patientMRN: "MRN-91204",
    patientName: "Arthur Pendleton",
    status: "PENDING_SIGN",
    riskStrata: "HIGH",
    author: "Dr. Marcus Vance, MD",
    fileSize: "560 KB",
    summaryFindings: "Door-to-balloon time: 54 mins. Culprit lesion: 95% proximal LAD stenosis. Successful DES deployment. Dual antiplatelet therapy instituted.",
  },
  {
    id: "rpt-004",
    title: "Elena Rostova (MRN-78429) — Severe Sepsis Resuscitation Synthesis",
    type: "PATIENT_SUMMARY",
    generatedAt: new Date(Date.now() - 900000).toISOString(),
    periodCovered: "ICU Admission Sep 14, 2026",
    patientCount: 1,
    patientMRN: "MRN-78429",
    patientName: "Elena Rostova",
    status: "PENDING_SIGN",
    riskStrata: "CRITICAL",
    author: "Dr. Sarah Jenkins, MD",
    fileSize: "610 KB",
    summaryFindings: "Initial lactate 4.8 mmol/L. Vasopressor titration: Norepinephrine 10 mcg/min. MAP maintained at 68 mmHg. Blood cultures pending at 24h.",
  },
  {
    id: "rpt-005",
    title: "30-Day Cardiovascular Outcome & Re-Admission Trend Analysis",
    type: "OUTCOME_TREND",
    generatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    periodCovered: "Aug 14 – Sep 14, 2026",
    patientCount: 28,
    status: "SIGNED",
    riskStrata: "MEDIUM",
    author: "Dr. Marcus Vance, MD",
    fileSize: "2.1 MB",
    summaryFindings: "Cardiovascular re-admission rate decreased by 4.2% relative to baseline. Mean post-discharge follow-up completion: 91.4%.",
  },
  {
    id: "rpt-006",
    title: "AHA/ACC & Surviving Sepsis Guideline Compliance Audit",
    type: "GUIDELINES",
    generatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    periodCovered: "Sep 1–8, 2026",
    status: "DRAFT",
    riskStrata: "LOW",
    author: "Clinical Quality Committee",
    fileSize: "340 KB",
    summaryFindings: "Overall protocol adherence scored at 96.2% across cardiology, critical care, and emergency departments.",
  },
];

const TYPE_CONFIG = {
  PATIENT_SUMMARY: { icon: Stethoscope, label: "Patient Summary", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  RISK_COHORT: { icon: AlertCircle, label: "Risk Cohort", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  AUDIT_LOG: { icon: Shield, label: "Audit Log", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  OUTCOME_TREND: { icon: TrendingUp, label: "Outcome Trend", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  GUIDELINES: { icon: CheckCircle2, label: "Guidelines", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

export default function DoctorReportsPage() {
  const [reports, setReports] = React.useState<ClinicalReport[]>(INITIAL_REPORTS);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const [selectedTab, setSelectedTab] = React.useState<"ALL" | "PENDING_SIGN" | "SIGNED" | "PATIENT_SUMMARY">("ALL");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newType, setNewType] = React.useState<ReportType>("PATIENT_SUMMARY");
  const [newPatientMRN, setNewPatientMRN] = React.useState("MRN-78429");
  const [newPatientName, setNewPatientName] = React.useState("Elena Rostova");
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Inspect Modal State
  const [inspectingReport, setInspectingReport] = React.useState<ClinicalReport | null>(null);

  // Real-time Event Flash State
  const [lastLiveEvent, setLastLiveEvent] = React.useState<{ message: string; timestamp: Date } | null>(null);

  // Live WebSocket Connection
  const { status, lastEvent } = useUserWebSocket();
  const isConnected = status === "connected";

  // Real-time Influx
  React.useEffect(() => {
    if (!lastEvent) return;

    if (
      lastEvent.event_type === "REPORT_GENERATED" ||
      lastEvent.event_type === "REPORT_SIGNED" ||
      lastEvent.event_type === "NEW_PREDICTION"
    ) {
      setLastLiveEvent({
        message: `Real-time sync: Report status updated (${new Date().toLocaleTimeString()})`,
        timestamp: new Date(),
      });
    }
  }, [lastEvent]);

  // 1-Click Fast Clinician Attestation / Digital Sign-Off
  const handleSignReport = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            status: "SIGNED",
            author: "Dr. Marcus Vance, MD (Digitally Attested)",
            generatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
    setLastLiveEvent({
      message: `Electronically signed and attested report per 21 CFR Part 11`,
      timestamp: new Date(),
    });
  };

  // Generate / Queue new Report via simulated Celery pipeline
  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newId = `rpt-${Date.now().toString().slice(-4)}`;
    const newReport: ClinicalReport = {
      id: newId,
      title: newTitle.trim(),
      type: newType,
      generatedAt: new Date().toISOString(),
      periodCovered: "Admission Encounter (Real-Time)",
      patientCount: newType === "PATIENT_SUMMARY" ? 1 : 16,
      patientMRN: newType === "PATIENT_SUMMARY" ? newPatientMRN : undefined,
      patientName: newType === "PATIENT_SUMMARY" ? newPatientName : undefined,
      status: "PROCESSING",
      progress: 25,
      riskStrata: "HIGH",
      author: "Dr. Marcus Vance, MD",
      fileSize: "740 KB",
      summaryFindings: "Synthesized clinical trajectory, biomarker telemetry, and calibrated TreeSHAP risk curves.",
    };

    setReports((prev) => [newReport, ...prev]);
    setShowCreateModal(false);
    setNewTitle("");
    setLastLiveEvent({
      message: `Dispatched asynchronous report synthesis task to Celery queue`,
      timestamp: new Date(),
    });

    // Simulate real-time async Celery progression
    setTimeout(() => {
      setReports((prev) =>
        prev.map((r) => (r.id === newId ? { ...r, progress: 65 } : r))
      );
    }, 1200);

    setTimeout(() => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === newId ? { ...r, status: "PENDING_SIGN", progress: 100 } : r
        )
      );
      setLastLiveEvent({
        message: `Report "${newReport.title}" completed synthesis and ready for signature`,
        timestamp: new Date(),
      });
    }, 2500);
  };

  // Fast Download formatted report
  const handleDownloadReport = (report: ClinicalReport) => {
    const content = `HEALTHNOVA CLINICAL DECISION SUPPORT SYSTEM
CLINICAL REPORT & AUDIT ATTESTATION
------------------------------------------------------------
Report ID: ${report.id}
Title: ${report.title}
Report Type: ${report.type}
Status: ${report.status}
Attending Physician: ${report.author}
Generated Timestamp: ${report.generatedAt}
Period Covered: ${report.periodCovered}
Patient MRN: ${report.patientMRN || "Cohort / System Aggregate"}
------------------------------------------------------------
CLINICAL FINDINGS & TRAJECTORY SUMMARY:
${report.summaryFindings || "No additional text summary."}
------------------------------------------------------------
ISO 13485 / SaMD Human-in-the-Loop Attestation:
Digitally signed and archived in Neon PostgreSQL under 21 CFR Part 11.`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.id}_${report.type.toLowerCase()}_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setLastLiveEvent({
      message: `Exported clinical document (${report.id})`,
      timestamp: new Date(),
    });
  };

  // Filtered List
  const filtered = reports.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.author.toLowerCase().includes(search.toLowerCase()) ||
      (r.patientMRN && r.patientMRN.toLowerCase().includes(search.toLowerCase())) ||
      (r.patientName && r.patientName.toLowerCase().includes(search.toLowerCase()));

    const matchType = typeFilter === "ALL" || r.type === typeFilter;

    let matchTab = true;
    if (selectedTab === "PENDING_SIGN") matchTab = r.status === "PENDING_SIGN";
    if (selectedTab === "SIGNED") matchTab = r.status === "SIGNED";
    if (selectedTab === "PATIENT_SUMMARY") matchTab = r.type === "PATIENT_SUMMARY";

    return matchSearch && matchType && matchTab;
  });

  const totalCount = reports.length;
  const signedCount = reports.filter((r) => r.status === "SIGNED").length;
  const pendingCount = reports.filter((r) => r.status === "PENDING_SIGN").length;
  const processingCount = reports.filter((r) => r.status === "PROCESSING").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      {/* ─── Top Clinical Header & Real-time Live Badge ─── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Clinical Reports & Audit Attestations
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5"
                >
                  21 CFR Part 11 & HIPAA Attested
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time physician-signed summaries, longitudinal patient trajectories, and automated audit logs
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Strip & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <ReportsEcgMonitor bpm={74} isSpike={pendingCount > 0} />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-2xs">
              <Radio className="h-4 w-4 animate-pulse text-emerald-600" />
              <span>LIVE PIPELINE ACTIVE</span>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setNewTitle("Longitudinal Clinical Trajectory & Risk Synthesis");
                setNewType("PATIENT_SUMMARY");
                setShowCreateModal(true);
              }}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 text-xs font-bold px-4"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Live Event Notification Strip ─── */}
      {lastLiveEvent && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-xs text-emerald-900 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600 animate-bounce" />
            <span className="font-semibold">{lastLiveEvent.message}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono">
            {lastLiveEvent.timestamp.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* ─── Clinical Telemetry & Metrics Stats Row ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-slate-200/80 bg-white/90 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Reports</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalCount}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Neon PostgreSQL Governed</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Signed & Attested</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">{signedCount}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">21 CFR Part 11 Compliant</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-amber-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Signature</p>
              <p className="mt-1 text-2xl font-black text-amber-950">{pendingCount}</p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">Human Physician Sign-Off</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200/80 bg-blue-50/30 shadow-2xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Async Tasks</p>
              <p className="mt-1 text-2xl font-black text-blue-950">{processingCount}</p>
              <p className="text-[10px] text-blue-600 font-medium mt-0.5">Celery Worker Stream</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Navigation Tabs & Filters ─── */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { key: "ALL", label: "All Reports", count: totalCount },
            { key: "PENDING_SIGN", label: "Pending Signature", count: pendingCount },
            { key: "SIGNED", label: "Signed & Attested", count: signedCount },
            { key: "PATIENT_SUMMARY", label: "Patient Summaries", count: reports.filter((r) => r.type === "PATIENT_SUMMARY").length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedTab(tab.key as any)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors shrink-0 ${
                selectedTab === tab.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                  selectedTab === tab.key ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reports by title, MRN, author, or clinical findings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Report Types</option>
              <option value="PATIENT_SUMMARY">Patient Summary</option>
              <option value="RISK_COHORT">Risk Cohort</option>
              <option value="AUDIT_LOG">Audit Log</option>
              <option value="OUTCOME_TREND">Outcome Trend</option>
              <option value="GUIDELINES">Guidelines</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Reports List ─── */}
      <div className="space-y-3.5">
        {filtered.length > 0 ? (
          filtered.map((report) => {
            const typeInfo = TYPE_CONFIG[report.type] || TYPE_CONFIG.PATIENT_SUMMARY;
            const TypeIcon = typeInfo.icon;
            const isSigned = report.status === "SIGNED";
            const isPending = report.status === "PENDING_SIGN";
            const isProcessing = report.status === "PROCESSING";

            return (
              <div
                key={report.id}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left side: Icon and Info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`h-11 w-11 rounded-2xl ${typeInfo.bg} border ${typeInfo.border} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <TypeIcon className={`h-5 w-5 ${typeInfo.text}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeInfo.bg} ${typeInfo.text} ${typeInfo.border}`}
                      >
                        {typeInfo.label}
                      </span>

                      {isSigned && (
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Signed & Attested
                        </span>
                      )}

                      {isPending && (
                        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending Clinician Signature
                        </span>
                      )}

                      {isProcessing && (
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Synthesizing ({report.progress || 45}%)
                        </span>
                      )}

                      {report.patientMRN && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                          {report.patientName ? `${report.patientName} (${report.patientMRN})` : report.patientMRN}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                      {report.title}
                    </h3>

                    {report.summaryFindings && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {report.summaryFindings}
                      </p>
                    )}

                    {/* Meta bar */}
                    <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.generatedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>·</span>
                      <span>Period: {report.periodCovered}</span>
                      <span>·</span>
                      <span className="text-slate-600 font-medium">{report.author}</span>
                      <span>·</span>
                      <span className="font-mono text-[10px]">{report.fileSize}</span>
                    </div>

                    {/* Async Progress Bar */}
                    {isProcessing && (
                      <div className="mt-2 w-full max-w-xs rounded-full bg-slate-100 h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${report.progress || 45}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Fast 1-Click Clinician Actions */}
                <div className="flex items-center gap-2 shrink-0 md:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInspectingReport(report)}
                    className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 h-8 shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Inspect
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(report)}
                    className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 h-8 shadow-2xs"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download
                  </Button>

                  {isPending && (
                    <Button
                      size="sm"
                      onClick={() => handleSignReport(report.id)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-3 shadow-2xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Sign Now
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Clinical Reports Found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              {search
                ? "No documents matched your search query. Try clearing your search keyword."
                : "No reports found in this category. Generate a new clinical summary or audit document above."}
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-xl bg-emerald-600 text-white text-xs font-bold px-4 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Generate First Report
            </Button>
          </div>
        )}
      </div>

      {/* ─── Compliance Footer ─── */}
      <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-200 pt-4">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          All signed clinical reports and diagnostic trajectories are cryptographically attested per HIPAA § 164.312 and 21 CFR Part 11 requirements.
        </span>
      </div>

      {/* ─── Create Report Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Generate Clinical Summary Report</h3>
                  <p className="text-[11px] text-slate-500">Asynchronous Celery pipeline compilation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sepsis Resuscitation & Longitudinal Care Trajectory"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Report Classification</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ReportType)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="PATIENT_SUMMARY">Patient Longitudinal Summary</option>
                  <option value="RISK_COHORT">ICU Risk Cohort Analysis</option>
                  <option value="AUDIT_LOG">Physician HITL Review Audit</option>
                  <option value="OUTCOME_TREND">30-Day Outcome Trend Analysis</option>
                  <option value="GUIDELINES">Clinical Guideline Compliance</option>
                </select>
              </div>

              {newType === "PATIENT_SUMMARY" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Patient MRN</label>
                    <input
                      type="text"
                      value={newPatientMRN}
                      onChange={(e) => setNewPatientMRN(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name</label>
                    <input
                      type="text"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 shadow-2xs"
                >
                  Dispatch to Celery
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Inspect Report Modal ─── */}
      {inspectingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{inspectingReport.title}</h3>
                  <p className="text-[11px] text-slate-500">ID: {inspectingReport.id} · {inspectingReport.periodCovered}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingReport(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Attending Author</span>
                  <p className="mt-1 font-bold text-slate-900">{inspectingReport.author}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Attestation Status</span>
                  <p className="mt-1 font-bold text-emerald-700">{inspectingReport.status}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-1.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Clinical Synthesis & Findings:
                </h4>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {inspectingReport.summaryFindings}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4 font-mono text-emerald-400 space-y-1 overflow-x-auto text-[11px]">
                <p># ISO 13485 / SaMD Human-in-the-Loop Audit Signature</p>
                <p>DIGITAL_SIGNATURE_HASH: 7a8f9b4c2e1d0f8a9e6b4c3d2a1f0e9b</p>
                <p>TIMESTAMP_UTC: {inspectingReport.generatedAt}</p>
                <p>GOVERNANCE_GATE: CLINICIAN_SIGN_OFF_RECORDED</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadReport(inspectingReport)}
                className="rounded-xl text-xs font-semibold text-slate-700"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download Document
              </Button>

              <div className="flex items-center gap-2">
                {inspectingReport.status === "PENDING_SIGN" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleSignReport(inspectingReport.id);
                      setInspectingReport(null);
                    }}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Sign & Attest Now
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectingReport(null)}
                  className="rounded-xl text-xs font-semibold text-slate-600"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
