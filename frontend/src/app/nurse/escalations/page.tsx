"use client";

import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

const DEMO_ESCALATIONS = [
  { id: "esc-001", patient: "Robert Chen", reason: "Chest pain with elevated troponin", status: "PENDING", priority: "HIGH", time: "09:14" },
  { id: "esc-002", patient: "David Kim", reason: "Severe dyspnea with SpO₂ 88%", status: "ACKNOWLEDGED", priority: "HIGH", time: "09:22" },
  { id: "esc-003", patient: "Alice Thompson", reason: "Unresponsive to initial treatment", status: "RESOLVED", priority: "MEDIUM", time: "08:45" },
];

export default function NurseEscalationsPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Escalations</h1>
      <div className="space-y-2">
        {DEMO_ESCALATIONS.map((e) => (
          <Link key={e.id} href={`/nurse/escalations/${e.id}`} className="block">
            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-300 hover:shadow-sm transition-all flex items-center gap-4">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${e.status === "RESOLVED" ? "bg-emerald-50" : "bg-rose-50"}`}>
                {e.status === "RESOLVED"
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  : <AlertTriangle className="h-5 w-5 text-rose-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{e.patient}</p>
                <p className="text-xs text-slate-500 truncate">{e.reason}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">{e.time}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  e.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : e.status === "ACKNOWLEDGED" ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                  {e.status}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
