"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  HeartPulse,
  Plus,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { ResponsivePageContainer, ResponsiveToolbar } from "@/components/responsive";

const RISK_CONFIG = {
  HIGH: {
    label: "High Risk",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    bar: "bg-rose-500",
    statBg: "bg-rose-50 border-rose-200",
    statText: "text-rose-700",
  },
  MEDIUM: {
    label: "Moderate Risk",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    bar: "bg-amber-500",
    statBg: "bg-amber-50 border-amber-200",
    statText: "text-amber-700",
  },
  LOW: {
    label: "Low Risk",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bar: "bg-emerald-500",
    statBg: "bg-emerald-50 border-emerald-200",
    statText: "text-emerald-700",
  },
  CRITICAL: {
    label: "Critical",
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    dot: "bg-red-600",
    badge: "bg-red-600 text-white border-transparent",
    bar: "bg-red-600",
    statBg: "bg-red-50 border-red-200",
    statText: "text-red-700",
  },
};

export default function DoctorPredictionsPage() {
  const { predictions } = useClinicalStore();
  const [search, setSearch] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState("ALL");

  const filtered = predictions.filter((p) => {
    const matchSearch =
      p.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      p.patient_mrn.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "ALL" || p.risk_level === riskFilter;
    return matchSearch && matchRisk;
  });

  const counts = {
    CRITICAL: predictions.filter((p) => p.risk_level === "CRITICAL").length,
    HIGH: predictions.filter((p) => p.risk_level === "HIGH").length,
    MEDIUM: predictions.filter((p) => p.risk_level === "MEDIUM").length,
    LOW: predictions.filter((p) => p.risk_level === "LOW").length,
  };

  const avgRisk =
    predictions.length > 0
      ? ((predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length) * 100).toFixed(1)
      : "0.0";

  return (
    <ResponsivePageContainer
      title="AI Risk Predictions"
      subtitle={`${predictions.length} active predictions — physician review required before clinical action`}
      actions={
        <Link href="/doctor/predictions/new">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs font-semibold">
            <Plus className="h-3.5 w-3.5" />
            New Assessment
          </Button>
        </Link>
      }
    >
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "HIGH", count: counts.HIGH, label: "High Risk" },
          { key: "MEDIUM", count: counts.MEDIUM, label: "Moderate Risk" },
          { key: "LOW", count: counts.LOW, label: "Low Risk" },
        ].map(({ key, count, label }) => {
          const cfg = RISK_CONFIG[key as keyof typeof RISK_CONFIG];
          return (
            <button
              key={key}
              onClick={() => setRiskFilter(riskFilter === key ? "ALL" : key)}
              className={`text-left rounded-xl border p-4 transition-all ${cfg.statBg} ${
                riskFilter === key ? `ring-2 ring-offset-1 ring-${key === "HIGH" ? "rose" : key === "MEDIUM" ? "amber" : "emerald"}-400` : "hover:shadow-sm"
              }`}
            >
              <p className={`text-2xl font-bold ${cfg.statText}`}>{count}</p>
              <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
            </button>
          );
        })}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-2xl font-bold text-blue-700">{avgRisk}%</p>
          <p className="text-xs font-medium text-slate-600 mt-0.5">Avg Risk Score</p>
        </div>
      </div>

      {/* Filters */}
      <ResponsiveToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by patient name or MRN…"
        filters={
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: "All", value: "ALL" },
              { label: "High Risk", value: "HIGH" },
              { label: "Moderate", value: "MEDIUM" },
              { label: "Low Risk", value: "LOW" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRiskFilter(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  riskFilter === opt.value
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

      {/* Prediction list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
            <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No predictions match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or risk filter</p>
            {(search || riskFilter !== "ALL") && (
              <button
                onClick={() => { setSearch(""); setRiskFilter("ALL"); }}
                className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mx-auto"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((pred) => {
            const risk = RISK_CONFIG[pred.risk_level as keyof typeof RISK_CONFIG] || RISK_CONFIG.LOW;
            const pct = (pred.probability * 100).toFixed(1);
            return (
              <Link key={pred.id} href={`/doctor/predictions/${pred.id}`} className="block">
                <div className={`bg-white border ${risk.border} rounded-xl p-4 hover:shadow-sm transition-all flex items-center gap-4 group active:scale-[0.995]`}>
                  {/* Risk icon */}
                  <div className={`h-10 w-10 rounded-xl ${risk.bg} border ${risk.border} flex items-center justify-center shrink-0`}>
                    <HeartPulse className={`h-5 w-5 ${risk.text}`} />
                  </div>

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{pred.patient_name}</p>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 font-mono">MRN {pred.patient_mrn}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500">
                        Score: <strong className="text-slate-800">{pct}%</strong>
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400 font-mono">{pred.model_version}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">
                        {new Date(pred.created_at || pred.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {/* Mini probability bar */}
                    <div className="mt-2 h-1.5 w-full max-w-[200px] rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${risk.bar} transition-all`}
                        style={{ width: `${Math.min(100, pred.probability * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Badge + arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${risk.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                      {risk.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
          <span>Showing {filtered.length} of {predictions.length} total predictions</span>
          <span className="flex items-center gap-1">
            <Brain className="h-3.5 w-3.5 text-purple-400" />
            Predictions require physician review before clinical action
          </span>
        </div>
      )}
    </ResponsivePageContainer>
  );
}
