"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Filter,
  HeartPulse,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

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

  const riskColor = (risk: string) =>
    risk === "HIGH"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : risk === "MEDIUM"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const highCount = predictions.filter((p) => p.risk_level === "HIGH").length;
  const medCount = predictions.filter((p) => p.risk_level === "MEDIUM").length;
  const lowCount = predictions.filter((p) => p.risk_level === "LOW").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Predictions</h1>
        <p className="text-slate-500 text-sm mt-1">
          AI-generated risk assessments authorized for your review
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "High Risk", count: highCount, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
          { label: "Moderate Risk", count: medCount, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "Low Risk", count: lowCount, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
        ].map(({ label, count, color, bg }) => (
          <Card key={label} className={`border ${bg}`}>
            <CardContent className="pt-5 pb-5">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-sm text-slate-600 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or MRN…"
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                riskFilter === r
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
              }`}
            >
              {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Prediction list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No predictions match your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((pred) => (
            <Link
              key={pred.id}
              href={`/doctor/predictions/${pred.id}`}
              className="block"
            >
              <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition-all flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <HeartPulse className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {pred.patient_name}
                    </p>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">MRN {pred.patient_mrn}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-500">
                      Risk: <strong>{(pred.probability * 100).toFixed(1)}%</strong>
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{pred.model_version}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      {new Date(pred.created_at || pred.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge className={`border text-xs shrink-0 ${riskColor(pred.risk_level)}`}>
                  {pred.risk_level}
                </Badge>
                <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
