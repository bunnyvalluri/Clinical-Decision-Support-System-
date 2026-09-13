"use client";

import { BarChart3, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinicalStore } from "@/features/clinical/clinicalStore";

export default function AnalyticsPage() {
  const { predictions } = useClinicalStore();
  const total = predictions.length;
  const high = predictions.filter(p => p.risk_level === "HIGH").length;
  const med = predictions.filter(p => p.risk_level === "MEDIUM").length;
  const low = predictions.filter(p => p.risk_level === "LOW").length;
  const avgProb = total > 0 ? predictions.reduce((s, p) => s + p.probability, 0) / total : 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Predictions", value: total, color: "text-purple-600" },
          { label: "High Risk", value: high, color: "text-rose-600" },
          { label: "Moderate Risk", value: med, color: "text-amber-600" },
          { label: "Avg. Risk Score", value: (avgProb * 100).toFixed(1) + "%", color: "text-purple-700" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-5">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm text-slate-600">Prediction Distribution</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "High Risk", count: high, total, color: "bg-rose-500" },
            { label: "Moderate Risk", count: med, total, color: "bg-amber-500" },
            { label: "Low Risk", count: low, total, color: "bg-emerald-500" },
          ].map(({ label, count, color }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>{label}</span>
                <span>{total > 0 ? ((count / total) * 100).toFixed(1) : 0}% ({count})</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${color}`} style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
