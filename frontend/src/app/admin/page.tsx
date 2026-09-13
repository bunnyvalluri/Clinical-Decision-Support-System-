"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Cpu,
  Database,
  Lock,
  Radio,
  Server,
  ShieldAlert,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/authStore";

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  return (
    <Shell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-purple-600" />
              Administrative Governance & Security Operations
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              System health monitoring, model lifecycles, and HIPAA compliance audit logging.
            </p>
          </div>

          <Badge variant="outline" className="text-xs font-mono bg-white border-slate-200 text-slate-700 shadow-sm self-start sm:self-auto">
            Role: {user?.role || "CLINICIAN"}
          </Badge>
        </div>

        {/* Core Administrative Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="p-2.5 w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mb-1">
                <Cpu className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                Model Registry & Governance
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Manage candidate algorithms, review ROC-AUC calibration, and trigger retraining.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Link href="/admin/models">
                <Button variant="default" size="sm" className="w-full text-xs gap-1.5 shadow-sm">
                  <span>Manage Models</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="p-2.5 w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mb-1">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                HIPAA Audit Trails
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Inspect immutable access logs, prediction inquiries, and physician overrides.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Link href="/admin/audit">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700">
                  <span>View Audit Ledger</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="p-2.5 w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-1">
                <Server className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                System Infrastructure
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Inspect Neon PostgreSQL pooling, Celery workers, and Daphne ASGI status.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Link href="/settings">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700">
                  <span>System Diagnostics</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Live Cluster Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-500">Database Connection</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-sm font-bold text-slate-900 font-mono">Neon Pool (20 conn)</p>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-500">Redis Broker</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-sm font-bold text-slate-900 font-mono">Upstash TLS (Healthy)</p>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-500">Celery Workers</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-sm font-bold text-slate-900 font-mono">4 Active Threads</p>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-500">ASGI Channel Layer</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-sm font-bold text-slate-900 font-mono">Daphne 4.1 Online</p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
