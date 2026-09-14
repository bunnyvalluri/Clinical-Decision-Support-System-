"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore } from "@/features/clinical/clinicalStore";
import { ResponsivePageContainer, ResponsiveTable, ResponsiveTableColumn } from "@/components/responsive";

const RISK_CONFIG = {
  HIGH: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500", badge: "bg-rose-100 text-rose-800 border-rose-200", icon: "text-rose-600 bg-rose-100" },
  MEDIUM: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-800 border-amber-200", icon: "text-amber-600 bg-amber-100" },
  LOW: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "text-emerald-600 bg-emerald-100" },
  CRITICAL: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", dot: "bg-red-600", badge: "bg-red-600 text-white border-transparent", icon: "text-red-600 bg-red-100" },
};

export default function DoctorReviewsPage() {
  const { predictions } = useClinicalStore();
  const pending = predictions.filter((p) => !p.review_status || p.review_status === "PENDING_REVIEW");
  const approved = predictions.filter((p) => p.review_status === "APPROVED");
  const highPriority = pending.filter((p) => p.risk_level === "HIGH" || p.risk_level === "CRITICAL");

  // Sort: HIGH/CRITICAL first
  const sortedPending = [...pending].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (order[a.risk_level as keyof typeof order] ?? 4) - (order[b.risk_level as keyof typeof order] ?? 4);
  });

  const columns: ResponsiveTableColumn<typeof pending[0]>[] = [
    {
      key: "patient",
      header: "Patient Case",
      priority: "high",
      sticky: true,
      render: (pred) => {
        const cfg = RISK_CONFIG[pred.risk_level as keyof typeof RISK_CONFIG] || RISK_CONFIG.LOW;
        return (
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.icon}`}>
              <ClipboardList className="h-4.5 w-4.5" style={{ height: "18px", width: "18px" }} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-xs sm:text-sm">{pred.patient_name}</p>
              <p className="text-[11px] text-slate-500 font-mono">MRN: {pred.patient_mrn}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "risk",
      header: "Risk Tier",
      priority: "high",
      render: (pred) => {
        const cfg = RISK_CONFIG[pred.risk_level as keyof typeof RISK_CONFIG] || RISK_CONFIG.LOW;
        return (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {pred.risk_level}
          </span>
        );
      },
    },
    {
      key: "probability",
      header: "Risk Score",
      priority: "medium",
      render: (pred) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs">{(pred.probability * 100).toFixed(1)}%</span>
          <div className="mt-1 h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                pred.risk_level === "HIGH" || pred.risk_level === "CRITICAL" ? "bg-rose-500" : pred.risk_level === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, pred.probability * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Generated",
      priority: "low",
      render: (pred) => (
        <span className="text-xs text-slate-500">
          {new Date(pred.created_at || pred.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      priority: "high",
      className: "text-right",
      render: (pred) => (
        <Link href={`/doctor/reviews/${pred.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-slate-200 hover:border-emerald-400 text-emerald-700 hover:bg-emerald-50 gap-1 font-semibold"
          >
            Review
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <ResponsivePageContainer
      title="Clinical Reviews"
      subtitle="AI risk predictions requiring physician sign-off and HITL validation"
    >
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Pending Review",
            count: pending.length,
            sub: "Awaiting physician sign-off",
            icon: Clock,
            bg: "bg-amber-50 border-amber-200",
            text: "text-amber-700",
            iconBg: "bg-amber-100 text-amber-600",
          },
          {
            label: "Approved",
            count: approved.length,
            sub: "Physician-validated predictions",
            icon: CheckCircle2,
            bg: "bg-emerald-50 border-emerald-200",
            text: "text-emerald-700",
            iconBg: "bg-emerald-100 text-emerald-600",
          },
          {
            label: "High Priority",
            count: highPriority.length,
            sub: "HIGH or CRITICAL risk pending",
            icon: AlertTriangle,
            bg: "bg-rose-50 border-rose-200",
            text: "text-rose-700",
            iconBg: "bg-rose-100 text-rose-600",
          },
        ].map(({ label, count, sub, icon: Icon, bg, text, iconBg }) => (
          <Card key={label} className={`border ${bg} shadow-2xs`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${text}`}>{count}</p>
                <p className="text-xs font-semibold text-slate-700">{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          <strong>HITL Compliance Requirement:</strong> Each AI prediction requires documented physician review before clinical action. Reviews are cryptographically signed and stored per 21 CFR Part 11 requirements.
        </p>
      </div>

      {/* Table */}
      <ResponsiveTable
        data={sortedPending}
        columns={columns}
        keyExtractor={(pred) => pred.id}
        emptyState={
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">All predictions reviewed!</p>
            <p className="text-xs text-slate-400 mt-1">No pending physician sign-offs in the queue.</p>
          </div>
        }
        mobileCardRender={(pred) => {
          const cfg = RISK_CONFIG[pred.risk_level as keyof typeof RISK_CONFIG] || RISK_CONFIG.LOW;
          return (
            <Link key={pred.id} href={`/doctor/reviews/${pred.id}`} className="block">
              <div className={`bg-white border ${cfg.border} rounded-xl p-4 hover:shadow-sm transition-all flex items-center justify-between gap-3 active:scale-[0.99]`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.icon}`}>
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{pred.patient_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Score: <strong>{(pred.probability * 100).toFixed(1)}%</strong> · {new Date(pred.created_at || pred.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                    {pred.risk_level}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </Link>
          );
        }}
      />
    </ResponsivePageContainer>
  );
}
