"use client";

import * as React from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileBarChart,
  FileClock,
  FileText,
  Filter,
  HeartPulse,
  Plus,
  Search,
  Shield,
  Stethoscope,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsivePageContainer, ResponsiveToolbar } from "@/components/responsive";

interface ClinicalReport {
  id: string;
  title: string;
  type: "PATIENT_SUMMARY" | "RISK_COHORT" | "AUDIT_LOG" | "OUTCOME_TREND" | "GUIDELINES";
  generatedAt: string;
  periodCovered: string;
  patientCount?: number;
  status: "SIGNED" | "PENDING_SIGN" | "DRAFT";
  author: string;
  fileSize: string;
}

const DEMO_REPORTS: ClinicalReport[] = [
  {
    id: "rpt-001",
    title: "ICU High-Risk Patient Cohort Summary — September 2026",
    type: "RISK_COHORT",
    generatedAt: "2026-09-14T08:00:00Z",
    periodCovered: "Sep 1–14, 2026",
    patientCount: 12,
    status: "SIGNED",
    author: "Dr. Vadla Abhinay, MD",
    fileSize: "1.4 MB",
  },
  {
    id: "rpt-002",
    title: "Physician HITL Review Audit Log — Q3 2026",
    type: "AUDIT_LOG",
    generatedAt: "2026-09-13T18:00:00Z",
    periodCovered: "Jul 1 – Sep 13, 2026",
    status: "SIGNED",
    author: "System-Generated",
    fileSize: "820 KB",
  },
  {
    id: "rpt-003",
    title: "Arthur Pendleton — Complete Clinical Summary",
    type: "PATIENT_SUMMARY",
    generatedAt: "2026-09-14T07:30:00Z",
    periodCovered: "Admission Sep 14, 2026",
    patientCount: 1,
    status: "PENDING_SIGN",
    author: "Dr. Vadla Abhinay, MD",
    fileSize: "560 KB",
  },
  {
    id: "rpt-004",
    title: "30-Day Cardiovascular Outcome Trend Analysis",
    type: "OUTCOME_TREND",
    generatedAt: "2026-09-10T12:00:00Z",
    periodCovered: "Aug 10 – Sep 10, 2026",
    patientCount: 28,
    status: "SIGNED",
    author: "Dr. Vadla Abhinay, MD",
    fileSize: "2.1 MB",
  },
  {
    id: "rpt-005",
    title: "AHA/ACC Guideline Compliance Audit — Cardiology Unit",
    type: "GUIDELINES",
    generatedAt: "2026-09-08T09:00:00Z",
    periodCovered: "Sep 1–8, 2026",
    status: "DRAFT",
    author: "Draft — Not Finalized",
    fileSize: "340 KB",
  },
];

const TYPE_CONFIG = {
  PATIENT_SUMMARY: { icon: Stethoscope, label: "Patient Summary", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  RISK_COHORT: { icon: AlertCircle, label: "Risk Cohort", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  AUDIT_LOG: { icon: Shield, label: "Audit Log", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  OUTCOME_TREND: { icon: TrendingUp, label: "Outcome Trend", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  GUIDELINES: { icon: CheckCircle2, label: "Guidelines", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

const STATUS_CONFIG = {
  SIGNED: { label: "Signed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PENDING_SIGN: { label: "Pending Signature", className: "bg-amber-100 text-amber-800 border-amber-200" },
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function DoctorReportsPage() {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");

  const filtered = DEMO_REPORTS.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.author.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const stats = {
    total: DEMO_REPORTS.length,
    signed: DEMO_REPORTS.filter((r) => r.status === "SIGNED").length,
    pending: DEMO_REPORTS.filter((r) => r.status === "PENDING_SIGN").length,
  };

  return (
    <ResponsivePageContainer
      title="Clinical Reports"
      subtitle="Signed clinical summaries, audit logs, and outcome analyses"
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Generate Report
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Reports", value: stats.total, icon: FileText, bg: "bg-white border-slate-200", text: "text-slate-700", iconBg: "bg-slate-100 text-slate-600" },
          { label: "Signed", value: stats.signed, icon: CheckCircle2, bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", iconBg: "bg-emerald-100 text-emerald-600" },
          { label: "Pending Signature", value: stats.pending, icon: FileClock, bg: "bg-amber-50 border-amber-200", text: "text-amber-700", iconBg: "bg-amber-100 text-amber-600" },
        ].map(({ label, value, icon: Icon, bg, text, iconBg }) => (
          <div key={label} className={`border rounded-xl p-4 flex items-center gap-3 shadow-2xs ${bg}`}>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className="h-4.5 w-4.5" style={{ height: "18px", width: "18px" }} />
            </div>
            <div>
              <p className={`text-xl font-bold ${text}`}>{value}</p>
              <p className="text-[11px] text-slate-500 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <ResponsiveToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search reports by title or author…"
        filters={
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: "All Types", value: "ALL" },
              { label: "Patient Summary", value: "PATIENT_SUMMARY" },
              { label: "Risk Cohort", value: "RISK_COHORT" },
              { label: "Audit Log", value: "AUDIT_LOG" },
              { label: "Outcome Trend", value: "OUTCOME_TREND" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  typeFilter === opt.value
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Report cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No reports found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter</p>
            {(search || typeFilter !== "ALL") && (
              <button
                onClick={() => { setSearch(""); setTypeFilter("ALL"); }}
                className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mx-auto"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((report) => {
            const type = TYPE_CONFIG[report.type];
            const status = STATUS_CONFIG[report.status];
            const TypeIcon = type.icon;
            return (
              <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm hover:border-slate-300 transition-all flex items-start gap-4">
                {/* Type icon */}
                <div className={`h-10 w-10 rounded-xl ${type.bg} border ${type.border} flex items-center justify-center shrink-0`}>
                  <TypeIcon className={`h-5 w-5 ${type.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm leading-snug">{report.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${type.bg} ${type.text} ${type.border}`}>
                          {type.label}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                        {report.patientCount && (
                          <span className="text-[10px] text-slate-400">{report.patientCount} patient{report.patientCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {report.status === "PENDING_SIGN" && (
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                          Sign Now
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 gap-1">
                        <Download className="h-3 w-3" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(report.generatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>·</span>
                    <span>Period: {report.periodCovered}</span>
                    <span>·</span>
                    <span>{report.author}</span>
                    <span>·</span>
                    <span>{report.fileSize}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compliance footer */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
        <Shield className="h-3.5 w-3.5 text-emerald-500" />
        <span>All signed reports are archived per HIPAA § 164.312 and 21 CFR Part 11 electronic signature requirements.</span>
      </div>
    </ResponsivePageContainer>
  );
}

