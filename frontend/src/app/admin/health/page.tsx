"use client";

import { Monitor, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Status = "HEALTHY" | "DEGRADED" | "DOWN";
const SERVICES: { label: string; status: Status }[] = [
  { label: "Django API", status: "HEALTHY" },
  { label: "Neon PostgreSQL", status: "HEALTHY" },
  { label: "Upstash Redis", status: "HEALTHY" },
  { label: "Celery Workers", status: "HEALTHY" },
  { label: "WebSockets", status: "HEALTHY" },
  { label: "ML Service", status: "HEALTHY" },
  { label: "AI Service", status: "HEALTHY" },
  { label: "Next.js Frontend", status: "HEALTHY" },
];

const S = { HEALTHY: { Icon: CheckCircle2, c: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", d: "bg-emerald-500" }, DEGRADED: { Icon: AlertTriangle, c: "text-amber-600", bg: "bg-amber-50 border-amber-200", d: "bg-amber-500" }, DOWN: { Icon: XCircle, c: "text-rose-600", bg: "bg-rose-50 border-rose-200", d: "bg-rose-500" } };

export default function AdminHealthPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />All systems operational
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICES.map(({ label, status }) => {
          const { Icon, c, bg, d } = S[status];
          return (
            <Card key={label} className={`border ${bg}`}>
              <CardContent className="py-5 flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${d}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{label}</p>
                  <p className={`text-xs ${c} font-medium`}>{status}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
