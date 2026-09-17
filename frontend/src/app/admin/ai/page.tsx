"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/services/apiClient";

interface MetricsResponse {
  system_status: string;
  ruflo_version: string;
  tasks: {
    total: number;
    active: number;
    completed: number;
    failed: number;
    pending_approvals: number;
  };
  performance: {
    average_agent_latency_ms: number;
    total_traces_recorded: number;
  };
  governance: {
    total_interactions_audited: number;
    active_drift_alerts: number;
    circuit_breaker_status: string;
  };
}

export default function AdminAIOverviewPage() {
  const [metrics, setMetrics] = React.useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchMetrics = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<MetricsResponse>("/ai/metrics/");
      setMetrics(res.data);
    } catch (err: any) {
      setError("Unable to load AI orchestration metrics. Backend services may be restarting.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Ruflo v{metrics?.ruflo_version || "3.42.0"} Meta-Harness
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hierarchical Swarm
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bot className="h-6 w-6 text-purple-600" />
            AI Multi-Agent Engineering & Orchestration
          </h1>
          <p className="text-sm text-slate-500">
            Real-time observability, task execution queues, agent permissions, and human governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={isLoading}
            className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Tasks</span>
            <Activity className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {isLoading ? "…" : metrics?.tasks.active ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Total Queued / Finished:</span>
            <span className="font-semibold text-slate-700">{metrics?.tasks.total ?? 0}</span>
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Approvals</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {isLoading ? "…" : metrics?.tasks.pending_approvals ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>Human-in-the-loop clinical gates</span>
          </div>
        </div>

        {/* Card 3: Avg Agent Latency */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Agent Latency</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {isLoading ? "…" : `${metrics?.performance.average_agent_latency_ms ?? 0} ms`}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>{metrics?.performance.total_traces_recorded ?? 0} recorded traces</span>
          </div>
        </div>

        {/* Card 4: Circuit Breaker */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Circuit Breaker</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-5 w-5" />
            {metrics?.governance.circuit_breaker_status || "CLOSED"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>Loop & recursion protection active</span>
          </div>
        </div>
      </div>

      {/* Subsections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Section 1: Agent Inventory */}
        <Link
          href="/admin/ai/agents"
          className="group block p-5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
              <Users className="h-5 w-5" />
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
            Agent Registry & Personas
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Inspect 17 specialized engineering, clinical safety, MLOps, explainability, and security agent definitions.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-purple-600">
            <span>View Agent Manifests</span>
            <span>→</span>
          </div>
        </Link>

        {/* Section 2: Task Queue */}
        <Link
          href="/admin/ai/tasks"
          className="group block p-5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Cpu className="h-5 w-5" />
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
            Task Queue & Approvals
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Monitor queued agent tasks, inspect state transitions (RUNNING, COMPLETED, WAITING_FOR_APPROVAL), and sign off on gates.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-blue-600">
            <span>Manage Tasks & Gates</span>
            <span>→</span>
          </div>
        </Link>

        {/* Section 3: Swarm Workflows */}
        <Link
          href="/admin/ai/workflows"
          className="group block p-5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Layers className="h-5 w-5" />
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
            Swarm Execution Traces
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Trace multi-agent coordination steps, consensus deliberations, tool call latencies, and output receipts.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-emerald-600">
            <span>Inspect Traces</span>
            <span>→</span>
          </div>
        </Link>

        {/* Section 4: Security & Tools */}
        <Link
          href="/admin/ai/security"
          className="group block p-5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-9 w-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-rose-700 transition-colors">
            Security & Tool Allowlist
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Audit prompt injection defenses, tool least-privilege matrix, forbidden capabilities, and PHI isolation.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-rose-600">
            <span>Audit Security Policy</span>
            <span>→</span>
          </div>
        </Link>

        {/* Section 5: Audit Ledger */}
        <Link
          href="/admin/ai/audit"
          className="group block p-5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Terminal className="h-5 w-5" />
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
            AI Interactions Audit Ledger
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Review immutable 21 CFR Part 11 compliant records of all clinician evaluations, safety statuses, and rationale.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-amber-600">
            <span>View Audit Trail</span>
            <span>→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
