"use client";

import React from "react";
import Link from "next/link";
import { Activity, CheckCircle2, AlertTriangle, XCircle, ChevronRight } from "lucide-react";

type ServiceStatus = "HEALTHY" | "DEGRADED" | "DOWN";

const SERVICES: { name: string; id: string; description: string }[] = [
  { name: "Django API", id: "api", description: "REST API — Django + DRF" },
  { name: "Neon PostgreSQL", id: "database", description: "Primary Lakebase database" },
  { name: "Upstash Redis", id: "redis", description: "Cache & message broker" },
  { name: "Celery Worker", id: "celery", description: "Async task queue" },
  { name: "Django Channels", id: "websockets", description: "WebSocket real-time layer" },
  { name: "ML Service", id: "ml", description: "Prediction & scoring engine" },
  { name: "AI / LLM Service", id: "ai", description: "Clinical AI assistant" },
];

const STATUS_CONFIG: Record<ServiceStatus, { icon: typeof CheckCircle2; color: string; bg: string; dot: string }> = {
  HEALTHY: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  DEGRADED: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
  DOWN: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", dot: "bg-rose-500" },
};

// Simulate statuses (real would come from backend health endpoint)
const DEMO_STATUSES: Record<string, ServiceStatus> = {
  api: "HEALTHY", database: "HEALTHY", redis: "HEALTHY", celery: "HEALTHY",
  websockets: "HEALTHY", ml: "HEALTHY", ai: "HEALTHY",
};

export default function AdminServicesPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Services</h1>
        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          All systems operational
        </div>
      </div>
      <div className="space-y-2">
        {SERVICES.map(({ name, id, description }) => {
          const status = DEMO_STATUSES[id] ?? "HEALTHY";
          const conf = STATUS_CONFIG[status];
          const Icon = conf.icon;
          return (
            <Link key={id} href={`/admin/services/${id}`} className="block">
              <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:shadow-sm transition-all flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${conf.bg}`}>
                  <Icon className={`h-5 w-5 ${conf.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{name}</p>
                  <p className="text-xs text-slate-500">{description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`h-2 w-2 rounded-full ${conf.dot}`} />
                  <span className={`text-xs font-medium ${conf.color}`}>{status}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
