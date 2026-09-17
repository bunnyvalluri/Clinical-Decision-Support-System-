"use client";

import * as React from "react";
import { Terminal, CheckCircle2, XCircle } from "lucide-react";

interface ToolExecution {
  tool_name: string;
  success: boolean;
  latency_ms?: number;
}

interface ToolExecutionCardProps {
  executions: ToolExecution[];
}

export const ToolExecutionCard: React.FC<ToolExecutionCardProps> = ({
  executions,
}) => {
  if (!executions || executions.length === 0) return null;

  return (
    <div className="mt-2.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-2">
        <Terminal className="h-3.5 w-3.5 text-slate-500" />
        Verified Tool Executions ({executions.length})
      </div>
      <div className="space-y-1.5">
        {executions.map((ex, i) => (
          <div
            key={`${ex.tool_name}-${i}`}
            className="flex items-center justify-between rounded bg-slate-50 px-2.5 py-1.5 text-xs border border-slate-100"
          >
            <div className="flex items-center gap-2">
              {ex.success ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-rose-600" />
              )}
              <span className="font-mono text-xs text-slate-800 font-medium">
                {ex.tool_name}
              </span>
            </div>
            {ex.latency_ms !== undefined && (
              <span className="text-[11px] text-slate-400 font-mono">
                {Math.round(ex.latency_ms)}ms
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
