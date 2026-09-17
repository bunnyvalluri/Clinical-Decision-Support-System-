"use client";

import React from "react";

export interface LoopTimelineStep {
  id: string;
  stage: string;
  description: string;
  timestamp: string;
  status: "success" | "pending" | "running" | "failed";
}

interface LoopRunTimelineProps {
  steps: LoopTimelineStep[];
}

export const LoopRunTimeline: React.FC<LoopRunTimelineProps> = ({ steps }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">
        Loop Execution Pipeline
      </h3>
      <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
        {steps.map((s) => (
          <div key={s.id} className="relative">
            <span
              className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full ring-4 ${
                s.status === "success"
                  ? "bg-emerald-500 ring-emerald-100"
                  : s.status === "running"
                  ? "bg-blue-500 ring-blue-100 animate-pulse"
                  : s.status === "failed"
                  ? "bg-rose-500 ring-rose-100"
                  : "bg-slate-300 ring-slate-100"
              }`}
            />
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-sm text-slate-900">{s.stage}</span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(s.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
