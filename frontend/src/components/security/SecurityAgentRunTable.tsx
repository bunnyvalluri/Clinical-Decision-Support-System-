"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface SecurityAgentRunItem {
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
  created_at: string;
}

interface SecurityAgentRunTableProps {
  runs: SecurityAgentRunItem[];
  onCancelRun?: (id: string) => void;
}

export const SecurityAgentRunTable: React.FC<SecurityAgentRunTableProps> = ({
  runs,
  onCancelRun,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
      case "RUNNING":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">Running</Badge>;
      case "QUEUED":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Queued</Badge>;
      case "FAILED":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Failed</Badge>;
      case "CANCELLED":
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 border-slate-200">{status}</Badge>;
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "PENTEST_AGENTS":
        return <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">Pentest-Agents</Badge>;
      case "STRIX":
        return <Badge variant="outline" className="text-indigo-700 border-indigo-200 bg-indigo-50">Strix</Badge>;
      default:
        return <Badge variant="outline" className="text-cyan-700 border-cyan-200 bg-cyan-50">Bug Hunter</Badge>;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Agent & Role</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Task Objective</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tokens / Cost</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No security agent runs recorded.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex flex-col">
                      <span>{run.agent}</span>
                      <span className="text-xs text-slate-400 font-mono">ID: {run.id.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {run.target_name || "Synthetic Test Gateway"}
                  </td>
                  <td className="px-4 py-3 text-slate-800 max-w-xs truncate" title={run.task}>
                    {run.task}
                  </td>
                  <td className="px-4 py-3">
                    {getProviderBadge(run.provider)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(run.status)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>{run.token_usage?.total_tokens || 0} tokens</div>
                    <div className="text-slate-400">${(run.token_usage?.estimated_cost || 0).toFixed(4)}</div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link href={`/admin/security/agents/${run.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs bg-white text-slate-700 hover:bg-slate-50">
                        View Trace
                      </Button>
                    </Link>
                    {run.status === "RUNNING" && onCancelRun && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs bg-rose-600 hover:bg-rose-700"
                        onClick={() => onCancelRun(run.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
