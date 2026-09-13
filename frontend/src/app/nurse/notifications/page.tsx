"use client";

import { Bell, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

const NOTES = [
  { id: 1, type: "alert", title: "Escalation acknowledged by Dr. Vance", body: "Patient Robert Chen escalation was picked up.", time: "5 min ago" },
  { id: 2, type: "info", title: "Shift handover reminder", body: "Document all patient updates before 14:00.", time: "30 min ago" },
  { id: 3, type: "success", title: "Vitals saved successfully", body: "Patient James Wilson vitals recorded at 09:05.", time: "1 hr ago" },
];

export default function NurseNotificationsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
      <div className="space-y-3">
        {NOTES.map((n) => {
          const Icon = n.type === "alert" ? AlertTriangle : n.type === "success" ? CheckCircle2 : Info;
          const color = n.type === "alert" ? "text-rose-600" : n.type === "success" ? "text-emerald-600" : "text-blue-600";
          const bg = n.type === "alert" ? "bg-rose-50 border-rose-200" : n.type === "success" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
          return (
            <div key={n.id} className={`flex gap-4 p-4 rounded-xl border ${bg}`}>
              <Icon className={`h-5 w-5 ${color} shrink-0 mt-0.5`} />
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
                <p className="text-sm text-slate-600 mt-0.5">{n.body}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{n.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
