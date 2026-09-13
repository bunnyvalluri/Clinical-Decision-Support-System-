"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const METRICS = [
  { label: "Workers Active", value: "2 (solo pool)" },
  { label: "Status", value: "HEALTHY" },
  { label: "Tasks Processed (24h)", value: "147" },
  { label: "Failed Tasks (24h)", value: "0" },
  { label: "Dead Letter Queue", value: "0 tasks" },
  { label: "Concurrency", value: "1 (solo on Windows)" },
  { label: "Broker", value: "Redis (Upstash)" },
  { label: "Result Backend", value: "Redis (Upstash)" },
];

export default function AdminCeleryPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Celery Workers</h1>
        <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" />HEALTHY
        </div>
      </div>
      <Card>
        <CardContent className="pt-5 space-y-3">
          {METRICS.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-semibold text-slate-800">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
