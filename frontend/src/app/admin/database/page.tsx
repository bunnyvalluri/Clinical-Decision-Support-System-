"use client";

import { Database, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const METRICS = [
  { label: "Provider", value: "Neon (Lakebase PostgreSQL)" },
  { label: "Status", value: "HEALTHY" },
  { label: "Connection Pool", value: "Pgbouncer — pooled mode" },
  { label: "Active Connections", value: "8 / 100" },
  { label: "Avg Query Latency", value: "12ms" },
  { label: "Storage Used", value: "~240 MB" },
  { label: "Branching", value: "main (production)" },
  { label: "Auto-scaling", value: "Enabled (0 → 4 vCPU)" },
];

export default function AdminDatabasePage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Database</h1>
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
