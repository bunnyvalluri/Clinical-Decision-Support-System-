"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

import { ResponsivePageContainer, ResponsiveTable, ResponsiveTableColumn } from "@/components/responsive";

export default function DoctorReviewsPage() {
  const { predictions } = useClinicalStore();
  const pending = predictions.filter((p) => !p.review_status || p.review_status === "PENDING_REVIEW");

  const columns: ResponsiveTableColumn<typeof pending[0]>[] = [
    {
      key: "patient",
      header: "Patient Case",
      priority: "high",
      sticky: true,
      render: (pred) => (
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${pred.risk_level === "HIGH" ? "bg-rose-50" : "bg-amber-50"}`}>
            <ClipboardList className={`h-5 w-5 ${pred.risk_level === "HIGH" ? "text-rose-600" : "text-amber-600"}`} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs sm:text-sm">{pred.patient_name}</p>
            <p className="text-[11px] text-slate-500 font-mono">
              MRN: {pred.patient_mrn}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "risk",
      header: "Risk Tier",
      priority: "high",
      render: (pred) => (
        <Badge className={`border text-xs ${pred.risk_level === "HIGH" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
          {pred.risk_level}
        </Badge>
      ),
    },
    {
      key: "probability",
      header: "Calculated Risk",
      priority: "medium",
      render: (pred) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          {(pred.probability * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      key: "date",
      header: "Timestamp",
      priority: "low",
      render: (pred) => (
        <span className="text-xs text-slate-500">
          {new Date(pred.created_at || pred.timestamp).toLocaleDateString()}
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
          <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 hover:border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1 touch-target">
            <span>Review</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <ResponsivePageContainer
      title="Clinical Reviews"
      subtitle="AI predictions requiring physician review and sign-off"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Pending Review", count: pending.length, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Clock },
          { label: "Approved", count: predictions.filter(p => p.review_status === "APPROVED").length, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
          { label: "High Priority", count: pending.filter(p => p.risk_level === "HIGH").length, color: "text-rose-600", bg: "bg-rose-50 border-rose-200", icon: AlertTriangle },
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <Card key={label} className={`border ${bg} shadow-2xs`}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-6 w-6 ${color} shrink-0`} />
              <div>
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className="text-xs text-slate-600 font-medium">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ResponsiveTable
        data={pending}
        columns={columns}
        keyExtractor={(pred) => pred.id}
        emptyState={
          <Card className="bg-white border-slate-200">
            <CardContent className="py-16 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">All predictions have been reviewed.</p>
              <p className="text-xs text-slate-400 mt-1">No pending physician sign-offs in queue.</p>
            </CardContent>
          </Card>
        }
        mobileCardRender={(pred) => (
          <Link key={pred.id} href={`/doctor/reviews/${pred.id}`} className="block">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-emerald-300 transition-all flex items-center justify-between gap-3 active:scale-[0.99]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${pred.risk_level === "HIGH" ? "bg-rose-50" : "bg-amber-50"}`}>
                  <ClipboardList className={`h-5 w-5 ${pred.risk_level === "HIGH" ? "text-rose-600" : "text-amber-600"}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{pred.patient_name}</p>
                  <p className="text-xs text-slate-500">
                    Risk: {(pred.probability * 100).toFixed(1)}% · {new Date(pred.created_at || pred.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge className={`border text-xs shrink-0 ${pred.risk_level === "HIGH" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {pred.risk_level}
              </Badge>
            </div>
          </Link>
        )}
      />
    </ResponsivePageContainer>
  );
}
