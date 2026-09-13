"use client";

import { Zap, AlertTriangle } from "lucide-react";

const DEMO_ALERTS = [
  { id: 1, type: "CRITICAL", patient: "Robert Chen", message: "SpO₂ dropped to 89% — immediate assessment required", time: "09:31" },
  { id: 2, type: "HIGH", patient: "James Wilson", message: "Heart rate >120 bpm for 5 consecutive minutes", time: "09:28" },
  { id: 3, type: "MEDIUM", patient: "David Kim", message: "Blood pressure reading outside normal range", time: "09:15" },
  { id: 4, type: "INFO", patient: "Priya Patel", message: "Vitals updated by nursing staff", time: "09:12" },
];

export default function NurseAlertsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
        <span className="h-6 min-w-6 px-2 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
          {DEMO_ALERTS.filter(a => a.type !== "INFO").length}
        </span>
      </div>
      <div className="space-y-2">
        {DEMO_ALERTS.map((a) => (
          <div key={a.id} className={`flex gap-4 p-4 rounded-xl border ${
            a.type === "CRITICAL" ? "bg-rose-50 border-rose-200"
            : a.type === "HIGH" ? "bg-amber-50 border-amber-200"
            : "bg-white border-slate-200"}`}>
            <Zap className={`h-5 w-5 shrink-0 mt-0.5 ${
              a.type === "CRITICAL" ? "text-rose-600"
              : a.type === "HIGH" ? "text-amber-600"
              : "text-slate-400"}`} />
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">{a.patient}</p>
              <p className="text-sm text-slate-600 mt-0.5">{a.message}</p>
            </div>
            <span className="text-xs text-slate-400 shrink-0">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
