"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export interface ProviderHealth {
  service: string;
  version: string;
  pinned_commit: string;
  is_enabled: boolean;
  active_runs: number;
  completed_runs: number;
  failed_runs: number;
}

interface ProviderStatusProps {
  status: ProviderHealth;
}

export const ProviderStatus: React.FC<ProviderStatusProps> = ({ status }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="text-xs font-semibold text-slate-500 uppercase">Provider Version</div>
        <div className="text-xl font-bold text-slate-900 mt-1">v{status.version}</div>
        <div className="text-[10px] text-slate-400 font-mono mt-1">
          Commit: {status.pinned_commit.slice(0, 10)}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="text-xs font-semibold text-slate-500 uppercase">Engine Status</div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              status.is_enabled ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          <span className="text-xl font-bold text-slate-900">
            {status.is_enabled ? "Operational" : "Disabled"}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          {status.is_enabled ? "Default Deny Active" : "Emergency Kill Switch"}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="text-xs font-semibold text-slate-500 uppercase">Active Agent Runs</div>
        <div className="text-xl font-bold text-blue-600 mt-1">{status.active_runs}</div>
        <div className="text-[10px] text-slate-400 mt-1">Isolated Sandbox Workspaces</div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="text-xs font-semibold text-slate-500 uppercase">Success / Failed</div>
        <div className="text-xl font-bold text-slate-900 mt-1">
          <span className="text-emerald-600">{status.completed_runs}</span> /{" "}
          <span className="text-rose-600">{status.failed_runs}</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">Verified Audit Records</div>
      </div>
    </div>
  );
};
