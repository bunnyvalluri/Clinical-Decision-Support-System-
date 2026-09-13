"use client";

import { TrendingDown, AlertTriangle, Activity, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function DriftMonitorPage() {
  const { driftMonitors } = useClinicalStore();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Drift Monitor</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Feature Drift", href: "/informaticist/drift/features", icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Prediction Drift", href: "/informaticist/drift/predictions", icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Performance Drift", href: "/informaticist/drift", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
        ].map(({ label, icon: Icon, color, bg }) => (
          <Card key={label} className="hover:border-purple-300 cursor-pointer transition-all">
            <CardContent className="py-8 text-center space-y-3">
              <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center mx-auto`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <p className="font-semibold text-slate-800">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {driftMonitors && driftMonitors.length > 0 ? (
        <div className="space-y-3">
          {driftMonitors.map((d: any, i: number) => (
            <Card key={d.id ?? i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{d.feature_name || d.drift_type || `Drift Monitor ${i + 1}`}</p>
                    <p className="text-xs text-slate-500">Score: {d.drift_score?.toFixed(4) ?? "—"} · {d.detection_method ?? "PSI"}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                    d.drift_detected ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {d.drift_detected ? "DRIFT DETECTED" : "STABLE"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <div className="flex items-center gap-2 justify-center">
              <Info className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-slate-500">No drift monitors have reported yet.</p>
            <p className="text-xs text-slate-400">Drift monitoring runs automatically with each new batch of predictions.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
