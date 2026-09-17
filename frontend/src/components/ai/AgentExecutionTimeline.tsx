"use client";

import * as React from "react";
import { GitCommit, Check, Clock } from "lucide-react";

interface Step {
  title: string;
  status: "COMPLETED" | "RUNNING" | "PENDING";
  agent: string;
}

interface AgentExecutionTimelineProps {
  steps: Step[];
}

export const AgentExecutionTimeline: React.FC<AgentExecutionTimelineProps> = ({
  steps,
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-xs font-semibold text-slate-800 mb-2.5 flex items-center gap-1.5">
        <GitCommit className="h-3.5 w-3.5 text-blue-600" />
        Ruflo Multi-Agent Workflow State
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {step.status === "COMPLETED" ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-2.5 w-2.5" />
                </span>
              ) : step.status === "RUNNING" ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-700 animate-pulse">
                  <Clock className="h-2.5 w-2.5" />
                </span>
              ) : (
                <span className="h-4 w-4 rounded-full bg-slate-100 border border-slate-300" />
              )}
              <span className="font-medium text-slate-800">{step.title}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
              {step.agent}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
