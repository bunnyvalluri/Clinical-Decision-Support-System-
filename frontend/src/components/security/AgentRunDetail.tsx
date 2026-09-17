"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export interface AgentRunDetailData {
  id: string;
  provider: string;
  agent: string;
  task: string;
  target_name?: string;
  status: string;
  start_time?: string;
  end_time?: string;
  token_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    estimated_cost?: number;
  };
  result?: Record<string, any>;
  error?: string;
  workspace_path?: string;
  correlation_id?: string;
}

interface AgentRunDetailProps {
  run: AgentRunDetailData;
}

export const AgentRunDetail: React.FC<AgentRunDetailProps> = ({ run }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Security Agent Run
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            {run.agent} — {run.provider}
          </h2>
          <div className="font-mono text-xs text-slate-400 mt-0.5">Run ID: {run.id}</div>
        </div>
        <Badge
          className={
            run.status === "COMPLETED"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : run.status === "RUNNING"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }
        >
          {run.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3 bg-slate-50 rounded border border-slate-100">
          <span className="font-semibold text-slate-700">Target:</span>{" "}
          <span className="text-slate-900">{run.target_name || "Synthetic Gateway"}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded border border-slate-100">
          <span className="font-semibold text-slate-700">Correlation ID:</span>{" "}
          <span className="font-mono text-slate-900">{run.correlation_id || "N/A"}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded border border-slate-100">
          <span className="font-semibold text-slate-700">Started:</span>{" "}
          <span className="text-slate-900">{run.start_time ? new Date(run.start_time).toLocaleString() : "Pending"}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded border border-slate-100">
          <span className="font-semibold text-slate-700">Finished:</span>{" "}
          <span className="text-slate-900">{run.end_time ? new Date(run.end_time).toLocaleString() : "In Progress"}</span>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Objective / Task</h4>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800">
          {run.task}
        </div>
      </div>

      {run.error && (
        <div>
          <h4 className="text-xs font-semibold text-rose-700 uppercase mb-2">Failure Details</h4>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 font-mono">
            {run.error}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Normalized Output Data</h4>
        <pre className="p-3 bg-slate-900 text-slate-50 rounded text-[11px] overflow-x-auto max-h-60">
          {JSON.stringify(run.result || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
};
