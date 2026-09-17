"use client";

import * as React from "react";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Wrench, Shield } from "lucide-react";
import { ToolTraceStep } from "@/services/ai/agentService";

interface ToolActivityStreamProps {
  steps: ToolTraceStep[];
  isLoading?: boolean;
}

export const ToolActivityStream: React.FC<ToolActivityStreamProps> = ({ steps, isLoading }) => {
  if (!steps || steps.length === 0) {
    if (isLoading) {
      return (
        <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
          <Clock className="h-4 w-4 animate-spin text-blue-600" />
          <span>Agent planning and inspecting authorized clinical tools...</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-2 text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 font-medium text-slate-700">
        <div className="flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5 text-blue-600" />
          <span>Operational Tool Execution Trace</span>
        </div>
        <span className="text-[11px] text-slate-400">Deterministic Audit Record</span>
      </div>

      <div className="space-y-1.5">
        {steps.map((step, idx) => {
          const isCompleted = step.status === "COMPLETED";
          const isDenied = step.status === "DENIED";
          const isFailed = step.status === "FAILED";
          const isRequested = step.status === "REQUESTED";

          return (
            <div
              key={idx}
              className="flex items-start justify-between p-2 rounded-md bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-start gap-2">
                {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
                {isDenied && <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                {isFailed && <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />}
                {isRequested && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}

                <div>
                  <div className="font-medium text-slate-800 flex items-center gap-2">
                    <code>{step.tool_name}</code>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isDenied
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : isFailed
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {isCompleted ? "✓ Authorized & Executed" : step.status}
                    </span>
                  </div>

                  {step.error && (
                    <div className="text-rose-600 text-[11px] mt-0.5">{step.error}</div>
                  )}

                  {step.arguments && Object.keys(step.arguments).length > 0 && (
                    <div className="text-slate-500 text-[11px] mt-0.5 font-mono">
                      Args: {JSON.stringify(step.arguments)}
                    </div>
                  )}
                </div>
              </div>

              {step.latency_ms !== undefined && (
                <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
                  {step.latency_ms.toFixed(1)}ms
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToolActivityStream;
