"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SERVICE_DETAIL: Record<string, { name: string; description: string; status: string; uptime: string; latency: string; lastCheck: string; notes: string }> = {
  api: { name: "Django API", description: "REST API with Django 5 + DRF", status: "HEALTHY", uptime: "99.98%", latency: "42ms", lastCheck: "30s ago", notes: "All endpoints responding normally." },
  database: { name: "Neon PostgreSQL", description: "Lakebase Postgres — Neon cloud", status: "HEALTHY", uptime: "99.99%", latency: "12ms", lastCheck: "30s ago", notes: "Connection pool healthy. Query performance nominal." },
  redis: { name: "Upstash Redis", description: "Cache & message broker", status: "HEALTHY", uptime: "99.95%", latency: "5ms", lastCheck: "30s ago", notes: "Hit rate 94%. No evictions." },
  celery: { name: "Celery Worker", description: "Async task queue", status: "HEALTHY", uptime: "99.90%", latency: "—", lastCheck: "1m ago", notes: "2 workers active. 0 tasks in DLQ." },
  websockets: { name: "Django Channels", description: "WebSocket real-time layer", status: "HEALTHY", uptime: "99.92%", latency: "8ms", lastCheck: "30s ago", notes: "12 active connections." },
  ml: { name: "ML Service", description: "Prediction & scoring engine", status: "HEALTHY", uptime: "99.80%", latency: "187ms", lastCheck: "1m ago", notes: "cardiac_risk_v2 active. Inference latency P95 < 500ms." },
  ai: { name: "AI / LLM Service", description: "Clinical AI assistant", status: "HEALTHY", uptime: "99.70%", latency: "850ms", lastCheck: "2m ago", notes: "LLM completions responding. All safety filters active." },
};

export default function ServiceDetailPage() {
  const { service } = useParams<{ service: string }>();
  const router = useRouter();
  const svc = SERVICE_DETAIL[service];

  if (!svc) return (
    <div className="p-6 text-center">
      <p className="text-slate-500">Service not found: {service}</p>
      <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/services")}>Back</Button>
    </div>
  );

  const isHealthy = svc.status === "HEALTHY";

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin/services")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Services
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{svc.name}</h1>
              <p className="text-sm text-slate-500">{svc.description}</p>
            </div>
            <Badge className={`border ${isHealthy ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
              {isHealthy ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <AlertTriangle className="h-3.5 w-3.5 mr-1" />}
              {svc.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Uptime", value: svc.uptime },
              { label: "Avg Latency", value: svc.latency },
              { label: "Last Check", value: svc.lastCheck },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="font-bold text-slate-800 mt-1">{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Status Notes</p>
            <p className="text-sm text-slate-700">{svc.notes}</p>
          </div>
          <Button variant="outline" className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />Refresh Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
