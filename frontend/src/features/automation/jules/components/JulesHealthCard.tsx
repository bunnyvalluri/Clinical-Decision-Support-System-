"use client";

import React from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { JulesHealthResponse } from "@/types/jules";

interface Props {
  health: JulesHealthResponse | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export function JulesHealthCard({ health, loading, onRefresh }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-slate-100 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const isHealthy = health?.api_reachable && health?.enabled;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center border shadow-2xs ${
              isHealthy
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-950">
                Google Jules Automation Engine
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                v1alpha
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated bug remediation, CI analysis, and code review support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              Test Connection
            </button>
          )}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              isHealthy
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {isHealthy ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>ONLINE</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>{health?.enabled ? "DEGRADED / OFFLINE" : "DISABLED"}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 4 Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            API REACHABILITY
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black font-mono text-slate-900">
              {health?.api_reachable ? "Connected" : "Unreachable"}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {health?.latency_ms ? `${health.latency_ms} ms` : "—"}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            CONNECTED REPOS
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black font-mono text-slate-900">
              {health?.sources_count ?? 0}
            </span>
            <span className="text-[11px] font-mono text-slate-500">Sources</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            ACTIVE SESSIONS
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black font-mono text-slate-900">
              {health?.active_sessions_count ?? 0}
            </span>
            <span className="text-[11px] font-mono text-slate-500">In flight</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            CIRCUIT BREAKER
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-lg font-black font-mono ${
                health?.circuit_breaker?.is_open ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {health?.circuit_breaker?.state ?? "CLOSED"}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Failures: {health?.circuit_breaker?.failure_count ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
