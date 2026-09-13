"use client";

import { Bell, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const DEMO_NOTIFICATIONS = [
  { id: 1, type: "alert", title: "High-risk patient detected", body: "Patient MRN-3847 scored 0.91 probability. Immediate review recommended.", time: "2 min ago" },
  { id: 2, type: "info", title: "Prediction approved by review", body: "Your review of Patient MRN-2291 prediction was countersigned.", time: "18 min ago" },
  { id: 3, type: "success", title: "Clinical record updated", body: "Patient John Carter's record was updated with new vitals.", time: "1 hr ago" },
  { id: 4, type: "alert", title: "Drift alert from Informatics", body: "Model cardiac_risk_v2 shows input drift on ejection_fraction feature.", time: "3 hrs ago" },
  { id: 5, type: "info", title: "System maintenance scheduled", body: "Maintenance window: Sunday 02:00–04:00 UTC. Expect brief downtime.", time: "Yesterday" },
];

const TYPE_CONFIG = {
  alert: { icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  success: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
};

export default function DoctorNotificationsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <button className="text-xs text-emerald-600 hover:underline font-medium">Mark all read</button>
      </div>
      <div className="space-y-3">
        {DEMO_NOTIFICATIONS.map((n) => {
          const conf = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG];
          const Icon = conf.icon;
          return (
            <div key={n.id} className={`flex gap-4 p-4 rounded-xl border bg-white border-slate-200 hover:border-slate-300 transition-all`}>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${conf.bg}`}>
                <Icon className={`h-5 w-5 ${conf.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0 mt-0.5">{n.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
