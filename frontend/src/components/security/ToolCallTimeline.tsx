"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export interface ToolCallItem {
  timestamp: string;
  tool: string;
  args: Record<string, any>;
}

interface ToolCallTimelineProps {
  toolCalls: ToolCallItem[];
}

export const ToolCallTimeline: React.FC<ToolCallTimelineProps> = ({ toolCalls }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Audited Tool Invocations
        </h3>
        <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">
          {toolCalls.length} Invocations
        </Badge>
      </div>
      {toolCalls.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No tool calls executed in this session.</p>
      ) : (
        <div className="space-y-3">
          {toolCalls.map((tc, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-100 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-700 font-medium mb-1">
                <span className="text-purple-700">call: {tc.tool}()</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(tc.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-[11px] text-slate-600 overflow-x-auto bg-white p-2 rounded border border-slate-200">
                {JSON.stringify(tc.args, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
