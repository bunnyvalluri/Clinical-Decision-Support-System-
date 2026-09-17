"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface WorktreeStatusCardProps {
  worktreePath: string;
  runId: string;
  isIsolated: boolean;
}

export const WorktreeStatusCard: React.FC<WorktreeStatusCardProps> = ({
  worktreePath,
  runId,
  isIsolated,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
          Worktree Sandbox
        </span>
        <Badge
          className={
            isIsolated
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }
        >
          {isIsolated ? "Isolated Sandbox" : "Uncontained"}
        </Badge>
      </div>
      <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded border border-slate-100 overflow-x-auto">
        {worktreePath || `worktrees/${runId}/`}
      </div>
      <p className="text-[11px] text-slate-400">
        Primary Git checkout protected. Human uncommitted changes are shielded.
      </p>
    </div>
  );
};
