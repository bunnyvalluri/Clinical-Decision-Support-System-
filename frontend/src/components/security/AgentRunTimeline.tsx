"use client";

import React from "react";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  stage: string;
  description: string;
  status: "success" | "pending" | "failed" | "in_progress";
}

interface AgentRunTimelineProps {
  events: TimelineEvent[];
}

export const AgentRunTimeline: React.FC<AgentRunTimelineProps> = ({ events }) => {
  const getDotClass = (status: TimelineEvent["status"]) => {
    switch (status) {
      case "success":
        return "bg-emerald-500 ring-emerald-100";
      case "in_progress":
        return "bg-blue-500 ring-blue-100 animate-pulse";
      case "failed":
        return "bg-rose-500 ring-rose-100";
      default:
        return "bg-slate-300 ring-slate-100";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">
        Execution Lifecycle Timeline
      </h3>
      <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
        {events.map((evt) => (
          <div key={evt.id} className="relative group">
            <span
              className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full ring-4 ${getDotClass(
                evt.status
              )}`}
            />
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="font-medium text-sm text-slate-800">{evt.stage}</span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(evt.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{evt.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
