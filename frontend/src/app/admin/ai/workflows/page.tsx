"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/services/apiClient";

interface TraceItem {
  id: string;
  agent_run_id: string;
  workflow_id: string;
  role: string;
  agent_name: string;
  agent_version: string;
  tool_calls: Array<{ tool?: string; verdict?: string; [key: string]: any }>;
  input_summary: string;
  output_summary: string;
  status: string;
  start_time: string;
  latency_ms: number;
  failure_reason?: string;
  approval_state: string;
  user_name: string;
}

export default function AdminAIWorkflowsPage() {
  const [traces, setTraces] = React.useState<TraceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  const fetchTraces = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ count: number; results: TraceItem[] }>("/ai/traces/");
      setTraces(res.data?.results || []);
    } catch {
      // Keep empty array
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTraces();
  }, [fetchTraces]);

  const filteredTraces = React.useMemo(() => {
    if (!searchTerm) return traces;
    const lower = searchTerm.toLowerCase();
    return traces.filter(
      (t) =>
        t.agent_name.toLowerCase().includes(lower) ||
        t.workflow_id.toLowerCase().includes(lower) ||
        t.input_summary.toLowerCase().includes(lower) ||
        t.output_summary.toLowerCase().includes(lower)
    );
  }, [traces, searchTerm]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white min-h-screen">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <Link href="/admin/ai" className="hover:text-purple-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          AI Overview
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Swarm Execution Traces</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-6 w-6 text-purple-600" />
            Ruflo Multi-Agent Execution Traces
          </h1>
          <p className="text-sm text-slate-500">
            Granular step-by-step agent deliberation ledger, tool execution latencies, and output receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTraces}
            disabled={isLoading}
            className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by agent, workflow ID, or text…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {/* Trace Stream */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading execution traces from PostgreSQL…</div>
      ) : filteredTraces.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
          No agent execution traces recorded yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTraces.map((trace) => (
            <div
              key={trace.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-purple-200 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{trace.agent_name}</span>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    v{trace.agent_version}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">wf:{trace.workflow_id.slice(0, 8)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {trace.latency_ms.toFixed(1)} ms
                  </span>
                  <Badge
                    className={
                      trace.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-rose-100 text-rose-800 border-rose-200"
                    }
                  >
                    {trace.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Input Summary
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-50 text-slate-700 font-mono text-[11px] leading-relaxed border border-slate-100">
                    {trace.input_summary || "(No payload input)"}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Output Summary / Deliberation
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-50 text-slate-800 text-[11px] leading-relaxed border border-slate-100 whitespace-pre-line">
                    {trace.output_summary || "(No output recorded)"}
                  </div>
                </div>
              </div>

              {trace.tool_calls && trace.tool_calls.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">Tool Calls:</span>
                  <div className="flex flex-wrap gap-1">
                    {trace.tool_calls.map((tc, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono"
                      >
                        {tc.tool || "tool"}
                        {tc.verdict ? ` [${tc.verdict}]` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
